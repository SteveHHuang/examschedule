/// <reference lib="deno.ns" />
// Git identifies actual data edits; rebuilds and UI edits do not advance dates.
export async function dataRevisionTime(paths: string[], cwd = "."): Promise<string> {
    const git = async (args: string[]) => {
        const result = await new Deno.Command("git", { args, cwd, stdout: "piped", stderr: "piped" }).output();
        if (!result.success) throw new Error(new TextDecoder().decode(result.stderr));
        return new TextDecoder().decode(result.stdout).trim();
    };
    const changed = await git(["diff", "--name-only", "HEAD", "--", ...paths]);
    if (changed) {
        const times = await Promise.all(changed.split("\n").map(async path => {
            const info = await Deno.stat(`${cwd}/${path}`);
            if (!info.mtime) throw new Error(`Missing modification time: ${path}`);
            return info.mtime.getTime();
        }));
        return new Date(Math.max(...times)).toISOString();
    }
    let date = await git(["log", "-1", "--format=%aI", "--", ...paths]);
    // Some deployment services check out only the latest commit.
    if (!date && await git(["rev-parse", "--is-shallow-repository"]) === "true") {
        await git(["fetch", "--unshallow", "origin"]);
        date = await git(["log", "-1", "--format=%aI", "--", ...paths]);
    }
    if (!Number.isFinite(new Date(date).getTime())) throw new Error("Missing data commit time");
    return date;
}

if (import.meta.main) {
    const revisions = {
        school: await dataRevisionTime(["input.csv", "study.csv"]),
        alevel: await dataRevisionTime(["alevel/input.csv"]),
    };
    const path = "public/schedule-updated.json";
    const content = JSON.stringify(revisions, null, 2) + "\n";
    if (await Deno.readTextFile(path) !== content) await Deno.writeTextFile(path, content);
}
