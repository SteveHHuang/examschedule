# Examschedule

Look up your test schedules and proctoring sessions without pain

## 更新一次考试

当前数据：2025—2026 学年第二学期期末，2026 年 6 月 30 日至 7 月 3 日。数据来自学校监考表，包含 193 条原始考试记录。

本项目是静态网站：`input.csv` 是考试数据源，Deno 在构建时生成查询索引，浏览器读取 `public/` 中的文件。

学校原始双语 XLSX 可以直接导入，不必手动拆分合并单元格。需要 Python 3（只使用标准库）；显式指定考试所在公历年份：

```bash
python3 scripts/import_xlsx.py "/path/to/学校监考表.xlsx" --year 2026 --output input.csv
npm ci
npm run validate-input
npm run build
```

转换器只展开 Excel 中实际存在的合并区域，按源表列名映射字段，保留未填写的班级。它会读取公式的缓存值并核对考生人数；公式没有缓存结果时，请先在 Excel 中重新计算并保存。像底层数值 `6.3`、显示格式 `0.00` 的日期会按显示的 `6.30` 转为 6 月 30 日，而不是 6 月 3 日。多工作表文件需加 `--sheet "Sheet1"`。

也可以按原来的手工 CSV 流程处理：

1. 备份学校原始 Excel。在 Excel 中删除标题、说明和原始多行表头；按下方 VBA 步骤拆分合并单元格并填入原值。
2. 导出 UTF-8 CSV，添加下方完整英文表头，保存为仓库根目录的 `input.csv`。如果沿用现有模板，保留其英文表头，替换旧记录即可。
3. 修改 `public/index.html` 和 `public/teacher.html` 的学年、学期和考试类型。两页各有 HTML 初始文字、中文 `updated`、英文 `updated`，共六处；例如把 `2025-2026` / `2025–2026` 更新成 `2026-2027` / `2026–2027`，把 `期末考试` / `Final Exams` 更新成 `期中考试` / `Midterm Exams`。
4. 在仓库根目录执行：

```bash
npm ci
npm run validate-input
npm run build
```

5. 本地预览，分别抽查学生、教师查询、语言切换和日历下载后再发布：

```bash
python3 -m http.server 8000 --directory public
```

打开 <http://localhost:8000/> 和 <http://localhost:8000/teacher.html>。

更新学期名称不会自动更新考试数据。考试日期必须取自学校正式考试表；当前仓库已更新为 2025—2026 学年第二学期期末；26—27 期中需要另行导入学校对应的正式安排。

### CSV 格式与校验

- 必须保留下面表头中的十个考试信息列；学生列使用 `s1`, `s2`, ...，数量可按需要增加。
- 一条记录对应一组考试安排及其学生名单。所有必填信息都要逐行填写；`proctor2` 和源表未注明的 `classNum` 可以留空。
- 日期支持 `2026.11.3`、`2026/11/3`、`2026-11-03`；时间支持 `800-1000`、`08:00-10:00`，同日结束时间必须晚于开始时间。
- `minutes`、`numOfStudents` 必须为正整数；人数必须等于该行非空学生格数量。姓名会去掉首尾空白，同一行不能重复。
- 多名监考教师可用 `、` 或单元格内换行分隔。空白姓名不会进入教师索引；第二监考教师的 `/`、`／` 占位符按未安排处理。
- 不要附加备注列。缺列、多列、日期错误、人数不符等会使构建失败，并报告 CSV 记录号（含表头；单元格内换行不增加记录号）。
- `editing.py` 是旧的补值工具，包含对 `proctor2` 的向下填充；不要把所有空白格都视为合并单元格，否则可能把本应空缺的第二位监考教师填错。优先在原 Excel 中按合并区域处理。

### Commands

| Command | Purpose |
| --- | --- |
| `npm run validate-input` | Validate CSV without writing files |
| `npm run generate-json` | Validate and generate the four query files |
| `npm run check` | Type-check the CLI, shared calendar module and tests |
| `npm test` | Run data, calendar and CLI regression tests with synthetic fixtures |
| `npm run build` | Run checks and tests, then generate query files |

学生索引保留原始记录。教师索引仅合并同日期、同时间、同地点且同考试时长的记录；保留科目、年级、班级和监考信息，按合并后的去重名单计算人数。

## Building from source

### Prerequisites

Use `npm ci` to install the Deno version recorded in `package-lock.json` (currently 2.6.5). GitHub Actions and the Netlify build script use the same npm scripts and dependencies. Node.js 22 is used by CI and Netlify.

The older instructions required Deno >= 1.34.0; this checkout now uses Deno 2 and a version-5 Deno lockfile.

#### Delete header rows in excel

#### Spread merged cells using VBA script

1. Alt + F11
2. Insert > Module
3. Add this script

```vba
Sub UnMergeSameCell()
Dim Rng As Range, xCell As Range
xTitleId = "Select Cells to unmerge"
Set WorkRng = Application.Selection
Set WorkRng = Application.InputBox("Range", xTitleId, WorkRng.Address, Type:=8)
Application.ScreenUpdating = False
Application.DisplayAlerts = False
For Each Rng In WorkRng
    If Rng.MergeCells Then
        With Rng.MergeArea
            .UnMerge
            .Formula = Rng.Formula
        End With
    End If
Next
Application.DisplayAlerts = True
Application.ScreenUpdating = True
End Sub
```

<!-- credit: Extendoffice -->

1. Select all cells in sheet
2. Use F5 to run the script (or run and choose all cells in VBA editor)
3. Export csv as `test.csv`

#### Open csv and add column names

1. Open csv in textedit
2. add this to an extra topmost line:

```csv
examDate,examTime,subject,grade,minutes,classNum,location,proctor1,proctor2,numOfStudents,s1,s2,s3,s4,s5,s6,s7,s8,s9,s10,s11,s12,s13,s14,s15,s16,s17,s18,s19,s20,s21,s22,s23,s24,s25,s26,s27,s28,s29,s30,s31,s32,s33,s34,s35,s36,s37,s38,s39,s40,s41,s42,s43,s44,s45,s46,s47,s48
```

1. rename csv as `input.csv` and copy to this folder

#### Generate preindexed jsons

```bash
npm run generate-json

# or

deno run --allow-read --allow-write src/cli.ts input.csv public/testSessionsByStudent.json public/studentNamesList.txt public/testSessionsByProctor.json public/proctorNamesList.txt
```

> this npm script reads `input.csv` and generates new files in `public/`
> as `testSessionsByStudent.json`, `testSessionsByProctor.json`, `proctorNamesList.txt` and
> `studentNamesList.txt`

#### Export Apple Calendar (.ics)

Once you have the preindexed JSONs in `public/`, you can export a personal calendar file and import it into Apple Calendar.

Export for a student:

```bash
deno run --allow-read --allow-write src/cli.ts export-ics student public/testSessionsByStudent.json "Student Name" public/student.ics
```

Export for a proctor:

```bash
deno run --allow-read --allow-write src/cli.ts export-ics proctor public/testSessionsByProctor.json "Proctor Name" public/proctor.ics
```

Then open the generated `.ics` file (Finder → double click) or import it in Calendar:

- Calendar.app → File → Import… → choose the `.ics`

Optional: include the full student roster in the event description (can be a lot of text):

```bash
deno run --allow-read --allow-write src/cli.ts export-ics proctor public/testSessionsByProctor.json "Proctor Name" public/proctor.ics --include-roster
```

#### Deploy webapp from `public/` directory

Netlify reads `netlify.toml`, runs `bash netlify-build.sh`, and publishes `public/`.
The script runs the same type checks, regression tests and generation command as local builds; any failure stops deployment. When the Git repository is connected to Netlify, pushing to the configured deployment branch triggers a build.

Other static hosts can publish the output of `npm run build` from `public/`. Serve the directory over HTTP(S), rather than opening `index.html` as a local file: the pages load ES modules and JSON. The current pages provide contact information for feedback; they do not use Netlify Forms.

The generated JSON files are ignored by Git. Both name lists are tracked intentionally and should be committed after updating the input data.

## Code layout

- `scripts/import_xlsx.py`: school XLSX import with merged-cell and displayed-date handling.
- `src/sessions.ts`: CSV validation, student indexing and proctor merging.
- `src/cli.ts`: validation, data generation and calendar export commands.
- `src/types.ts`: shared session and calendar option types.
- `public/calendar.js`: one calendar generator for both pages and the CLI; preserves Unicode event identity, validates dates/times and folds UTF-8 lines at 75 octets.
- `public/index.html`, `public/teacher.html`: student and proctor UI.
- `tests/`: Deno regression tests and Python XLSX importer tests; `.github/workflows/check.yml` runs `npm run build` on pushes and pull requests.

### Calendar migration

Event UIDs now distinguish Chinese names, subjects, rooms and student/proctor roles. Presentation language and roster visibility do not change the UID. Earlier exports used a lossy UID algorithm, so new exports cannot reliably update those old imported events. Remove the previous exam calendar or import into a separate calendar to avoid duplicates. Actual import/share behavior still depends on the calendar application and device.

### XLSX importer tests

```bash
python3 -m unittest discover -s tests -p '*_test.py'
```
