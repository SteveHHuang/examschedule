import { parse } from "https://deno.land/std@0.192.0/csv/mod.ts";
import { normalizeDate, parseExamTime } from "../public/calendar.js";
import type { TestSession } from "./types.ts";

const requiredColumns = [
    "examDate",
    "examTime",
    "subject",
    "grade",
    "minutes",
    "classNum",
    "location",
    "proctor1",
    "proctor2",
    "numOfStudents",
];

export function parseSessions(text: string): TestSession[] {
    const records = parse(text.replace(/^\uFEFF/, ""), {
        trimLeadingSpace: true,
    });
    const header = records[0]?.map((cell) => cell.trim()) ?? [];
    const missing = requiredColumns.filter((column) =>
        !header.includes(column)
    );
    if (missing.length) {
        throw new Error("CSV missing columns: " + missing.join(", "));
    }
    if (new Set(header).size !== header.length) {
        throw new Error("CSV has duplicate column names");
    }
    const unknown = header.filter((column) =>
        !requiredColumns.includes(column) && !/^s[1-9]\d*$/.test(column)
    );
    if (unknown.length) {
        throw new Error("CSV unknown columns: " + unknown.join(", "));
    }
    const studentColumns = header.filter((column) =>
        /^s[1-9]\d*$/.test(column)
    );
    if (!studentColumns.length) {
        throw new Error("CSV needs at least one student column (s1, s2, ...)");
    }

    const sessions: TestSession[] = [];
    for (const [index, cells] of records.entries()) {
        if (index === 0 || cells.every((cell) => !cell.trim())) continue;
        try {
            if (cells.length !== header.length) {
                throw new Error("Column count does not match header");
            }
            const row = Object.fromEntries(
                header.map((column, i) => [column, cells[i].trim()]),
            );
            // The school uses / for an unassigned optional proctor, not a name.
            for (const column of ["proctor1", "proctor2"]) {
                if (row[column] === "/" || row[column] === "／") {
                    row[column] = "";
                }
            }
            for (
                const column of requiredColumns.filter((column) =>
                    column !== "proctor2" && column !== "classNum"
                )
            ) {
                if (!row[column]) throw new Error("Missing " + column);
            }
            normalizeDate(row.examDate);
            parseExamTime(row.examTime);
            for (const column of ["minutes", "numOfStudents"]) {
                if (!/^\d+$/.test(row[column]) || Number(row[column]) < 1) {
                    throw new Error(column + " must be a positive integer");
                }
            }
            const students = studentColumns.map((column) => row[column]).filter(
                Boolean,
            );
            if (new Set(students).size !== students.length) {
                throw new Error("Duplicate student in the same record");
            }
            if (Number(row.numOfStudents) !== students.length) {
                throw new Error(
                    "numOfStudents is " + row.numOfStudents +
                        ", but roster contains " + students.length,
                );
            }
            sessions.push({
                examDate: row.examDate,
                examTime: row.examTime,
                subject: row.subject,
                grade: row.grade,
                minutes: row.minutes,
                classNum: row.classNum,
                location: row.location,
                proctor1: row.proctor1,
                proctor2: row.proctor2 || null,
                numOfStudents: String(students.length),
                students,
            });
        } catch (error) {
            throw new Error(
                "CSV record " + (index + 1) + ": " +
                    (error instanceof Error ? error.message : String(error)),
            );
        }
    }
    if (!sessions.length) throw new Error("CSV has no exam sessions");
    return sessions;
}

function proctors(session: TestSession): string[] {
    return [
        ...new Set(
            [session.proctor1, session.proctor2 ?? ""].flatMap((value) =>
                value.split(/[、\r\n]+/).map((name) => name.trim()).filter(
                    Boolean,
                )
            ),
        ),
    ];
}

function joinValues(left: string, right: string, separator = ","): string {
    return [
        ...new Set(
            [...left.split(separator), ...right.split(separator)].filter(
                Boolean,
            ),
        ),
    ].join(separator);
}

function mergeKey(session: TestSession): string {
    const date = normalizeDate(session.examDate);
    const time = parseExamTime(session.examTime);
    return JSON.stringify([
        date.year,
        date.month,
        date.day,
        time.startHour,
        time.startMin,
        time.endHour,
        time.endMin,
        session.location,
        Number(session.minutes),
    ]);
}

export function indexSessions(sessions: TestSession[]) {
    const byStudent: Record<string, TestSession[]> = Object.create(null);
    const byProctor: Record<string, TestSession[]> = Object.create(null);
    const groups = new Map<string, Map<string, TestSession>>();
    for (const session of sessions) {
        for (const student of session.students) {
            (byStudent[student] ??= []).push(session);
        }
        for (const name of proctors(session)) {
            if (!groups.has(name)) groups.set(name, new Map());
            const personGroups = groups.get(name)!;
            const key = mergeKey(session);
            const existing = personGroups.get(key);
            if (!existing) {
                personGroups.set(key, {
                    ...session,
                    students: [...session.students],
                });
            } else {
                existing.students = [
                    ...new Set([...existing.students, ...session.students]),
                ];
                existing.numOfStudents = String(existing.students.length);
                for (const field of ["subject", "grade", "classNum"] as const) {
                    existing[field] = joinValues(
                        existing[field],
                        session[field],
                    );
                }
                existing.proctor1 = joinValues(
                    existing.proctor1,
                    session.proctor1,
                    "、",
                );
                existing.proctor2 = joinValues(
                    existing.proctor2 ?? "",
                    session.proctor2 ?? "",
                    "、",
                ) || null;
            }
        }
    }
    for (const [name, personGroups] of groups) {
        byProctor[name] = [...personGroups.values()];
    }
    return { byStudent, byProctor };
}
