import { parse } from "https://deno.land/std@0.192.0/csv/mod.ts";
import { generateIcsForSessions } from "./ics.ts";

interface TestSession {
    examDate: string;
    examTime: string;
    subject: string;
    grade: string;
    classNum: string;
    minutes: string;
    location: string;
    proctor1: string;
    proctor2: string | null;
    numOfStudents: string;
    students: string[];
    // For the proctor view: list of "grade classNum" identifiers grouped by time/location.
    classes?: string[];
}

function classIdentifiers(grade: string, classNum: string): string[] {
    const g = (grade || "").trim();
    return (classNum || "")
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c.length > 0)
        .map((c) => (g ? `${g} ${c}` : c));
}

function sumNumberString(a: string, b: string): string {
    const numsA = (a || "").split(",").map((n) => parseInt(n.trim(), 10)).filter((n) => !isNaN(n));
    const numsB = (b || "").split(",").map((n) => parseInt(n.trim(), 10)).filter((n) => !isNaN(n));
    return String([...numsA, ...numsB].reduce((sum, n) => sum + n, 0));
}

export async function exportIcsFromJson(
    sessionsByPersonJsonPath: string,
    personName: string,
    outputIcsPath: string,
    calendarName: string,
    includeRoster = false
) {
    const raw = await Deno.readTextFile(sessionsByPersonJsonPath);
    const data = JSON.parse(raw) as Record<string, TestSession[]>;

    const sessions = data[personName];
    if (!sessions) {
        const candidates = Object.keys(data).slice(0, 10).join(", ");
        throw new Error(
            `Name not found: ${personName}. (First few available names: ${candidates}${
                Object.keys(data).length > 10 ? ", ..." : ""
            })`
        );
    }

    const ics = generateIcsForSessions(personName, sessions, {
        calendarName,
        timezone: "Asia/Shanghai",
        uidNamespace: "exam.plushugh.com",
        includeRoster,
    });

    await Deno.writeTextFile(outputIcsPath, ics);
}

export async function processFile(
    inputFilename: string,
    outputFilename: string,
    outputFilenameProctor: string,
    studentNamesListOutputFilename: string,
    proctorNamesListOutputFilename: string
) {
    const testSessionsByStudent: Record<string, TestSession[]> = {};
    const testSessionsByProctor: Record<string, TestSession[]> = {};

    try {
        const file = await Deno.readTextFile(inputFilename);
        const csv = parse(file, { trimLeadingSpace: true, skipFirstRow: true }); // Skip the first row of the CSV file (headers) and trim leading spaces, the first row will then be used as the keys for the returned object

        for await (const row of csv) {
            const {
                examDate,
                grade,
                examTime,
                subject,
                classNum,
                minutes,
                location,
                proctor1,
                proctor2,
                numOfStudents,
                ...students
            } = row;

            const studentNames: string[] = Object.values(students).filter(
                Boolean
            ) as string[];

            const isValidProctor = (name: string) =>
                name.length > 0 && name !== "/" && name !== "\\" && name !== "-";

            const proctors1 =
                (proctor1 as string).trim().split("、").map((i) => i.split("\n")).flat().map(i => i.trim()).filter(isValidProctor);

            const proctorsRaw = [...proctors1, ...(proctor2 as string).trim().split("、").map((i) => i.split("\n")).flat().map(i => i.trim()).filter(isValidProctor)]

            const proctors = [...new Set(proctorsRaw)];

            proctors.forEach(proctor => {
                if (!testSessionsByProctor[proctor]) {
                    testSessionsByProctor[proctor] = [];
                }

                testSessionsByProctor[proctor].push({
                    examDate: examDate || "INVALID DATE",
                    examTime: examTime || "INVALID TIME",
                    subject: subject || "INVALID SUBJECT",
                    grade: grade || "INVALID GRADE",
                    classNum: classNum || "",
                    minutes: minutes || "INVALID MINUTES",
                    location: location || "INVALID LOCATION",
                    proctor1: proctor1 || "INVALID PROCTOR",
                    proctor2: proctor2 || null,
                    numOfStudents: numOfStudents || "INVALID NUMBER OF STUDENTS",
                    students: studentNames,
                })
            })

            studentNames.forEach((student) => {
                if (!testSessionsByStudent[student]) {
                    testSessionsByStudent[student] = [];
                }

                testSessionsByStudent[student].push({
                    examDate: examDate || "INVALID DATE",
                    examTime: examTime || "INVALID TIME",
                    subject: subject || "INVALID SUBJECT",
                    grade: grade || "INVALID GRADE",
                    classNum: classNum || "",
                    minutes: minutes || "INVALID MINUTES",
                    location: location || "INVALID LOCATION",
                    proctor1: proctor1 || "INVALID PROCTOR",
                    proctor2: proctor2 || null,
                    numOfStudents: numOfStudents || "INVALID NUMBER OF STUDENTS",
                    students: studentNames,
                });
            });
        }

        // const dedup = Object.fromEntries(Object.entries(testSessionsByProctor).map(([proc, sesss]) => [proc, [...new Set(sesss)]]));
        // merge test sessions for each proctor by same date, time, subject and location
        const dedup: Record<string, TestSession[]> = {};
        Object.entries(testSessionsByProctor).forEach(([proc, sesss]) => {
            const deduped = sesss.reduce((acc, curr) => {
                const key = `${curr.examDate}-${curr.examTime}-${curr.subject}-${curr.location}`;
                if (!acc[key]) {
                    acc[key] = curr;
                } else {
                    acc[key].students = [...acc[key].students, ...curr.students];
                    if (acc[key].subject !== curr.subject) {
                        acc[key].subject = [...new Set([...acc[key].subject.split(","), ...curr.subject.split(",")])].join(",");
                    }
                    acc[key].classNum = [...new Set([...acc[key].classNum.split(","), ...curr.classNum.split(",")])].join(",");
                    acc[key].numOfStudents = [...new Set([...acc[key].numOfStudents.split(","), ...curr.numOfStudents.split(",")])].join(",");

                    // Merge proctors across combined class rows so no proctor is dropped.
                    const allNames = [
                        ...((acc[key].proctor1 || "").trim().split(/[\n、]/).map(i => i.trim()).filter(Boolean)),
                        ...((acc[key].proctor2 || "").trim().split(/[\n、]/).map(i => i.trim()).filter(Boolean)),
                        ...((curr.proctor1 || "").trim().split(/[\n、]/).map(i => i.trim()).filter(Boolean)),
                        ...((curr.proctor2 || "").trim().split(/[\n、]/).map(i => i.trim()).filter(Boolean)),
                    ];
                    const uniqueNames = [...new Set(allNames)];
                    acc[key].proctor1 = uniqueNames.join("\n");
                    acc[key].proctor2 = null;
                }
                return acc;
            }, {} as Record<string, TestSession>);

            dedup[proc] = Object.values(deduped);
        });

        // Group proctor sessions by time+location for a class-centric view.
        const proctorClassView: Record<string, TestSession[]> = {};
        Object.entries(dedup).forEach(([proc, sesss]) => {
            const grouped = sesss.reduce((acc, curr) => {
                const key = `${curr.examDate}-${curr.examTime}-${curr.location}`;
                if (!acc[key]) {
                    acc[key] = { ...curr };
                    acc[key].classes = classIdentifiers(curr.grade, curr.classNum);
                } else {
                    acc[key].students = [...acc[key].students, ...curr.students];
                    acc[key].classes = [
                        ...new Set([
                            ...(acc[key].classes || []),
                            ...classIdentifiers(curr.grade, curr.classNum),
                        ]),
                    ];
                    acc[key].numOfStudents = sumNumberString(
                        acc[key].numOfStudents,
                        curr.numOfStudents,
                    );
                }
                return acc;
            }, {} as Record<string, TestSession>);

            proctorClassView[proc] = Object.values(grouped).map((s) => ({
                ...s,
                subject: "",
                grade: "",
                classNum: "",
                proctor1: "",
                proctor2: null,
                classes: (s.classes || []).slice().sort(),
            }));
        });

        // const jsonData = JSON.stringify(testSessionsByStudent, null, 2);
        const jsonData = JSON.stringify(testSessionsByStudent); // Saves precious bytes
        const jsonDataProctor = JSON.stringify(proctorClassView); // Saves precious bytes

        const studentList = Object.keys(testSessionsByStudent).sort().join("\n");
        const proctorList = Object.keys(proctorClassView).sort().join("\n");

        Deno.writeTextFile(studentNamesListOutputFilename, studentList);
        Deno.writeTextFile(proctorNamesListOutputFilename, proctorList);

        Deno.writeTextFile(outputFilename, jsonData);
        Deno.writeTextFile(outputFilenameProctor, jsonDataProctor);
    } catch (error) {
        console.error(error);
    }
}

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
    // Two modes:
    // 1) Generate JSON (existing behavior):
    //    deno run --allow-read --allow-write src/cli.ts input.csv public/testSessionsByStudent.json public/studentNamesList.txt public/testSessionsByProctor.json public/proctorNamesList.txt
    // 2) Export iCalendar (.ics) for Apple Calendar import:
    //    deno run --allow-read --allow-write src/cli.ts export-ics student public/testSessionsByStudent.json "Student Name" public/student.ics
    //    deno run --allow-read --allow-write src/cli.ts export-ics proctor public/testSessionsByProctor.json "Proctor Name" public/proctor.ics

    const mode = Deno.args[0];

    if (mode === "export-ics") {
        const kind = Deno.args[1]; // student | proctor (only used in title)
        const sessionsJsonPath = Deno.args[2];
        const personName = Deno.args[3];
        const outputIcsPath = Deno.args[4];
        const includeRoster = Deno.args.includes("--include-roster");

        if (!sessionsJsonPath || !personName || !outputIcsPath) {
            console.error(
                "Usage: deno run --allow-read --allow-write src/cli.ts export-ics <student|proctor> <sessions.json> <name> <output.ics> [--include-roster]"
            );
            Deno.exit(1);
        }

        const calendarName = `${kind ?? "exam"}: ${personName}`;
        await exportIcsFromJson(sessionsJsonPath, personName, outputIcsPath, calendarName, includeRoster);
        console.log(`Wrote ${outputIcsPath}`);
        Deno.exit(0);
    }

    const inputFilename = Deno.args[0];
    const outputFilename = Deno.args[1];
    const studentNamesListOutputFilename = Deno.args[2];
    const outputFilenameProctor = Deno.args[3];
    const proctorNamesListOutputFilename = Deno.args[4];

    if (!inputFilename || !outputFilename || !studentNamesListOutputFilename || !outputFilenameProctor || !proctorNamesListOutputFilename) {
        console.error(
            "Please provide an input and output filenames. Example: deno run --allow-read --allow-write src/cli.ts input.csv public/testSessionsByStudent.json public/studentNamesList.txt public/testSessionsByProctor.json public/proctorNamesList.txt\n\nOr export an .ics file: deno run --allow-read --allow-write src/cli.ts export-ics student public/testSessionsByStudent.json \"Student Name\" public/student.ics"
        );
        Deno.exit(1);
    }

    await processFile(
        inputFilename,
        outputFilename,
        outputFilenameProctor,
        studentNamesListOutputFilename,
        proctorNamesListOutputFilename
    );
}
