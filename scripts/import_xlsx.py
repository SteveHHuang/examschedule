"""Read the school's bilingual XLSX layout without modifying the source workbook.

Uses only Python's standard library. Expands actual merged ranges, preserves
blank unmerged cells, and respects decimal date display (6.3 with 0.00 = 6.30).
"""
import argparse
import csv
from datetime import date, datetime, timedelta
from decimal import Decimal
import json
from pathlib import Path
import posixpath
import re
import sys
import xml.etree.ElementTree as ET
from zipfile import ZipFile

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
HEADERS = ["日期Date", "时间Time", "课程名称Subject", "年级Grade", "班级Class",
           "时长Minutes", "数量Numbers", "考场Room", "监考1Proctor1", "监考2Proctor2"]
OUTPUT = ["examDate", "examTime", "subject", "grade", "minutes", "classNum",
          "location", "proctor1", "proctor2", "numOfStudents"]


def coordinates(address):
    match = re.fullmatch(r"([A-Z]+)([1-9]\d*)", address)
    if not match:
        raise ValueError("Invalid cell address: " + address)
    column = 0
    for character in match[1]:
        column = column * 26 + ord(character) - 64
    return int(match[2]), column


def clean(value):
    return "" if value is None else str(value).strip()


def clean_proctor(value):
    text = clean(value)
    return "" if text in {"/", "／"} else text


def excel_date(value, number_format, year, date1904=False):
    text = clean(value)
    # Excel serial dates use date styles; this source also uses decimal M.D.
    if isinstance(value, (int, float, Decimal)):
        style = re.sub(r'"[^\"]*"|\[[^\]]*\]|_.', "", number_format).lower()
        if re.search(r"[yd]", style):
            epoch = datetime(1904, 1, 1) if date1904 else datetime(1899, 12, 30)
            result = (epoch + timedelta(days=float(value))).date()
            if result.year != year:
                raise ValueError("Date year differs from --year: " + str(result))
            return str(result.year) + "." + str(result.month) + "." + str(result.day)
        decimals = re.match(r"[0#]+\.([0#]+)", style)
        if decimals:
            text = format(Decimal(str(value)), "." + str(len(decimals[1])) + "f")
    full = re.fullmatch(r"(\d{4})[./-](\d{1,2})[./-](\d{1,2})", text)
    short = re.fullmatch(r"(\d{1,2})[./-](\d{1,2})", text)
    if full:
        actual_year, month, day = map(int, full.groups())
        if actual_year != year:
            raise ValueError("Date year differs from --year: " + text)
    elif short:
        month, day = map(int, short.groups())
    else:
        raise ValueError("Unrecognized date: " + text)
    result = date(year, month, day)
    return str(result.year) + "." + str(result.month) + "." + str(result.day)


def read_sheet(filename, sheet_name=None):
    with ZipFile(filename) as archive:
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        sheets = workbook.findall("m:sheets/m:sheet", NS)
        if sheet_name is None and len(sheets) != 1:
            raise ValueError("Multiple worksheets: specify --sheet")
        sheet = next((s for s in sheets if sheet_name is None or s.get("name") == sheet_name), None)
        if sheet is None:
            raise ValueError("Worksheet not found: " + str(sheet_name))
        relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        rel = next(r for r in relationships if r.get("Id") == sheet.get(REL))
        if rel.get("TargetMode") == "External":
            raise ValueError("External worksheet references are not supported")
        target = rel.get("Target")
        part = target.lstrip("/") if target.startswith("/") else posixpath.normpath("xl/" + target)
        root = ET.fromstring(archive.read(part))
        strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            strings = ["".join(t.text or "" for t in item.findall(".//m:t", NS))
                       for item in ET.fromstring(archive.read("xl/sharedStrings.xml"))]
        styles = ET.fromstring(archive.read("xl/styles.xml"))
        formats = {int(item.get("numFmtId")): item.get("formatCode")
                   for item in styles.findall("m:numFmts/m:numFmt", NS)}
        builtin = {14: "mm-dd-yy", 15: "d-mmm-yy", 16: "d-mmm", 17: "mmm-yy", 22: "m/d/yy h:mm"}
        cell_styles = list(styles.find("m:cellXfs", NS))
        values, number_formats = {}, {}
        for cell in root.findall("m:sheetData/m:row/m:c", NS):
            address = coordinates(cell.get("r"))
            node = cell.find("m:v", NS)
            raw = node.text if node is not None else None
            kind = cell.get("t")
            if kind == "s":
                value = strings[int(raw)]
            elif kind == "inlineStr":
                value = "".join(t.text or "" for t in cell.findall("m:is//m:t", NS))
            elif kind == "e":
                raise ValueError("Excel error at " + cell.get("r") + ": " + str(raw))
            elif raw is None:
                if cell.find("m:f", NS) is not None:
                    raise ValueError("Formula has no cached value at " + cell.get("r") + "; recalculate in Excel")
                value = None
            elif kind in ("str", "b", "d"):
                value = raw
            else:
                numeric = Decimal(raw)
                value = int(numeric) if numeric == numeric.to_integral_value() else numeric
            values[address] = value
            fmt_id = int(cell_styles[int(cell.get("s", 0))].get("numFmtId", 0))
            number_formats[address] = formats.get(fmt_id, builtin.get(fmt_id, "General"))
        merged = []
        for area in root.findall("m:mergeCells/m:mergeCell", NS):
            start, end = area.get("ref").split(":")
            r1, c1 = coordinates(start)
            r2, c2 = coordinates(end)
            for r in range(r1, r2 + 1):
                for c in range(c1, c2 + 1):
                    values[r, c] = values.get((r1, c1))
                    number_formats[r, c] = number_formats.get((r1, c1), "General")
            merged.append(area.get("ref"))
        props = workbook.find("m:workbookPr", NS)
        return sheet.get("name"), values, number_formats, merged, props is not None and props.get("date1904") in ("1", "true")


def convert(filename, year, sheet_name=None):
    sheet, cells, formats, merges, date1904 = read_sheet(filename, sheet_name)
    header_row = next((row for row in range(1, 11) if
                       re.sub(r"\s+", "", clean(cells.get((row, 1)))) == HEADERS[0]), None)
    if header_row is None:
        raise ValueError("Cannot find bilingual school header in first 10 rows")
    for column, expected in enumerate(HEADERS, 1):
        actual = re.sub(r"\s+", "", clean(cells.get((header_row, column))))
        if actual != expected:
            raise ValueError("Unexpected column " + str(column) + ": " + actual + "; expected " + expected)
    records, source_rows, blank_classes, absent_second_proctors = [], [], [], []
    max_row = max(row for row, _ in cells)
    max_col = max(col for _, col in cells)
    for row in range(header_row + 1, max_row + 1):
        raw = [cells.get((row, col)) for col in range(1, max_col + 1)]
        if not any(clean(value) for value in raw):
            continue
        try:
            students = [clean(value) for value in raw[10:] if clean(value)]
            count = int(clean(raw[6]))
            if len(students) != count:
                raise ValueError("Student count " + str(count) + " differs from roster " + str(len(students)))
            if len(students) != len(set(students)):
                raise ValueError("Duplicate student in the same record")
            records.append([excel_date(raw[0], formats.get((row, 1), "General"), year, date1904),
                            clean(raw[1]), clean(raw[2]), clean(raw[3]), clean(raw[5]), clean(raw[4]),
                            clean(raw[7]), clean_proctor(raw[8]), clean_proctor(raw[9]), str(count), *students])
            source_rows.append(row)
            if not clean(raw[4]):
                blank_classes.append(row)
            if clean(raw[9]) in {"/", "／"}:
                absent_second_proctors.append(row)
        except (ValueError, TypeError) as error:
            raise ValueError(sheet + " row " + str(row) + ": " + str(error)) from error
    if not records:
        raise ValueError("No exam records found")
    slots = max(48, max(len(record) - 10 for record in records))
    return OUTPUT + ["s" + str(i) for i in range(1, slots + 1)], records, {
        "sheet": sheet, "records": len(records), "sourceRows": source_rows,
        "mergedRanges": len(merges), "blankClassRows": blank_classes,
        "absentSecondProctorRows": absent_second_proctors,
        "dates": sorted({record[0] for record in records}), "year": year,
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("--year", type=int, required=True, help="Calendar year of the exams, e.g. 2026")
    parser.add_argument("--sheet")
    parser.add_argument("--output", type=Path, default=Path("input.csv"))
    args = parser.parse_args(argv)
    if args.output.resolve() == args.source.resolve():
        raise ValueError("Output must not overwrite the source workbook")
    header, records, summary = convert(args.source, args.year, args.sheet)
    with args.output.open("w", encoding="utf-8", newline="") as target:
        writer = csv.writer(target, lineterminator="\n")
        writer.writerow(header)
        for record in records:
            writer.writerow(record + [""] * (len(header) - len(record)))
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError, KeyError, ET.ParseError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
