/// <reference lib="deno.ns" />
const test = Deno.test;
import { assert as ok, assertEquals as equal, assertNotEquals as notEqual, assertThrows as throws, assertMatch as match } from 'https://deno.land/std@0.192.0/testing/asserts.ts';
const assert = { ok, equal, notEqual, throws, match, deepEqual: equal };
import { buildIndexes } from '../src/cli.ts';
import { expandCalendarSessions, foldIcsLine, safeUid } from '../public/web/calendar-utils.js';
import { getSessionLocations } from '../public/web/session-locations.js';
const data = JSON.parse(Deno.readTextFileSync(new URL('./fixtures/sessions.json', import.meta.url)));
test('A Level data generates student schedules with correct counts and subjects', () => {
  const { students } = buildIndexes(data);
  assert.equal(students['示例同学'].length, 6);
  assert.equal(students['Alex Demo'].length, 3);
  assert.deepEqual(students['示例同学'][0].students, ['示例同学','示例同学二']);
  assert.equal(students['示例同学'][0].numOfStudents, '2');
  assert.ok(students['示例同学'][0].subject.includes('9709/12'));
});
test('repeated roster names do not duplicate schedules or inflate student counts', () => {
  const fixture = structuredClone(data); fixture.sessions[0].students.push('示例同学');
  const result = buildIndexes(fixture);
  assert.equal(result.students['示例同学'].length, 6);
  assert.equal(result.students['示例同学'][0].numOfStudents, '2');
});
test('invalid dates and duration mismatches fail before generated files are written', () => {
  const badDate = structuredClone(data); badDate.sessions[0].examDate='2027-02-29';
  assert.throws(() => buildIndexes(badDate), /日期无效/);
  const badDuration = structuredClone(data); badDuration.sessions[0].minutes='1';
  assert.throws(() => buildIndexes(badDuration), /时长/);
});
test('names matching object properties are indexed as literal names', () => {
  const fixture = structuredClone(data); fixture.sessions[0].students=['__proto__','toString'];
  const { students } = buildIndexes(fixture);
  assert.equal(Object.getPrototypeOf(students), null);
  assert.equal(students['__proto__'].length, 1);
  assert.equal(students.toString.length, 1);
});
test('supervised holding is a separate calendar event, preserving the exam start and duration', () => {
  const exam = { ...data.sessions[0], examTime: '10:35-11:50', minutes: '75', supervisionTime: '09:00-10:15' };
  const { students } = buildIndexes({ sessions: [exam] });
  assert.equal(students['示例同学'].length, 1);
  const events = expandCalendarSessions([exam]);
  assert.equal(events.length, 2);
  assert.equal(events[0].examTime, '09:00-10:15');
  assert.match(events[0].subject, /中心监管/);
  assert.equal(events[0].minutes, '75');
  assert.equal(events[1].examTime, '10:35-11:50');
  assert.equal(events[1].minutes, '75');
  assert.equal(exam.subject, data.sessions[0].subject);
  assert.match(expandCalendarSessions([exam], 'en')[0].subject, /Supervised holding/);
});
test('invalid or overlapping supervision times are rejected', () => {
  const exam = { ...data.sessions[0], examTime: '10:35-11:50', minutes: '75' };
  for (const supervisionTime of ['25:00-26:00', '09:00-10:60', '10:00-09:00', '09:00-11:00', 'invalid']) {
    assert.throws(() => buildIndexes({ sessions: [{ ...exam, supervisionTime }] }), /中心监管时间/);
  }
});
test('calendar preserves Chinese identities and folds lines by UTF-8 bytes', () => {
  assert.notEqual(safeUid('示例同学'), safeUid('示例同学二'));
  const line = 'DESCRIPTION:' + '考试学生名单😀'.repeat(30);
  const folded = foldIcsLine(line);
  assert.equal(folded.replace(/\r\n /g, ''), line);
  for (const part of folded.split('\r\n')) assert.ok(new TextEncoder().encode(part).length <= 75);
});
test('two Excel location lines assign separate holding and examination rooms', () => {
  for (const newline of ['\n', '\r\n', '\r']) {
    const exam = { ...data.sessions[0], supervisionTime: '07:00-08:00', location: ` 监管教室 A ${newline} 正式教室 B ` };
    assert.deepEqual(getSessionLocations(exam), { supervisionLocation: '监管教室 A', examLocation: '正式教室 B' });
    const events = expandCalendarSessions([exam]);
    assert.equal(events[0].location, '监管教室 A');
    assert.equal(events[1].location, '正式教室 B');
    assert.equal(exam.location, ` 监管教室 A ${newline} 正式教室 B `);
  }
});
test('a single location is only an examination room, including blank surrounding lines', () => {
  for (const location of ['1505', ' 1505 ', '\n1505\r\n']) {
    const exam = { ...data.sessions[0], supervisionTime: '07:00-08:00', location };
    assert.deepEqual(getSessionLocations(exam), { supervisionLocation: '', examLocation: '1505' });
    const events = expandCalendarSessions([exam]);
    assert.equal(events[0].location, '');
    assert.equal(events[1].location, '1505');
  }
});
test('ordinary exams keep their original location without a holding room', () => {
  const exam = { ...data.sessions[0], location: '教室 A\n教室 B' };
  assert.deepEqual(getSessionLocations(exam), { supervisionLocation: '', examLocation: exam.location });
  assert.deepEqual(expandCalendarSessions([exam]), [exam]);
});
