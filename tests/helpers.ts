export function assert(
    condition: unknown,
    message = "Assertion failed",
): asserts condition {
    if (!condition) throw new Error(message);
}

export function equal(actual: unknown, expected: unknown) {
    assert(
        JSON.stringify(actual) === JSON.stringify(expected),
        "Expected " + JSON.stringify(expected) + ", received " +
            JSON.stringify(actual),
    );
}

export function throws(fn: () => unknown, text: string) {
    try {
        fn();
    } catch (error) {
        assert(
            error instanceof Error && error.message.includes(text),
            String(error),
        );
        return;
    }
    throw new Error("Expected an error containing: " + text);
}

export const header = [
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
    "s1",
    "s2",
];

export const record = [
    "2026.11.3",
    "800-1000",
    "数学",
    "高一",
    "120",
    "1",
    "A101",
    "教师甲",
    "",
    "1",
    "张三",
    "",
];

export function csv(rows: string[][], columns = header) {
    return [columns, ...rows].map((row) =>
        row.map((cell) => '"' + cell.replace(/"/g, '""') + '"').join(",")
    ).join("\r\n");
}
