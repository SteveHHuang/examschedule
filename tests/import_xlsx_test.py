from datetime import datetime
from decimal import Decimal
from contextlib import redirect_stdout
import io
from pathlib import Path
import tempfile
import unittest
from xml.sax.saxutils import escape
from zipfile import ZipFile

from scripts.import_xlsx import HEADERS, convert, excel_date, main


def cell(address, value, style=0):
    if value is None:
        return '<c r="' + address + '"/>'
    if isinstance(value, (int, float)):
        return '<c r="' + address + '" s="' + str(style) + '"><v>' + str(value) + '</v></c>'
    return '<c r="' + address + '" t="inlineStr"><is><t>' + escape(value) + '</t></is></c>'


def fixture(path, count=1):
    ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
    header = ''.join(cell(chr(65 + i) + '2', value) for i, value in enumerate(HEADERS + ['学生Students']))
    first = [6.3, '800-1000', '数学', 'G10', '1班', 120, 1, 'AP', '教师甲', '', '学生甲']
    second = [7.1, '800-1000', '生物选拔考试', 'G10', None, None, count, None, None, '/', '学生乙']
    rows = '<row r="2">' + header + '</row>'
    for r, values in [(3, first), (4, second)]:
        rows += '<row r="' + str(r) + '">' + ''.join(
            cell(chr(65 + i) + str(r), value, 1 if (r, i) == (3, 0) else 0)
            for i, value in enumerate(values)) + '</row>'
    with ZipFile(path, 'w') as z:
        z.writestr('xl/workbook.xml', '<workbook xmlns="' + ns + '" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>')
        z.writestr('xl/_rels/workbook.xml.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>')
        z.writestr('xl/styles.xml', '<styleSheet xmlns="' + ns + '"><numFmts><numFmt numFmtId="176" formatCode="0.00_ "/></numFmts><cellXfs><xf numFmtId="0"/><xf numFmtId="176"/></cellXfs></styleSheet>')
        z.writestr('xl/worksheets/sheet1.xml', '<worksheet xmlns="' + ns + '"><sheetData>' + rows + '</sheetData><mergeCells><mergeCell ref="F3:F4"/><mergeCell ref="H3:H4"/><mergeCell ref="I3:I4"/></mergeCells></worksheet>')


class ImportTests(unittest.TestCase):
    def test_decimal_date_display_is_preserved(self):
        self.assertEqual(excel_date(Decimal('6.3'), '0.00_ ', 2026), '2026.6.30')
        self.assertEqual(excel_date(Decimal('6.3'), 'General', 2026), '2026.6.3')
        self.assertEqual(excel_date(Decimal('7.1'), 'General', 2026), '2026.7.1')
        self.assertEqual(excel_date('2026/07/02', 'General', 2026), '2026.7.2')

    def test_real_excel_serial_and_invalid_dates(self):
        serial = (datetime(2026, 6, 30) - datetime(1899, 12, 30)).days
        self.assertEqual(excel_date(serial, 'mm-dd-yy', 2026), '2026.6.30')
        with self.assertRaises(ValueError):
            excel_date('2026.2.30', 'General', 2026)
        with self.assertRaisesRegex(ValueError, 'year differs'):
            excel_date('2025.6.30', 'General', 2026)

    def test_mapping_expands_only_real_merged_cells_and_preserves_blank_class(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'source.xlsx'
            fixture(path)
            header, rows, summary = convert(path, 2026)
        self.assertEqual(len(header), 58)
        self.assertEqual(rows[0][:10], ['2026.6.30', '800-1000', '数学', 'G10', '120', '1班', 'AP', '教师甲', '', '1'])
        self.assertEqual(rows[1][0], '2026.7.1')
        self.assertEqual(rows[1][4:9], ['120', '', 'AP', '教师甲', ''])
        self.assertEqual(summary['blankClassRows'], [4])
        self.assertEqual(summary['absentSecondProctorRows'], [4])
        self.assertEqual(summary['sourceRows'], [3, 4])

    def test_roster_mismatch_is_rejected_with_source_row(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'source.xlsx'
            fixture(path, count=2)
            with self.assertRaisesRegex(ValueError, 'Sheet1 row 4: Student count 2 differs from roster 1'):
                convert(path, 2026)

    def test_cli_writes_utf8_lf_and_cannot_overwrite_source(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'source.xlsx'
            output = Path(directory) / 'input.csv'
            fixture(source)
            original = source.read_bytes()
            with redirect_stdout(io.StringIO()):
                main([str(source), '--year', '2026', '--output', str(output)])
            self.assertIn('数学', output.read_text(encoding='utf-8'))
            self.assertNotIn(b'\r', output.read_bytes())
            self.assertEqual(source.read_bytes(), original)
            with self.assertRaisesRegex(ValueError, 'must not overwrite'):
                main([str(source), '--year', '2026', '--output', str(source)])
            self.assertEqual(source.read_bytes(), original)


if __name__ == '__main__':
    unittest.main()
