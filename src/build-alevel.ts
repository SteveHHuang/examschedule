/// <reference lib="deno.ns" />
import { copy } from "https://deno.land/std@0.192.0/fs/copy.ts";
import { processFile } from "../alevel/src/cli.ts";

// Run from the repository root; publish both sites through the existing public/ directory.
await copy("alevel/public", "public/alevel", { overwrite: true });
await processFile("alevel/input.csv", "public/alevel/testSessionsByStudent.json", "public/alevel/studentNamesList.txt");
