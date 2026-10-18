import { generateIcsForSessions } from "../src/ics.ts";
import { generateIcsForSessions as browserCalendar } from "../public/calendar.js";
import { parseSessions } from "../src/sessions.ts";
import { assert, csv, equal, record, throws } from "./helpers.ts";
import type { CalendarExportOptions } from "../src/types.ts";

const session = parseSessions(csv([record]))[0];
const options: CalendarExportOptions = {
    calendarName: "测试日历",
    locale: "zh",
};
function unfold(value: string) {
    return value.replace(/\r\n[ \t]/g, "");
}
function uids(value: string) {
    return [...unfold(value).matchAll(/^UID:(.+)\r?$/gm)].map((m) =>
        m[1].trim()
    );
}

Deno.test("CLI and browser use the same calendar generator", () => {
    assert(generateIcsForSessions === browserCalendar);
});

Deno.test("Chinese owners, subjects, rooms and roles have distinct stable event identities", () => {
    const first = generateIcsForSessions("张三", [session, {
        ...session,
        subject: "语文",
    }, { ...session, location: "A102" }], options);
    equal(new Set(uids(first)).size, 3);
    assert(
        uids(first)[0] !==
            uids(generateIcsForSessions("李四", [session], options))[0],
    );
    assert(
        uids(first)[0] !==
            uids(
                generateIcsForSessions("张三", [session], {
                    ...options,
                    kind: "proctor",
                }),
            )[0],
    );
    equal(
        uids(first),
        uids(
            generateIcsForSessions("张三", [session, {
                ...session,
                subject: "语文",
            }, { ...session, location: "A102" }], {
                ...options,
                locale: "en",
                includeRoster: true,
            }),
        ),
    );
});

Deno.test("UTF-8 folding respects 75 octets including continuation spaces and preserves characters", () => {
    const long = { ...session, subject: "数学😀".repeat(50) };
    const result = generateIcsForSessions("张三", [long], options);
    for (const line of result.split("\r\n")) {
        assert(new TextEncoder().encode(line).length <= 75);
    }
    assert(unfold(result).includes("SUMMARY:" + long.subject));
    assert(!result.includes("\uFFFD"));
    assert(result.endsWith("END:VCALENDAR\r\n"));
});

Deno.test("calendar escapes text and only includes the roster when requested", () => {
    const s = { ...session, location: "Room, A;B\\C\nD" };
    const hidden = unfold(generateIcsForSessions("张三", [s], options));
    assert(hidden.includes("LOCATION:Room\\, A\\;B\\\\C\\nD"));
    assert(!hidden.includes("学生名单:"));
    assert(
        unfold(
            generateIcsForSessions("张三", [s], {
                ...options,
                includeRoster: true,
            }),
        ).includes("学生名单: 张三"),
    );
});

Deno.test("calendar sorts dates chronologically and rejects invalid date/time values", () => {
    const later = { ...session, examDate: "2026.11.10" };
    const earlier = { ...session, examDate: "2026.2.3" };
    const result = unfold(
        generateIcsForSessions("张三", [later, earlier], options),
    );
    assert(
        result.indexOf(":20260203T080000") < result.indexOf(":20261110T080000"),
    );
    throws(
        () =>
            generateIcsForSessions("张三", [{
                ...session,
                examDate: "2026.2.30",
            }], options),
        "Invalid examDate",
    );
    throws(
        () =>
            generateIcsForSessions("张三", [{
                ...session,
                examTime: "8:99-10:00",
            }], options),
        "Invalid time",
    );
});
