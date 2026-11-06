# A Level 考表数据

编辑 `alevel/input.csv` 后在主项目根目录运行 `npm run generate-json:alevel`，再刷新网页。数据与校内考试仓库完全独立。

`input.csv` 为 UTF-8 CSV，首行是字段名。每行一场考试，学生姓名分列填写在 `s1`、`s2`、`s3` 等列。带逗号或换行的单元格按标准 CSV 规则用双引号包围，单元格内双引号写成两个双引号。

考试字段为 `examDate,examTime,subject,grade,classNum,minutes,location,examType,subjectName,paperCode,supervisionTime`。`supervisionTime` 不涉及中心监管时留空。`sourceRow,sourceNumber,sourceTime,sourceStudentCount` 用于原表溯源；保留的 `proctor1,proctor2` 列不参与显示。

- 日期：`YYYY-MM-DD`；起止时间：`HH:mm-HH:mm`，使用北京时间，同一天内结束。
- `minutes` 是字符串，必须等于时间段长度。
- `examType`、`subjectName`、`paperCode` 分别对应考试种类、科目和卷次，卡片与日历标题依次显示，例如 `Cambridge AL Chemistry 9701/54`。
- `subject` 保留完整考试标识，用于兼容既有数据和稳定的日历 UID。旧数据未提供 `subjectName` 时回退显示 `subject`。
- `s1`、`s2` 等列为参加该考试的完整姓名，生成后成为 `students` 数组；人数自动计算、重复姓名自动去除。
- `supervisionTime` 为可选的中心监管时段，例如 `09:00-10:15`。`examTime` 仍只记录正式考试，`minutes` 仍是正式考试时长。页面同时显示两个时段，日历另生成一条中心监管事项。
- 中心监管场次的 `location` 按 Excel 单元格中的换行保留，例如 `"1505\n4502"`：第一行为监管教室，在卡片最上方的中心监管时段后括注；第二行为正式考试教室，显示在卡片底部。只有一行时，仅作为正式考试地点，中心监管行不括注地点。日历中的监管和考试事项分别使用相应地点，未提供监管地点时留空。
- 同名不同人请使用不同的登记名称，例如 `张同学（1234）`，避免原版按姓名索引时合并。

系统只负责呈现学校核实的时间和地点，不自动抓取官方考期，也不把考试局的 AM/PM 自动换算为开考时间。

当前 `input.csv` 已载入用户提供的 2026 年 10–11 月 Excel 供本地测试，包含 A Level、IAL 和 IGCSE。自动测试使用 `alevel/tests/fixtures/sessions.json` 中的虚构样本。`sourceRow`、`sourceNumber`、`sourceTime`、`sourceStudentCount` 保留原表溯源信息，人数以每行实际名单生成。
