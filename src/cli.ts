import { generateIcsForSessions } from "./ics.ts";
import { indexSessions, parseSessions } from "./sessions.ts";
import type { TestSession } from "./types.ts";

export async function exportIcsFromJson(
    sessionsByPersonJsonPath: string,
    personName: string,
    outputIcsPath: string,
    calendarName: string,
    includeRoster = false,
    kind: "student" | "proctor" = "student",
) {
    const raw = await Deno.readTextFile(sessionsByPersonJsonPath);
    const data = JSON.parse(raw) as Record<string, TestSession[]>;
    if (!Object.hasOwn(data, personName) || !Array.isArray(data[personName])) {
        throw new Error("Name not found: " + personName);
    }
    const ics = generateIcsForSessions(personName, data[personName], {
        calendarName,
        timezone: "Asia/Shanghai",
        uidNamespace: "examschedule",
        includeRoster,
        kind,
    });
    await Deno.writeTextFile(outputIcsPath, ics);
}

export async function processFile(
    inputFilename: string,
    outputFilename: string,
    outputFilenameProctor: string,
    studentNamesListOutputFilename: string,
    proctorNamesListOutputFilename: string,
) {
    // Validate the complete input before writing any output.
    const sessions = parseSessions(await Deno.readTextFile(inputFilename));
    const { byStudent, byProctor } = indexSessions(sessions);
    await Promise.all([
        Deno.writeTextFile(outputFilename, JSON.stringify(byStudent)),
        Deno.writeTextFile(outputFilenameProctor, JSON.stringify(byProctor)),
        Deno.writeTextFile(
            studentNamesListOutputFilename,
            Object.keys(byStudent).sort().join("\n"),
        ),
        Deno.writeTextFile(
            proctorNamesListOutputFilename,
            Object.keys(byProctor).sort().join("\n"),
        ),
    ]);
}

export async function main(args: string[]) {
    const [mode, ...rest] = args;
    if (mode === "validate") {
        if (rest.length !== 1) {
            throw new Error("Usage: cli.ts validate <input.csv>");
        }
        const sessions = parseSessions(await Deno.readTextFile(rest[0]));
        const { byStudent, byProctor } = indexSessions(sessions);
        console.log(
            "Valid CSV: " + sessions.length + " sessions, " +
                Object.keys(byStudent).length + " students, " +
                Object.keys(byProctor).length + " proctors",
        );
        return;
    }
    if (mode === "export-ics") {
        const [kind, jsonPath, name, output, flag] = rest;
        if (
            (kind !== "student" && kind !== "proctor") || !jsonPath || !name ||
            !output ||
            (flag !== undefined && flag !== "--include-roster") ||
            rest.length > 5
        ) {
            throw new Error(
                "Usage: cli.ts export-ics <student|proctor> <sessions.json> <name> <output.ics> [--include-roster]",
            );
        }
        await exportIcsFromJson(
            jsonPath,
            name,
            output,
            kind + ": " + name,
            flag === "--include-roster",
            kind,
        );
        console.log("Wrote " + output);
        return;
    }
    if (args.length !== 5 || args.some((arg) => !arg)) {
        throw new Error(
            "Usage: cli.ts <input.csv> <student.json> <student.txt> <proctor.json> <proctor.txt>",
        );
    }
    const [input, studentJson, studentList, proctorJson, proctorList] = args;
    await processFile(
        input,
        studentJson,
        proctorJson,
        studentList,
        proctorList,
    );
}

if (import.meta.main) {
    try {
        await main(Deno.args);
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        Deno.exit(1);
    }
}
