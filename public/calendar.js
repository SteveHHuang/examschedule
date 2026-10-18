// Shared by both browser pages and the Deno CLI; no DOM or Deno APIs here.
/** @typedef {import('../src/types.ts').TestSession} TestSession */
/** @typedef {import('../src/types.ts').CalendarExportOptions} CalendarExportOptions */

/** @param {number} value */
function pad2(value) {
    return String(value).padStart(2, "0");
}

/** @param {string} value */
function escapeText(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/\r\n|\n|\r/g, "\\n")
        .replace(/;/g, "\\;").replace(/,/g, "\\,");
}

/** Fold at 75 UTF-8 octets, including the continuation space.
 * @param {string} line
 */
function foldLine(line) {
    const encoder = new TextEncoder();
    let result = "";
    let bytes = 0;
    for (const character of line) {
        const length = encoder.encode(character).length;
        if (bytes + length > 75) {
            result += "\r\n ";
            bytes = 1;
        }
        result += character;
        bytes += length;
    }
    return result;
}

/** @param {string} value */
export function normalizeDate(value) {
    const match = /^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/.exec(value.trim());
    if (!match) throw new Error("Unrecognized examDate: " + value);
    const [year, month, day] = match.slice(1).map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
        year < 1900 || date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day
    ) {
        throw new Error("Invalid examDate: " + value);
    }
    return { year, month, day };
}

/** @param {string} value */
function parseTime(value) {
    const time = value.trim();
    if (!/^(?:\d{1,2}:\d{2}|\d{3,4})$/.test(time)) {
        throw new Error("Unrecognized time: " + value);
    }
    const digits = time.replace(":", "").padStart(4, "0");
    const hour = Number(digits.slice(0, 2));
    const minute = Number(digits.slice(2));
    if (hour > 23 || minute > 59) throw new Error("Invalid time: " + value);
    return { hour, minute };
}

/** @param {string} value */
export function parseExamTime(value) {
    const parts = value.trim().split(/[-–—]/);
    if (parts.length !== 2) throw new Error("Unrecognized examTime: " + value);
    const start = parseTime(parts[0]);
    const end = parseTime(parts[1]);
    if (end.hour * 60 + end.minute <= start.hour * 60 + start.minute) {
        throw new Error("Exam end must be after start: " + value);
    }
    return {
        startHour: start.hour,
        startMin: start.minute,
        endHour: end.hour,
        endMin: end.minute,
    };
}

/** @param {TestSession} session */
function dateTimes(session) {
    const { year, month, day } = normalizeDate(session.examDate);
    const { startHour, startMin, endHour, endMin } = parseExamTime(
        session.examTime,
    );
    const date = String(year) + pad2(month) + pad2(day) + "T";
    return {
        start: date + pad2(startHour) + pad2(startMin) + "00",
        end: date + pad2(endHour) + pad2(endMin) + "00",
    };
}

/** Only used for download filenames, never for event identity.
 * @param {string} value
 */
export function safeFilename(value) {
    return String(value).trim().replace(/\s+/g, "-")
        .replace(/[^A-Za-z0-9._-]/g, "-").replace(/-+/g, "-").replace(
            /^-|-$/g,
            "",
        );
}

/** @param {string} ownerName
 * @param {TestSession[]} sessions
 * @param {CalendarExportOptions} options
 */
export function generateIcsForSessions(ownerName, sessions, options) {
    const timezone = options.timezone ?? "Asia/Shanghai";
    const namespace = safeFilename(options.uidNamespace ?? "examschedule") ||
        "examschedule";
    const kind = options.kind ?? "student";
    const english = options.locale !== "zh";
    const lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//examschedule//ics export//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:" + escapeText(options.calendarName),
        "X-WR-TIMEZONE:" + escapeText(timezone),
    ];
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(
        /\.\d{3}Z$/,
        "Z",
    );
    const events = sessions.map((session) => ({
        session,
        ...dateTimes(session),
    }))
        .sort((a, b) =>
            a.start.localeCompare(b.start) ||
            a.session.subject.localeCompare(b.session.subject)
        );
    for (const { session: s, start, end } of events) {
        // Lossless UTF-8 identity: Chinese names and subjects remain distinct.
        // Presentation language and roster visibility do not change event identity.
        const identity = JSON.stringify([
            kind,
            ownerName.trim(),
            start,
            end,
            s.subject,
            s.grade,
            s.classNum,
            s.location,
        ]);
        const uid = Array.from(new TextEncoder().encode(identity), (b) =>
            b.toString(16).padStart(2, "0")).join("") + "@" + namespace;
        const proctors = [s.proctor1, s.proctor2].filter(Boolean).join(" / ");
        const summary =
            (kind === "proctor" ? (english ? "Proctor: " : "监考: ") : "") +
            s.subject + " (" + s.grade + s.classNum + ")";
        const description = english
            ? [
                (kind === "proctor" ? "Proctor: " : "Student: ") + ownerName,
                "Time: " + s.examDate + " " + s.examTime,
                "Duration: " + s.minutes + " minutes",
                "Proctor(s): " + proctors,
                "Students: " + s.numOfStudents,
            ]
            : [
                (kind === "proctor" ? "监考老师: " : "考生: ") + ownerName,
                "时间: " + s.examDate + " " + s.examTime,
                "时长: " + s.minutes + " 分钟",
                "监考: " + proctors,
                "学生人数: " + s.numOfStudents,
            ];
        if (options.includeRoster) {
            description.push(
                (english ? "Roster: " : "学生名单: ") +
                    (s.students || []).join(", "),
            );
        }
        lines.push(
            "BEGIN:VEVENT",
            "UID:" + uid,
            "DTSTAMP:" + stamp,
            "DTSTART;TZID=" + escapeText(timezone) + ":" + start,
            "DTEND;TZID=" + escapeText(timezone) + ":" + end,
            "SUMMARY:" + escapeText(summary),
            "LOCATION:" + escapeText(s.location),
            "DESCRIPTION:" + escapeText(description.join("\n")),
            "END:VEVENT",
        );
    }
    lines.push("END:VCALENDAR");
    return lines.map(foldLine).join("\r\n") + "\r\n";
}
