import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import https from 'https';
import http from 'http';

const execAsync = promisify(exec);

interface KejadianData {
  'Header Timestamp': string;
  'Tanggal Kejadian': string;
  'Waktu Kejadian': string;
  'Shift Kejadian': string;
  'Gardu Kejadian': string;
  'Waktu Mengirformasikan': string;
  'Waktu Penanganan': string;
  'PETUGAS KSPT': string;
  'PETUGAS PULTOL': string;
  'Petugas Security': string;
  'PETUGAS IT': string;
  'PETUGAS TEKNISI': string;
  'Lokasi Kejadian': string;
  'Kronologi Kejadian': string;
  'Antrian Kendaraan': string;
  'Keluhan Pengguna Jalan': string;
  'Tindakan KSPT': string;
  'Tindakan IT': string;
  'Tindakan Teknisi': string;
  'Tindakan PulTol': string;
  'Tindakan Security': string;
  'A.Jenis Gangguan - Palang': string;
  'B.Jenis Gangguan Reader / Periferal': string;
  'C. Jenis Gangguan - Sistim': string;
  'D. Jenis Gangguan - Kelistrikan': string;
  'Status Tindakan': string;
  'Jumlah Alarm': string;
  'Jumlah Reset': string;
  'Foto Sebelum': string;
  'Foto Sesudah': string;
}

// Download image from URL to temp file
async function downloadImage(url: string, tempDir: string, filename: string): Promise<string | null> {
  if (!url || url === '-') return null;
  
  const filePath = path.join(tempDir, filename);
  
  // Handle base64 data URLs
  if (url.startsWith('data:image')) {
    try {
      const base64Data = url.split(',')[1];
      if (base64Data) {
        await fs.writeFile(filePath, base64Data, 'base64');
        return filePath;
      }
    } catch (error) {
      console.error('Error saving base64 image:', error);
      return null;
    }
  }
  
  // Handle local URLs
  if (url.startsWith('/uploads/') || url.startsWith('/reports/')) {
    const localPath = path.join(process.cwd(), 'public', url);
    try {
      await fs.access(localPath);
      return localPath;
    } catch {
      return null;
    }
  }
  
  // Handle Google Drive URLs
  if (url.includes('drive.google.com')) {
    // Extract file ID from URL
    let fileId = '';
    if (url.includes('id=')) {
      fileId = url.split('id=')[1].split('&')[0];
    } else if (url.includes('/d/')) {
      fileId = url.split('/d/')[1].split('/')[0];
    }
    
    if (fileId) {
      // Use direct download URL
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      
      return new Promise((resolve) => {
        const file = fs.createWriteStream(filePath);
        https.get(downloadUrl, (response) => {
          if (response.statusCode === 302 || response.statusCode === 301) {
            // Follow redirect
            const redirectUrl = response.headers.location;
            if (redirectUrl) {
              https.get(redirectUrl, (redirectResponse) => {
                redirectResponse.pipe(file);
                file.on('finish', () => {
                  file.close();
                  resolve(filePath);
                });
              }).on('error', (err) => {
                console.error('Error downloading from redirect:', err);
                resolve(null);
              });
            } else {
              resolve(null);
            }
          } else {
            response.pipe(file);
            file.on('finish', () => {
              file.close();
              resolve(filePath);
            });
          }
        }).on('error', (err) => {
          console.error('Error downloading image:', err);
          resolve(null);
        });
      });
    }
  }
  
  // Handle other HTTP/HTTPS URLs
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const client = url.startsWith('https://') ? https : http;
    
    return new Promise((resolve) => {
      const file = fs.createWriteStream(filePath);
      client.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            const redirectClient = redirectUrl.startsWith('https://') ? https : http;
            redirectClient.get(redirectUrl, (redirectResponse) => {
              redirectResponse.pipe(file);
              file.on('finish', () => {
                file.close();
                resolve(filePath);
              });
            }).on('error', (err) => {
              console.error('Error downloading from redirect:', err);
              resolve(null);
            });
          } else {
            resolve(null);
          }
        } else {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve(filePath);
          });
        }
      }).on('error', (err) => {
        console.error('Error downloading image:', err);
        resolve(null);
      });
    });
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const data: KejadianData = await request.json();
    
    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `Laporan_Kejadian_${timestamp}.pdf`;
    const outputPath = path.join(process.cwd(), 'public', 'reports', filename);
    
    // Ensure directories exist
    const reportsDir = path.join(process.cwd(), 'public', 'reports');
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(reportsDir, { recursive: true });
    await fs.mkdir(tempDir, { recursive: true });
    
    // Write data to temp JSON file
    const dataFilePath = path.join(tempDir, `pdf_data_${Date.now()}.json`);
    await fs.writeFile(dataFilePath, JSON.stringify(data));
    
    // Download photos
    const timestamp2 = Date.now();
    console.log('Foto Sebelum URL:', data['Foto Sebelum']?.substring(0, 100));
    console.log('Foto Sesudah URL:', data['Foto Sesudah']?.substring(0, 100));
    
    const fotoSebelumPath = await downloadImage(data['Foto Sebelum'], tempDir, `foto_sebelum_${timestamp2}.jpg`);
    const fotoSesudahPath = await downloadImage(data['Foto Sesudah'], tempDir, `foto_sesudah_${timestamp2}.jpg`);
    
    console.log('Foto Sebelum Path:', fotoSebelumPath);
    console.log('Foto Sesudah Path:', fotoSesudahPath);
    
    // Logo path - use the company logo
    const logoPath = path.join(process.cwd(), 'public', 'logo-company.jpg');
    
    // Create Python script for PDF generation
    const pythonScript = `import sys
import json
import os
sys.path.insert(0, '/usr/lib/python3/dist-packages')

from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import cm, mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from datetime import datetime

# Register fonts
try:
    pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
    pdfmetrics.registerFont(TTFont('Microsoft YaHei', '/usr/share/fonts/truetype/chinese/msyh.ttf'))
    registerFontFamily('Microsoft YaHei', normal='Microsoft YaHei', bold='Microsoft YaHei')
    registerFontFamily('SimHei', normal='SimHei', bold='SimHei')
except:
    pass

# Read data from file
data_file = "${dataFilePath}"
output_path = "${outputPath}"
logo_path = "${logoPath}"
foto_sebelum_path = "${fotoSebelumPath || ''}"
foto_sesudah_path = "${fotoSesudahPath || ''}"

with open(data_file, 'r') as f:
    data = json.load(f)

# Create document
doc = SimpleDocTemplate(
    output_path,
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
    fontSize=14,
    alignment=TA_LEFT,
    spaceAfter=0,
    spaceBefore=0
)

subtitle_style = ParagraphStyle(
    'SubtitleStyle',
    parent=styles['Normal'],
    fontName='Microsoft YaHei',
    fontSize=11,
    alignment=TA_LEFT,
    spaceAfter=0,
    spaceBefore=0
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
    fontSize=10,
    textColor=colors.HexColor('#1F4E79'),
    spaceBefore=8,
    spaceAfter=3
)

body_style = ParagraphStyle(
    'BodyStyle',
    parent=styles['Normal'],
    fontName='SimHei',
    fontSize=10,
    alignment=TA_JUSTIFY,
    wordWrap='CJK'
)

photo_label_style = ParagraphStyle(
    'PhotoLabelStyle',
    parent=styles['Normal'],
    fontName='Microsoft YaHei',
    fontSize=10,
    alignment=TA_CENTER,
    spaceAfter=5
)

story = []

# Header with 3-column layout matching the reference
logo_exists = os.path.exists(logo_path)

# Styles for header
company_style = ParagraphStyle(
    'CompanyStyle',
    parent=styles['Normal'],
    fontName='Microsoft YaHei',
    fontSize=9,
    alignment=TA_CENTER,
    spaceAfter=0,
    spaceBefore=0
)

report_title_style = ParagraphStyle(
    'ReportTitleStyle',
    parent=styles['Normal'],
    fontName='Microsoft YaHei',
    fontSize=11,
    alignment=TA_CENTER,
    spaceAfter=0,
    spaceBefore=2
)

doc_info_style = ParagraphStyle(
    'DocInfoStyle',
    parent=styles['Normal'],
    fontName='SimHei',
    fontSize=8,
    alignment=TA_LEFT,
    spaceAfter=0,
    spaceBefore=0
)

logo_style = ParagraphStyle(
    'LogoStyle',
    parent=styles['Normal'],
    fontName='Microsoft YaHei',
    fontSize=8,
    alignment=TA_CENTER,
    spaceAfter=0,
    spaceBefore=0
)

logo_text_style = ParagraphStyle(
    'LogoTextStyle',
    parent=styles['Normal'],
    fontName='Microsoft YaHei',
    fontSize=7,
    alignment=TA_CENTER,
    spaceAfter=0,
    spaceBefore=0,
    textColor=colors.HexColor('#333333')
)

# Left Column - Logo only (no text)
left_content = []
if logo_exists:
    try:
        logo_img = Image(logo_path, width=3*cm, height=3*cm)
        left_content.append(logo_img)
    except:
        pass

left_table = Table([[item] for item in left_content] if left_content else [['']], colWidths=[3.8*cm])
left_table.setStyle(TableStyle([
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('LEFTPADDING', (0, 0), (-1, -1), 0),
    ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ('TOPPADDING', (0, 0), (-1, -1), 0),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
]))

# Middle Column - Company info and report title (CENTER aligned)
middle_content = [
    Paragraph("<b>PT. MAKASSAR METRO NETWORK</b>", company_style),
    Paragraph("<b>PT. MAKASSAR AIRPORT NETWORK</b>", company_style),
    Paragraph("UNIT OPERASIONAL PENGUMPULAN TOL", doc_info_style),
    Paragraph("<b>LAPORAN KEJADIAN OPERASIONAL GERBANG</b>", report_title_style),
]
middle_table = Table([[item] for item in middle_content], colWidths=[9*cm])
middle_table.setStyle(TableStyle([
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('LEFTPADDING', (0, 0), (-1, -1), 0),
    ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ('TOPPADDING', (0, 0), (-1, -1), 0),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
]))

# Right Column - Document info (left aligned)
doc_no = datetime.now().strftime('%Y%m%d%H%M')
doc_date = datetime.now().strftime('%d/%m/%Y')
right_content = [
    Paragraph(f"<b>No. Dok</b>   : {doc_no}", doc_info_style),
    Paragraph(f"<b>Tgl. Terbit</b>: {doc_date}", doc_info_style),
    Paragraph(f"<b>Rev</b>         : 00", doc_info_style),
]
right_table = Table([[item] for item in right_content], colWidths=[3.7*cm])
right_table.setStyle(TableStyle([
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('LEFTPADDING', (0, 0), (-1, -1), 5),
    ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ('TOPPADDING', (0, 0), (-1, -1), 0),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
]))

# Combine all 3 columns
header_row = [[left_table, middle_table, right_table]]
main_header = Table(header_row, colWidths=[3.8*cm, 9*cm, 3.7*cm])
main_header.setStyle(TableStyle([
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('LEFTPADDING', (0, 0), (-1, -1), 0),
    ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ('LINEBELOW', (0, 0), (-1, 0), 2, colors.black),
    ('BOX', (0, 0), (-1, 0), 1, colors.black),
]))
story.append(main_header)
story.append(Spacer(1, 10))

# Section: Informasi Kejadian
story.append(Paragraph("<b>1. INFORMASI KEJADIAN</b>", section_style))

def safe_get(key):
    val = data.get(key, '-') or '-'
    return str(val).replace('\\\\n', ' ').replace('\\\\r', ' ').replace('\\\\t', ' ')

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
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
]))
story.append(info_table)
story.append(Spacer(1, 8))

# Section: Kronologi
story.append(Paragraph("<b>2. KRONOLOGI KEJADIAN</b>", section_style))
kronologi = safe_get('Kronologi Kejadian')
story.append(Paragraph(kronologi, body_style))
story.append(Spacer(1, 8))

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
story.append(Spacer(1, 8))

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
story.append(Spacer(1, 8))

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
story.append(Spacer(1, 8))

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
story.append(Spacer(1, 8))

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
story.append(Spacer(1, 8))

# Section: Foto Dokumentasi
story.append(Paragraph("<b>8. FOTO DOKUMENTASI</b>", section_style))

# Add photos side by side
photo_row = []
foto_sebelum_exists = foto_sebelum_path and os.path.exists(foto_sebelum_path)
foto_sesudah_exists = foto_sesudah_path and os.path.exists(foto_sesudah_path)

if foto_sebelum_exists and foto_sesudah_exists:
    try:
        foto_sebelum_img = Image(foto_sebelum_path, width=7.5*cm, height=5*cm)
        foto_sesudah_img = Image(foto_sesudah_path, width=7.5*cm, height=5*cm)
        
        photo_table_data = [[
            Table([
                [foto_sebelum_img],
                [Paragraph('<b>Foto Sebelum</b>', photo_label_style)]
            ], colWidths=[7.5*cm]),
            Table([
                [foto_sesudah_img],
                [Paragraph('<b>Foto Sesudah</b>', photo_label_style)]
            ], colWidths=[7.5*cm])
        ]]
        
        photo_table = Table(photo_table_data, colWidths=[8*cm, 8*cm])
        photo_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(photo_table)
    except Exception as e:
        story.append(Paragraph("Foto tidak dapat ditampilkan", body_style))
elif foto_sebelum_exists:
    try:
        foto_sebelum_img = Image(foto_sebelum_path, width=10*cm, height=6*cm)
        photo_table_data = [[
            Table([
                [foto_sebelum_img],
                [Paragraph('<b>Foto Sebelum</b>', photo_label_style)]
            ], colWidths=[10*cm])
        ]]
        photo_table = Table(photo_table_data, colWidths=[16*cm])
        photo_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ]))
        story.append(photo_table)
    except:
        story.append(Paragraph("Foto Sebelum: " + safe_get('Foto Sebelum'), body_style))
elif foto_sesudah_exists:
    try:
        foto_sesudah_img = Image(foto_sesudah_path, width=10*cm, height=6*cm)
        photo_table_data = [[
            Table([
                [foto_sesudah_img],
                [Paragraph('<b>Foto Sesudah</b>', photo_label_style)]
            ], colWidths=[10*cm])
        ]]
        photo_table = Table(photo_table_data, colWidths=[16*cm])
        photo_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ]))
        story.append(photo_table)
    except:
        story.append(Paragraph("Foto Sesudah: " + safe_get('Foto Sesudah'), body_style))
else:
    story.append(Paragraph("Tidak ada foto dokumentasi", body_style))

story.append(Spacer(1, 20))

# Footer
story.append(Paragraph("_" * 80, body_style))
story.append(Spacer(1, 10))
story.append(Paragraph("Dokumen ini dibuat secara otomatis oleh Sistem Monitoring TOL", body_style))
story.append(Paragraph("Tanggal: " + datetime.now().strftime('%d/%m/%Y %H:%M:%S'), body_style))

# Build PDF
doc.build(story)
print("PDF_CREATED")
`;

    // Write Python script to temp file
    const scriptPath = path.join(tempDir, `pdf_script_${Date.now()}.py`);
    await fs.writeFile(scriptPath, pythonScript);
    
    // Execute Python script using venv python that has reportlab
    const { stdout, stderr } = await execAsync(`/home/z/.venv/bin/python3 "${scriptPath}"`, {
      timeout: 60000,
    });
    
    // Clean up temp files
    await fs.unlink(scriptPath).catch(() => {});
    await fs.unlink(dataFilePath).catch(() => {});
    if (fotoSebelumPath) await fs.unlink(fotoSebelumPath).catch(() => {});
    if (fotoSesudahPath) await fs.unlink(fotoSesudahPath).catch(() => {});
    
    console.log('PDF generation stdout:', stdout);
    if (stderr) {
      console.error('PDF generation stderr:', stderr);
    }
    
    // Check if PDF was created
    try {
      await fs.access(outputPath);
    } catch {
      throw new Error('PDF file was not created');
    }
    
    return NextResponse.json({
      success: true,
      url: `/reports/${filename}`,
      filename,
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal membuat PDF: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
