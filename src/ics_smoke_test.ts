import { exportIcsFromJson } from "./cli.ts";

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

async function main() {
    const [sessionsJsonPath, personName, outputIcsPath] = Deno.args;
    if (!sessionsJsonPath || !personName || !outputIcsPath) {
        console.error(
            "Usage: deno run --allow-read --allow-write src/ics_smoke_test.ts <sessions.json> <name> <output.ics>"
        );
        Deno.exit(1);
    }

    await exportIcsFromJson(
        sessionsJsonPath,
        personName,
        outputIcsPath,
        `exam: ${personName}`
    );

    const ics = await Deno.readTextFile(outputIcsPath);
    assert(ics.includes("BEGIN:VCALENDAR"), "Missing VCALENDAR");
    assert(ics.includes("END:VCALENDAR"), "Missing VCALENDAR end");
    assert(ics.includes("BEGIN:VEVENT"), "No events written");
    assert(/DTSTART(;TZID=[^:]+)?:\d{8}T\d{6}/.test(ics), "Missing DTSTART");
    assert(/DTEND(;TZID=[^:]+)?:\d{8}T\d{6}/.test(ics), "Missing DTEND");

    console.log("ICS smoke test OK");
}

main();
