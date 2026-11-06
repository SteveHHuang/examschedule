# Examschedule

Look up your test schedules and proctoring sessions without pain

## Usage

Deployed on Netlify
(Note: there might be errors occurs if not deployed on Netlify)

## Building from source

### Prerequisites

- Deno >= 1.34.0
- Python 3 + openpyxl (for regenerating the exam data from the school's Excel)

#### Convert the school's Excel to `input.csv`

The school distributes the invigilation schedule as an `.xlsx`. Convert it with:

```bash
pip install -r requirements.txt
python3 scripts/convert.py "/path/to/监考表.xlsx"
```

This reads Sheet1 (data starts below the two header rows), forward-fills the
merged cells (时长/考场/监考1/监考2 …), maps grade codes 10/11/12 → 高一/高二/高三,
restores trailing-zero dates like `11.1` → `2026.11.10`, sets `numOfStudents`
from the actual student roster length, and pads every row to a uniform width
(Deno's CSV parser rejects ragged rows). The result is written to `input.csv`.

> If the school changes the sheet layout (sheet name, number of header rows,
> or the column where student names begin), edit the `Tunables` block at the
> top of `scripts/convert.py`.

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

Use netlify, since this app uses netlify forms for feedback form collection.

## A Level 子站

A Level 源文件与考表位于 `alevel/`，共用主项目 Deno 工具链。根目录运行 `npm run dev` 可同时预览校内考试（`/`）和 A Level（`/alevel/`）。单独更新 A Level 数据可运行 `npm run generate-json:alevel`。

Netlify 构建脚本自动生成 `public/alevel/`，部署后地址为 https://brsexam.approacher.org/alevel 。详细说明见 `alevel/README.md`。

## 主站自习安排（本地）

`study.csv` 保存自习时段和名单，由 `scripts/convert-study.py` 读取三份年级表生成（参数依次为高一、高二、高三源文件、输出 CSV 路径、核对 JSON 路径；依赖已有的 openpyxl）。`npm run generate-json:school` 自动将自习加入学生查询并按开场时间排序。自习不加入教师监考查询。原表缺少看班老师时显示“未注明”。

页面使用“日期 时间、时长、自习、自习地点/由老师看班”的格式，日历下载包含自习。验证命令为 `npm run test:study`。
