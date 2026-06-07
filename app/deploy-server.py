#!/usr/bin/env python3
from __future__ import annotations

import json
import mimetypes
import os
import re
import sys
import zipfile
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parent
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "5173"))
EXCEL_PATH = Path(os.environ.get("EXCEL_FILE", ROOT / "file du lieu.xlsx")).resolve()

TASKS = [
    ("Số thu", 7, 8, 9),
    ("Kê khai thuế", 10, 11, 12),
    ("Quản lý rủi ro HKD", 13, 14, 15),
    ("Kiểm tra HKD", 16, 17, 18),
    ("Rà soát TMĐT", 19, 20, 21),
    ("Hỗ trợ hóa đơn điện tử", 22, 23, 24),
    ("Chuyển đổi lên doanh nghiệp", 25, 26, 27),
    ("Nộp thuế điện tử", 28, 29, 30),
    ("Nợ thuế", 31, 32, 33),
    ("Cưỡng chế xuất nhập cảnh", 34, 35, 36),
    ("Cưỡng chế tài khoản hóa đơn", 37, 38, 39),
    ("Hệ số K", 40, 41, 42),
    ("Thủ tục hành chính", 43, 44, 45),
]

NAME_MAP = {
    "Nguyễn Văn Toàn": "Nguyễn Viết Toàn",
}

NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
}


def column_to_index(cell_ref: str) -> int:
    letters = re.sub(r"[^A-Z]", "", cell_ref.upper())
    value = 0
    for letter in letters:
        value = value * 26 + (ord(letter) - 64)
    return value


def excel_serial_to_date(value: str) -> str:
    try:
        serial = float(value)
    except ValueError:
        return value[:10]
    date = datetime(1899, 12, 30) + timedelta(days=serial)
    return date.date().isoformat()


def normalize_date(value: object) -> str:
    text = "" if value is None else str(value).strip()
    if not text:
        return ""
    if re.match(r"^\d{4}-\d{2}-\d{2}", text):
        return text[:10]
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(text[:10], fmt).date().isoformat()
        except ValueError:
            pass
    if re.match(r"^\d+(\.\d+)?$", text):
        return excel_serial_to_date(text)
    return text[:10]


def number(value: object) -> int:
    text = "" if value is None else str(value).strip()
    if not text:
        return 0
    text = text.replace(".", "").replace(",", ".")
    text = re.sub(r"[^\d.-]", "", text)
    try:
        return int(float(text))
    except ValueError:
        return 0


def read_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    strings: list[str] = []
    for item in root.findall("main:si", NS):
        texts = [node.text or "" for node in item.findall(".//main:t", NS)]
        strings.append("".join(texts))
    return strings


def first_sheet_path(zf: zipfile.ZipFile) -> str:
    workbook = ET.fromstring(zf.read("xl/workbook.xml"))
    first_sheet = workbook.find("main:sheets/main:sheet", NS)
    if first_sheet is None:
        raise ValueError("Workbook không có sheet")
    relationship_id = first_sheet.attrib.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    for rel in rels.findall("rel:Relationship", NS):
        if rel.attrib.get("Id") == relationship_id:
            target = rel.attrib["Target"]
            return "xl/" + target.lstrip("/")
    return "xl/worksheets/sheet1.xml"


def cell_value(cell: ET.Element, shared_strings: list[str]) -> str:
    cell_type = cell.attrib.get("t")
    value_node = cell.find("main:v", NS)
    if cell_type == "inlineStr":
        texts = [node.text or "" for node in cell.findall(".//main:t", NS)]
        return "".join(texts)
    if value_node is None or value_node.text is None:
        return ""
    value = value_node.text
    if cell_type == "s":
        return shared_strings[int(value)]
    return value


def read_sheet_matrix(path: Path) -> list[list[str]]:
    with zipfile.ZipFile(path) as zf:
        shared_strings = read_shared_strings(zf)
        sheet = ET.fromstring(zf.read(first_sheet_path(zf)))
    rows: list[list[str]] = []
    for row in sheet.findall(".//main:sheetData/main:row", NS):
        values: dict[int, str] = {}
        for cell in row.findall("main:c", NS):
            ref = cell.attrib.get("r", "")
            if not ref:
                continue
            values[column_to_index(ref)] = cell_value(cell, shared_strings)
        if values:
            max_col = max(values)
            rows.append([values.get(index, "") for index in range(1, max_col + 1)])
        else:
            rows.append([])
    return rows


def local_excel_rows() -> list[dict[str, object]]:
    if not EXCEL_PATH.exists():
        raise FileNotFoundError(f"Không tìm thấy {EXCEL_PATH}")
    sheet_rows = read_sheet_matrix(EXCEL_PATH)
    output: list[dict[str, object]] = []
    for row in sheet_rows[2:16]:
        officer = row[0].strip() if row else ""
        if not officer:
            continue
        officer = NAME_MAP.get(officer, officer)
        for task_title, assigned_col, completed_col, deadline_col in TASKS:
            output.append(
                {
                    "taskTitle": task_title,
                    "officerName": officer,
                    "assigned": number(row[assigned_col - 1] if len(row) >= assigned_col else ""),
                    "completed": number(row[completed_col - 1] if len(row) >= completed_col else ""),
                    "deadline": normalize_date(row[deadline_col - 1] if len(row) >= deadline_col else ""),
                }
            )
    return output


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status: int, payload: object) -> None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/local-file-du-lieu":
            try:
                self.send_json(200, local_excel_rows())
            except Exception as exc:
                self.send_json(500, {"error": str(exc)})
            return

        request_path = unquote(parsed.path).lstrip("/")
        if not request_path:
            request_path = "index.html"
        file_path = (ROOT / request_path).resolve()
        if not str(file_path).startswith(str(ROOT)) or not file_path.exists() or file_path.is_dir():
            file_path = ROOT / "index.html"

        data = file_path.read_bytes()
        content_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, format: str, *args: object) -> None:
        sys.stderr.write("%s - %s\n" % (self.address_string(), format % args))


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Server chạy tại http://{HOST}:{PORT}")
    print(f"File Excel: {EXCEL_PATH}")
    server.serve_forever()


if __name__ == "__main__":
    main()
