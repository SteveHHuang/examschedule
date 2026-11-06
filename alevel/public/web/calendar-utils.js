import { getSessionLocations } from './session-locations.js';

// Keep supervised holding separate from the examination itself in calendars.
export function expandCalendarSessions(sessions, locale = 'zh') {
  return sessions.flatMap(session => {
    if (!session.supervisionTime) return [session];
    const { supervisionLocation, examLocation } = getSessionLocations(session);
    const [sh, sm, eh, em] = session.supervisionTime.split(/[:-]/).map(Number);
    return [{
      ...session,
      examTime: session.supervisionTime,
      minutes: String((eh - sh) * 60 + em - sm),
      subject: `${locale === 'en' ? 'Supervised holding' : '中心监管'}: ${session.subject}`,
      subjectName: `${locale === 'en' ? 'Supervised holding' : '中心监管'}: ${session.subjectName || session.subject}`,
      location: supervisionLocation,
      supervisionTime: undefined,
    }, { ...session, location: examLocation }];
  });
}

export function foldIcsLine(line) {
  const encoder = new TextEncoder();
  let result = '';
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > 75) {
      result += '\r\n ';
      bytes = 1;
    }
    result += char;
    bytes += size;
  }
  return result;
}

export function safeUid(input) {
  // Different Chinese names must have different event IDs and filenames.
  return encodeURIComponent(String(input).trim());
}
