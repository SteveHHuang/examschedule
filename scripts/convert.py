#!/usr/bin/env python3
"""Convert the invigilation-schedule Excel into the site's input.csv.

The school's 监考表 (invigilation schedule) is an .xlsx whose Sheet1 looks like:

    row 1:  title line  (e.g. "2026-2027学年第一学期期中考试监考表")
    row 2:  header      (日期/时间/课程名称/时长/年级/班级名称/考场/监考1/监考2/人数/学生…)
    row 3+: data

Columns (1-based):
    A examDate   B examTime   C subject   D minutes   E grade
    F classNum   G location   H proctor1  I proctor2  J numOfStudents
    K.. students (one name per cell)

Several columns use merged cells (D/G/H/I and, less often, A/B/C/E/F/J).
We forward-fill every merged region so each data row carries a complete value.

Usage:
    python3 scripts/convert.py <source.xlsx> [output.csv]

If no output path is given, `input.csv` in the repo root is used.

Requirements: openpyxl  (see requirements.txt)
"""

import csv
import datetime
import sys
from pathlib import Path

import openpyxl

# ---- Tunables (adjust here if the school changes the sheet layout) ---------
SHEET_NAME = "Sheet1"
HEADER_ROWS = 2          # title + header lines above the data
FIRST_STUDENT_COL = 11   # 1-based column where student names begin
MAX_COLUMNS = 10         # fixed metadata columns before the student columns

GRADE_MAP = {"10": "高一", "11": "高二", "12": "高三"}

# Columns (1-based) that are forward-filled through merged regions.
# Filling them all is harmless and keeps every field complete.
FILL_COLUMNS = (1, 2, 3, 4, 5, 6, 7, 8, 9, 10)


def _clean(value):
    """Normalise a cell to a trimmed string, collapsing floats like 10.0 -> '10'."""
    if value is None:
        return ""
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value).strip()


def _fmt_date(value, number_format=""):
    """Turn an Excel date cell into 'YYYY.M.D'.

    The source sometimes stores 11.10 as the numeric 11.1 with a `0.00`
    number format; we restore the trailing zero in that case.
    """
    if value is None:
        return ""
    if isinstance(value, (datetime.datetime, datetime.date)):
        return f"{value.year}.{value.month}.{value.day}"
    if isinstance(value, (int, float)):
        text = f"{value:.2f}" if "0.00" in (number_format or "") else f"{value:g}"
        return f"2026.{text}"
    # Fall back to string parsing: normalise Chinese/斜杠 date separators.
    s = _clean(value).replace("年", ".").replace("月", ".").replace("日", "").replace("/", ".")
    parts = [p for p in s.split(".") if p]
    if len(parts) >= 2:
        year = parts[0] if len(parts[0]) == 4 else "2026"
        month = parts[1] if len(parts[0]) == 4 else parts[0]
        day = parts[2] if len(parts[0]) == 4 else parts[1]
        return f"{year}.{int(month)}.{int(day)}"
    return s


def _map_grade(value):
    """Map numeric grade codes (10/11/12) to 高一/高二/高三, keeping combos."""
    if value is None or _clean(value) == "":
        return ""
    return ",".join(GRADE_MAP.get(p.strip(), p.strip()) for p in str(value).split(","))


def _class_num(value):
    """Class number — deliberately NOT forward-filled across merged cells."""
    return _clean(value)


def convert(source_path: Path, output_path: Path) -> None:
    wb = openpyxl.load_workbook(source_path, data_only=True)
    if SHEET_NAME not in wb.sheetnames:
        raise SystemExit(f"Sheet '{SHEET_NAME}' not found. Available: {wb.sheetnames}")
    ws = wb[SHEET_NAME]

    # (row, col) -> top-left value, for every merged region.
    merged = {}
    for rng in ws.merged_cells.ranges:
        top_left = ws.cell(row=rng.min_row, column=rng.min_col).value
        for r in range(rng.min_row, rng.max_row + 1):
            for c in range(rng.min_col, rng.max_col + 1):
                merged[(r, c)] = top_left

    def cell(r, c):
        if (r, c) in merged:
            return merged[(r, c)]
        return ws.cell(row=r, column=c).value

    rows = []
    max_students = 0
    for r in range(HEADER_ROWS + 1, ws.max_row + 1):
        subject = _clean(cell(r, 3))
        if not subject:
            continue  # skip blank / separator rows

        date = _fmt_date(cell(r, 1), ws.cell(row=r, column=1).number_format)
        time = _clean(cell(r, 2))
        if not (date and time):
            continue

        minutes = _clean(cell(r, 4))
        grade = _map_grade(cell(r, 5))
        classnum = _class_num(cell(r, 6))
        location = _clean(cell(r, 7))
        proctor1 = _clean(cell(r, 8))
        proctor2 = _clean(cell(r, 9))
        students = [_clean(cell(r, c)) for c in range(FIRST_STUDENT_COL, ws.max_column + 1)]
        students = [s for s in students if s]

        max_students = max(max_students, len(students))
        rows.append([date, time, subject, grade, minutes, classnum, location,
                     proctor1, proctor2, str(len(students))] + students)

    # Every CSV row must have the same field count, or Deno's csv parser fails.
    header = (["examDate", "examTime", "subject", "grade", "minutes", "classNum",
               "location", "proctor1", "proctor2", "numOfStudents"]
              + [f"s{i}" for i in range(1, max_students + 1)])
    width = len(header)
    padded = [r + [""] * (width - len(r)) for r in rows]

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(padded)

    print(f"Wrote {output_path}: {len(rows)} data rows, "
          f"up to {max_students} students per row.")


def main() -> None:
    args = sys.argv[1:]
    if not args:
        raise SystemExit(__doc__)

    source = Path(args[0])
    output = Path(args[1]) if len(args) > 1 else Path(__file__).resolve().parent.parent / "input.csv"
    convert(source, output)


if __name__ == "__main__":
    main()
