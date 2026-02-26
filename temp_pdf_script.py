
import sys
sys.path.insert(0, '/usr/lib/python3/dist-packages')

from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from datetime import datetime
import json

# Register fonts
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('Microsoft YaHei', '/usr/share/fonts/truetype/chinese/msyh.ttf'))
registerFontFamily('Microsoft YaHei', normal='Microsoft YaHei', bold='Microsoft YaHei')
registerFontFamily('SimHei', normal='SimHei', bold='SimHei')

# Data
data = json.loads('''{"id":1,"Header Timestamp":"2026-02-13T22:13:29.423Z","Tanggal Kejadian":"2026-02-14","Waktu Kejadian":"7:30","Shift Kejadian":"I ( satu )","Gardu Kejadian":"GRD 02","Waktu Mengirformasikan":"7:32","Waktu Penanganan":"7:55","PETUGAS KSPT":"Ade Saputra","PETUGAS PULTOL":"M. Ibrahim","Petugas Security":"Muhammad Ikmal","PETUGAS IT":"Wahyu","PETUGAS TEKNISI":"-","Lokasi Kejadian":"Kaluku Bodoa","Kronologi Kejadian":"tes\n","Antrian Kendaraan":"0","Keluhan Pengguna Jalan":"tes","Tindakan KSPT":"tes","Tindakan IT":"tes","Tindakan Teknisi":"tidak ada","Tindakan PulTol":"tes","Tindakan Security":"tes","A.Jenis Gangguan - Palang":"Tidak ada","B.Jenis Gangguan Reader / Periferal":"Tidak ada","C. Jenis Gangguan - Sistim":"Tidak ada","D. Jenis Gangguan - Kelistrikan":"","Status Tindakan":"Selesai","Jumlah Alarm":"1","Jumlah Reset":"1","Foto Sebelum":"/uploads/photo_1771020807862_isiqsh.jpg","Foto Sesudah":"/uploads/photo_1771020808854_wps9w.jpg"}''')

# Create document
doc = SimpleDocTemplate(
    "/home/z/my-project/public/reports/Laporan_Kejadian_2026-02-13T22-15-43-860Z.pdf",
    pagesize=A4,
    rightMargin=1.5*cm,
    leftMargin=1.5*cm,
    topMargin=1.5*cm,
    bottomMargin=1.5*cm,
    title="Laporan Kejadian",
    author="Z.ai",
    creator="Z.ai"
)

# Styles
styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    'TitleStyle',
    parent=styles['Title'],
    fontName='Microsoft YaHei',
    fontSize=16,
    alignment=TA_CENTER,
    spaceAfter=20
)

subtitle_style = ParagraphStyle(
    'SubtitleStyle',
    parent=styles['Normal'],
    fontName='Microsoft YaHei',
    fontSize=12,
    alignment=TA_CENTER,
    spaceAfter=10
)

header_style = ParagraphStyle(
    'HeaderStyle',
    parent=styles['Normal'],
    fontName='Microsoft YaHei',
    fontSize=11,
    textColor=colors.white,
    alignment=TA_CENTER
)

cell_style = ParagraphStyle(
    'CellStyle',
    parent=styles['Normal'],
    fontName='SimHei',
    fontSize=10,
    alignment=TA_LEFT,
    wordWrap='CJK'
)

section_style = ParagraphStyle(
    'SectionStyle',
    parent=styles['Normal'],
    fontName='Microsoft YaHei',
    fontSize=11,
    textColor=colors.HexColor('#1F4E79'),
    spaceBefore=15,
    spaceAfter=5
)

body_style = ParagraphStyle(
    'BodyStyle',
    parent=styles['Normal'],
    fontName='SimHei',
    fontSize=10,
    alignment=TA_JUSTIFY,
    wordWrap='CJK'
)

story = []

# Title
story.append(Paragraph("<b>LAPORAN KEJADIAN DAN GANGGUAN</b>", title_style))
story.append(Paragraph("SISTEM MONITORING TOL", subtitle_style))
story.append(Spacer(1, 10))

# Info Header Table
header_data = [
    [Paragraph('<b>No. Laporan</b>', header_style), Paragraph(': ' + datetime.now().strftime('%Y%m%d%H%M'), cell_style)],
    [Paragraph('<b>Tanggal Laporan</b>', header_style), Paragraph(': ' + datetime.now().strftime('%d/%m/%Y %H:%M'), cell_style)],
]
header_table = Table(header_data, colWidths=[4*cm, 12*cm])
header_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (0, -1), colors.white),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#1F4E79')),
]))
story.append(header_table)
story.append(Spacer(1, 15))

# Section: Informasi Kejadian
story.append(Paragraph("<b>1. INFORMASI KEJADIAN</b>", section_style))

def safe_get(key):
    val = data.get(key, '-') or '-'
    return str(val)

info_data = [
    [Paragraph('<b>Tanggal Kejadian</b>', cell_style), Paragraph(safe_get('Tanggal Kejadian'), cell_style)],
    [Paragraph('<b>Waktu Kejadian</b>', cell_style), Paragraph(safe_get('Waktu Kejadian'), cell_style)],
    [Paragraph('<b>Shift</b>', cell_style), Paragraph(safe_get('Shift Kejadian'), cell_style)],
    [Paragraph('<b>Gardu</b>', cell_style), Paragraph(safe_get('Gardu Kejadian'), cell_style)],
    [Paragraph('<b>Lokasi</b>', cell_style), Paragraph(safe_get('Lokasi Kejadian'), cell_style)],
]

info_table = Table(info_data, colWidths=[5*cm, 11*cm])
info_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#E8F4FD')),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
]))
story.append(info_table)
story.append(Spacer(1, 15))

# Section: Kronologi
story.append(Paragraph("<b>2. KRONOLOGI KEJADIAN</b>", section_style))
kronologi = safe_get('Kronologi Kejadian')
story.append(Paragraph(kronologi, body_style))
story.append(Spacer(1, 15))

# Section: Jenis Gangguan
story.append(Paragraph("<b>3. JENIS GANGGUAN</b>", section_style))

gangguan_data = [
    [Paragraph('<b>No</b>', header_style), Paragraph('<b>Jenis Gangguan</b>', header_style), Paragraph('<b>Keterangan</b>', header_style)],
    [Paragraph('1', cell_style), Paragraph('Gangguan Palang', cell_style), Paragraph(safe_get('A.Jenis Gangguan - Palang'), cell_style)],
    [Paragraph('2', cell_style), Paragraph('Gangguan Reader/Periferal', cell_style), Paragraph(safe_get('B.Jenis Gangguan Reader / Periferal'), cell_style)],
    [Paragraph('3', cell_style), Paragraph('Gangguan Sistem', cell_style), Paragraph(safe_get('C. Jenis Gangguan - Sistim'), cell_style)],
    [Paragraph('4', cell_style), Paragraph('Gangguan Kelistrikan', cell_style), Paragraph(safe_get('D. Jenis Gangguan - Kelistrikan'), cell_style)],
]

gangguan_table = Table(gangguan_data, colWidths=[1.5*cm, 5*cm, 9.5*cm])
gangguan_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('ALIGN', (0, 0), (0, -1), 'CENTER'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
]))
story.append(gangguan_table)
story.append(Spacer(1, 15))

# Section: Tindakan
story.append(Paragraph("<b>4. TINDAKAN</b>", section_style))

tindakan_data = [
    [Paragraph('<b>No</b>', header_style), Paragraph('<b>Pelaksana</b>', header_style), Paragraph('<b>Tindakan</b>', header_style)],
    [Paragraph('1', cell_style), Paragraph('KSPT', cell_style), Paragraph(safe_get('Tindakan KSPT'), cell_style)],
    [Paragraph('2', cell_style), Paragraph('IT', cell_style), Paragraph(safe_get('Tindakan IT'), cell_style)],
    [Paragraph('3', cell_style), Paragraph('Teknisi', cell_style), Paragraph(safe_get('Tindakan Teknisi'), cell_style)],
    [Paragraph('4', cell_style), Paragraph('PulTol', cell_style), Paragraph(safe_get('Tindakan PulTol'), cell_style)],
    [Paragraph('5', cell_style), Paragraph('Security', cell_style), Paragraph(safe_get('Tindakan Security'), cell_style)],
]

tindakan_table = Table(tindakan_data, colWidths=[1.5*cm, 3*cm, 11.5*cm])
tindakan_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('ALIGN', (0, 0), (0, -1), 'CENTER'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
]))
story.append(tindakan_table)
story.append(Spacer(1, 15))

# Section: Petugas
story.append(Paragraph("<b>5. PETUGAS</b>", section_style))

petugas_data = [
    [Paragraph('<b>Jabatan</b>', header_style), Paragraph('<b>Nama</b>', header_style)],
    [Paragraph('Petugas KSPT', cell_style), Paragraph(safe_get('PETUGAS KSPT'), cell_style)],
    [Paragraph('Petugas PulTol', cell_style), Paragraph(safe_get('PETUGAS PULTOL'), cell_style)],
    [Paragraph('Petugas IT', cell_style), Paragraph(safe_get('PETUGAS IT'), cell_style)],
    [Paragraph('Petugas Teknisi', cell_style), Paragraph(safe_get('PETUGAS TEKNISI'), cell_style)],
    [Paragraph('Petugas Security', cell_style), Paragraph(safe_get('Petugas Security'), cell_style)],
]

petugas_table = Table(petugas_data, colWidths=[5*cm, 11*cm])
petugas_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
]))
story.append(petugas_table)
story.append(Spacer(1, 15))

# Section: Status
story.append(Paragraph("<b>6. STATUS TINDAKAN</b>", section_style))

status_data = [
    [Paragraph('<b>Status</b>', cell_style), Paragraph(safe_get('Status Tindakan'), cell_style)],
    [Paragraph('<b>Jumlah Alarm</b>', cell_style), Paragraph(safe_get('Jumlah Alarm'), cell_style)],
    [Paragraph('<b>Jumlah Reset</b>', cell_style), Paragraph(safe_get('Jumlah Reset'), cell_style)],
]

status_table = Table(status_data, colWidths=[5*cm, 11*cm])
status_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#E8F4FD')),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
]))
story.append(status_table)
story.append(Spacer(1, 15))

# Section: Informasi Tambahan
story.append(Paragraph("<b>7. INFORMASI TAMBAHAN</b>", section_style))

tambahan_data = [
    [Paragraph('<b>Waktu Menginformasikan</b>', cell_style), Paragraph(safe_get('Waktu Mengirformasikan'), cell_style)],
    [Paragraph('<b>Waktu Penanganan</b>', cell_style), Paragraph(safe_get('Waktu Penanganan'), cell_style)],
    [Paragraph('<b>Antrian Kendaraan</b>', cell_style), Paragraph(safe_get('Antrian Kendaraan'), cell_style)],
    [Paragraph('<b>Keluhan Pengguna Jalan</b>', cell_style), Paragraph(safe_get('Keluhan Pengguna Jalan'), cell_style)],
]

tambahan_table = Table(tambahan_data, colWidths=[5*cm, 11*cm])
tambahan_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#E8F4FD')),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
]))
story.append(tambahan_table)
story.append(Spacer(1, 20))

# Footer
story.append(Paragraph("_" * 80, body_style))
story.append(Spacer(1, 10))
story.append(Paragraph("Dokumen ini dibuat secara otomatis oleh Sistem Monitoring TOL", body_style))
story.append(Paragraph("Tanggal: " + datetime.now().strftime('%d/%m/%Y %H:%M:%S'), body_style))

# Build PDF
doc.build(story)
print("PDF_CREATED:/home/z/my-project/public/reports/Laporan_Kejadian_2026-02-13T22-15-43-860Z.pdf")
