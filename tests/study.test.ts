/// <reference lib="deno.ns" />
import { assertEquals, assertThrows } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { studySessions, appendStudySessions, appendStudySupervisors } from "../src/study.ts";
const csv='examDate,examTime,minutes,location,supervisor,grade,sourceFile,sourceSheet,sourceRows,s1,s2\n2026.11.09,10:00-11:40,100,3204,刘老师,高三,source.xlsx,11.9,3,甲,甲\n';
Deno.test('study roster deduplicates without guessing teacher or room',()=>{
 const session=studySessions(csv)[0];assertEquals(session.students,['甲']);assertEquals(session.minutes,'100');assertEquals(session.supervisor,'刘老师');assertEquals(session.kind,'study');
 const blank=studySessions(csv.replace('3204,刘老师',','))[0];assertEquals(blank.location,'');assertEquals(blank.supervisor,'');
});
Deno.test('invalid study durations fail',()=>{assertThrows(()=>studySessions(csv.replace(',100,',',45,')));});
Deno.test('compact exam times and colon study times sort chronologically without altering exams',async()=>{
 const file=await Deno.makeTempFile();
 try {await Deno.writeTextFile(file,csv);const exam={examDate:'2026.11.9',examTime:'800-1000',subject:'语文'};const late={examDate:'2026.11.9',examTime:'1315-1415',subject:'数学'};
 const index={'甲':[late,exam]};await appendStudySessions(index,file);assertEquals(index['甲'].map(s=>s.examTime),['800-1000','10:00-11:40','1315-1415']);assertEquals(index['甲'][0],exam);
 } finally {await Deno.remove(file);}
});

Deno.test('teacher queries include their own studies and preserve existing invigilation', async () => {
 const file = await Deno.makeTempFile();
 try {
  await Deno.writeTextFile(file,csv);
  const exam = { examDate: "2026.11.9", examTime: "800-1000", subject: "语文" };
  const index: Record<string, any[]> = { "刘老师": [exam] };
  await appendStudySupervisors(index,file);
  assertEquals(Object.keys(index),["刘老师"]);
  assertEquals(index["刘老师"].length,2);
  assertEquals(index["刘老师"][0],exam);
  assertEquals(index["刘老师"][1].students,["甲"]);
  assertEquals(index["刘老师"][1].kind,"study");
  await Deno.writeTextFile(file,csv.replace("刘老师","/"));
  const missing: Record<string, any[]> = {};
  await appendStudySupervisors(missing,file);
  assertEquals(missing,{});
  await Deno.writeTextFile(file,csv.replace("刘老师","刘老师、王老师、刘老师"));
  const multiple: Record<string, any[]> = {};
  await appendStudySupervisors(multiple,file);
  assertEquals(Object.keys(multiple),["刘老师","王老师"]);
  assertEquals(multiple["刘老师"].length,1);
 } finally { await Deno.remove(file); }
});
