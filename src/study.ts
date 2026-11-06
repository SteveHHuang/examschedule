/// <reference lib="deno.ns" />
import { parse } from "https://deno.land/std@0.192.0/csv/mod.ts";

export function studySessions(csv: string) {
  return parse(csv, { skipFirstRow: true }).map(row => {
    const students = [...new Set(Object.entries(row).filter(([key]) => /^s\d+$/.test(key)).map(([,value]) => value.trim()).filter(Boolean))];
    const match = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/.exec(row.examTime);
    if (!match || !/^\d{4}\.\d{2}\.\d{2}$/.test(row.examDate) || !students.length) throw new Error("Invalid study session");
    const [sh,sm,eh,em]=match.slice(1).map(Number);
    if (sh>23 || eh>23 || sm>59 || em>59 || (eh-sh)*60+em-sm!==Number(row.minutes) || Number(row.minutes)<=0) throw new Error("Invalid study duration");
    return { kind: "study", examDate: row.examDate, examTime: row.examTime, minutes: row.minutes,
      subject: "自习", grade: row.grade, classNum: "", location: row.location,
      supervisor: row.supervisor, proctor1: "", proctor2: null,
      students, numOfStudents: String(students.length),
      sourceFile: row.sourceFile, sourceSheet: row.sourceSheet, sourceRows: row.sourceRows };
  });
}

export async function appendStudySessions(index: Record<string, any[]>, path = "study.csv") {
  let csv: string;
  try { csv=await Deno.readTextFile(path); }
  catch (error) { if (error instanceof Deno.errors.NotFound) return; throw error; }
  for (const session of studySessions(csv)) for (const name of session.students) (index[name] ||= []).push(session);
  sortStudySchedules(index);
}

function sortStudySchedules(index: Record<string, any[]>) {
  const key=(s: {examDate: string; examTime: string}) => s.examDate.split(/[.\/-]/).map(part=>part.padStart(2,"0")).join("-")+" "+s.examTime.split("-")[0].replace(/:/g,"").padStart(4,"0");
  for (const sessions of Object.values(index)) sessions.sort((a,b)=>key(a).localeCompare(key(b)));
}

export async function appendStudySupervisors(index: Record<string, any[]>, path = "study.csv") {
  let csv: string;
  try { csv = await Deno.readTextFile(path); }
  catch (error) { if (error instanceof Deno.errors.NotFound) return; throw error; }
  for (const session of studySessions(csv)) {
    const teachers = [...new Set(session.supervisor.split(/[、,，\n]/).map(name => name.trim()).filter(name => name && !["/", "\\", "-", "未注明"].includes(name)))];
    for (const teacher of teachers) (index[teacher] ||= []).push({ ...session, classes: [session.grade] });
  }
  sortStudySchedules(index);
}
