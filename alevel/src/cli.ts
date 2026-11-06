/// <reference lib="deno.ns" />
import { parse } from "https://deno.land/std@0.192.0/csv/mod.ts";

interface Session {
  examDate: string; examTime: string; subject: string; location: string; minutes: string;
  students: string[]; grade?: string; classNum?: string; supervisionTime?: string;
  numOfStudents?: string; [key: string]: unknown;
}

export function buildIndexes(data: { sessions: Session[] }) {
  if (!data || !Array.isArray(data.sessions)) throw new Error('考表必须包含 sessions 数组');
  const students: Record<string, Session[]> = Object.create(null);
  for (const [index, source] of data.sessions.entries()) {
    for (const key of ['examDate', 'examTime', 'subject', 'location', 'minutes']) {
      if (typeof source[key] !== 'string' || !(source[key] as string).trim()) throw new Error(`第 ${index + 1} 场缺少 ${key}`);
    }
    const date = source.examDate.replace(/\./g, '-');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date + 'T00:00:00Z')) || new Date(date + 'T00:00:00Z').toISOString().slice(0,10) !== date) throw new Error(`第 ${index + 1} 场日期无效`);
    const match = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/.exec(source.examTime);
    if (!match || +match[1] > 23 || +match[3] > 23 || +match[2] > 59 || +match[4] > 59) throw new Error(`第 ${index + 1} 场时间格式应为 09:00-10:30`);
    const duration = (+match[3] - +match[1]) * 60 + +match[4] - +match[2];
    if (duration <= 0 || duration !== Number(source.minutes)) throw new Error(`第 ${index + 1} 场时长与时间不一致`);
    if (source.supervisionTime !== undefined) {
      const holding = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/.exec(source.supervisionTime);
      if (!holding || +holding[1] > 23 || +holding[3] > 23 || +holding[2] > 59 || +holding[4] > 59
          || (+holding[3] * 60 + +holding[4]) <= (+holding[1] * 60 + +holding[2])
          || (+holding[3] * 60 + +holding[4]) > (+match[1] * 60 + +match[2])) {
        throw new Error(`第 ${index + 1} 场中心监管时间无效或与正式考试重叠`);
      }
    }
    if (!Array.isArray(source.students) || !source.students.length || source.students.some(n => typeof n !== 'string' || !n.trim())) throw new Error(`第 ${index + 1} 场需要有效的学生名单`);
    const session = { ...source, examDate: date, students: [...new Set(source.students.map(n => n.trim()))], grade: source.grade || '', classNum: source.classNum || '' };
    session.numOfStudents = String(session.students.length);
    for (const name of session.students) (students[name] ||= []).push(session);
  }
  for (const list of Object.values(students)) list.sort((a,b) => `${a.examDate} ${a.examTime}`.localeCompare(`${b.examDate} ${b.examTime}`));
  return { students };
}

export async function processFile(input: string, output: string, namesOutput?: string) {
  const rows = parse(await Deno.readTextFile(input), { skipFirstRow: true, trimLeadingSpace: true });
  const sessions = rows.map(row => {
    const session: Record<string, unknown> = {};
    const students: string[] = [];
    for (const [key, value] of Object.entries(row)) {
      if (/^s\d+$/.test(key)) { if (value.trim()) students.push(value.trim()); }
      else if (key === "supervisionTime" && !value) continue;
      else if (["sourceRow", "sourceNumber", "sourceStudentCount"].includes(key)) session[key] = Number(value);
      else session[key] = key === "proctor2" && !value ? null : value;
    }
    return { ...session, students } as Session;
  });
  const { students } = buildIndexes({ sessions });
  await Deno.writeTextFile(output, JSON.stringify(students, null, 2) + "\n");
  if (namesOutput) await Deno.writeTextFile(namesOutput, Object.keys(students).sort().join("\n") + "\n");
  console.log(`已生成 ${Object.keys(students).length} 位学生的考试安排。`);
}

if (import.meta.main) {
  const [input, output, names] = Deno.args;
  if (!input || !output) throw new Error("用法：deno run --allow-read --allow-write src/cli.ts input.csv public/testSessionsByStudent.json public/studentNamesList.txt");
  await processFile(input, output, names);
}
