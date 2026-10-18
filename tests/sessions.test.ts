import { indexSessions, parseSessions } from "../src/sessions.ts";
import { assert, csv, equal, header, record, throws } from "./helpers.ts";

Deno.test("CSV accepts BOM, quoted newlines, whitespace and an absent optional proctor", () => {
    const row = [...record];
    row[7] = " 教师甲、教师乙\n教师甲 ";
    row[10] = " 张三 ";
    row[8] = "/";
    const sessions = parseSessions("\uFEFF" + csv([row]) + "\r\n\r\n");
    equal(sessions[0].students, ["张三"]);
    equal(sessions[0].proctor2, null);
    const { byProctor } = indexSessions(sessions);
    equal(Object.keys(byProctor), ["教师甲", "教师乙"]);
    assert(!Object.hasOwn(byProctor, ""));
    assert(!Object.hasOwn(byProctor, "/"));
});

Deno.test("CSV rejects missing, duplicate and unknown columns instead of treating notes as students", () => {
    throws(
        () => parseSessions(csv([record.slice(1)], header.slice(1))),
        "missing columns: examDate",
    );
    throws(
        () => parseSessions(csv([[...record, ""]], [...header, "s1"])),
        "duplicate column",
    );
    throws(
        () => parseSessions(csv([[...record, "备注"]], [...header, "notes"])),
        "unknown columns: notes",
    );
});

Deno.test("CSV rejects bad dates, hours, counts, missing fields and duplicate students with record number", () => {
    for (
        const [column, value, error] of [
            [0, "2026.2.30", "examDate"],
            [1, "2500-2600", "time"],
            [1, "1000-800", "after start"],
            [4, "120分钟", "positive integer"],
            [6, "", "Missing location"],
            [9, "2", "roster contains 1"],
            [11, "张三", "Duplicate student"],
        ] as const
    ) {
        const row = [...record];
        row[column] = value;
        throws(() => parseSessions(csv([row])), "CSV record 2:");
        throws(() => parseSessions(csv([row])), error);
    }
});

Deno.test("CSV rejects an empty dataset and misaligned records", () => {
    throws(() => parseSessions(csv([])), "no exam sessions");
    throws(() => parseSessions(csv([record.slice(0, -1)])), "Column count");
});

Deno.test("proctor sessions in different rooms or with different durations remain separate", () => {
    const second = [...record];
    second[6] = "A102";
    second[10] = "李四";
    const third = [...record];
    third[4] = "90";
    third[10] = "王五";
    const { byProctor } = indexSessions(
        parseSessions(csv([record, second, third])),
    );
    equal(byProctor["教师甲"].length, 3);
    equal(byProctor["教师甲"].map((s) => s.location), ["A101", "A102", "A101"]);
});

Deno.test("same-room merging counts unique students and preserves student sessions and other metadata", () => {
    const second = [...record];
    second[0] = "2026/11/03";
    second[1] = "08:00–10:00";
    second[2] = "语文";
    second[3] = "高二";
    second[5] = "2";
    second[8] = "教师乙";
    second[10] = "李四";
    const sessions = parseSessions(csv([record, second, record]));
    const original = JSON.stringify(sessions);
    const { byProctor, byStudent } = indexSessions(sessions);
    const merged = byProctor["教师甲"][0];
    equal(byProctor["教师甲"].length, 1);
    equal(merged.students, ["张三", "李四"]);
    equal(merged.numOfStudents, "2");
    equal(merged.subject, "数学,语文");
    equal(merged.grade, "高一,高二");
    equal(merged.classNum, "1,2");
    equal(merged.proctor2, "教师乙");
    equal(byStudent["张三"][0].numOfStudents, "1");
    equal(JSON.stringify(sessions), original);
});

Deno.test("person names that match object properties are indexed safely", () => {
    const row = [...record];
    row[7] = "constructor";
    row[10] = "__proto__";
    const { byStudent, byProctor } = indexSessions(parseSessions(csv([row])));
    equal(byStudent["__proto__"].length, 1);
    equal(byProctor["constructor"].length, 1);
});

Deno.test("the repository input passes the same validation used by deployment", async () => {
    const sessions = parseSessions(
        await Deno.readTextFile(new URL("../input.csv", import.meta.url)),
    );
    assert(sessions.length > 0);
});

Deno.test("an unspecified class is preserved without inventing a class label", () => {
    const row = [...record];
    row[5] = "";
    const sessions = parseSessions(csv([row]));
    equal(sessions[0].classNum, "");
    equal(indexSessions(sessions).byStudent["张三"][0].classNum, "");
});
