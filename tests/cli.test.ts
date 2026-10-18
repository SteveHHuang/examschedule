import { main, processFile } from "../src/cli.ts";
import { assert, csv, equal, record } from "./helpers.ts";

Deno.test("CLI generates all files before resolving and exports a calendar", async () => {
    const dir = await Deno.makeTempDir();
    try {
        await Deno.writeTextFile(dir + "/input.csv", csv([record]));
        await processFile(
            dir + "/input.csv",
            dir + "/students.json",
            dir + "/proctors.json",
            dir + "/students.txt",
            dir + "/proctors.txt",
        );
        equal(await Deno.readTextFile(dir + "/students.txt"), "张三");
        equal(await Deno.readTextFile(dir + "/proctors.txt"), "教师甲");
        assert(
            JSON.parse(
                await Deno.readTextFile(dir + "/proctors.json"),
            )["教师甲"],
        );
        await main([
            "export-ics",
            "student",
            dir + "/students.json",
            "张三",
            dir + "/student.ics",
        ]);
        const calendar = await Deno.readTextFile(dir + "/student.ics");
        assert(calendar.includes("BEGIN:VEVENT"));
        await main(["validate", dir + "/input.csv"]);
    } finally {
        await Deno.remove(dir, { recursive: true });
    }
});

Deno.test("CLI fails nonzero for missing input, invalid input, output failure and invalid export role", async () => {
    const dir = await Deno.makeTempDir();
    try {
        await Deno.writeTextFile(dir + "/invalid.csv", "wrong,columns\n1,2");
        await Deno.writeTextFile(dir + "/valid.csv", csv([record]));
        const cli = new URL("../src/cli.ts", import.meta.url).pathname;
        const outputs = [
            "students.json",
            "students.txt",
            "proctors.json",
            "proctors.txt",
        ].map((f) => dir + "/" + f);
        const cases = [
            [dir + "/missing.csv", ...outputs],
            [dir + "/invalid.csv", ...outputs],
            [
                dir + "/valid.csv",
                dir + "/missing/output.json",
                ...outputs.slice(1),
            ],
            ["export-ics", "unknown", outputs[0], "张三", dir + "/out.ics"],
        ];
        for (const args of cases) {
            const output = await new Deno.Command(Deno.execPath(), {
                args: [
                    "run",
                    "--cached-only",
                    "--allow-read",
                    "--allow-write",
                    cli,
                    ...args,
                ],
                stdout: "piped",
                stderr: "piped",
            }).output();
            assert(
                output.code !== 0,
                "CLI incorrectly succeeded for " + args[0],
            );
            assert(new TextDecoder().decode(output.stderr).trim().length > 0);
        }
        // Also prove that the same subprocess setup can successfully generate data.
        const success = await new Deno.Command(Deno.execPath(), {
            args: [
                "run",
                "--cached-only",
                "--allow-read",
                "--allow-write",
                cli,
                dir + "/valid.csv",
                ...outputs,
            ],
            stdout: "piped",
            stderr: "piped",
        }).output();
        assert(success.success, new TextDecoder().decode(success.stderr));
        equal(await Deno.readTextFile(outputs[1]), "张三");
    } finally {
        await Deno.remove(dir, { recursive: true });
    }
});

Deno.test("invalid CSV is rejected before any output is overwritten", async () => {
    const dir = await Deno.makeTempDir();
    try {
        await Deno.writeTextFile(dir + "/input.csv", "wrong,columns\n1,2");
        await Deno.writeTextFile(dir + "/students.json", "previous valid data");
        let rejected = false;
        try {
            await processFile(
                dir + "/input.csv",
                dir + "/students.json",
                dir + "/proctors.json",
                dir + "/students.txt",
                dir + "/proctors.txt",
            );
        } catch {
            rejected = true;
        }
        assert(rejected);
        equal(
            await Deno.readTextFile(dir + "/students.json"),
            "previous valid data",
        );
    } finally {
        await Deno.remove(dir, { recursive: true });
    }
});
