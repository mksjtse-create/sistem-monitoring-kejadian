import { NextRequest, NextResponse } from 'next/server';
import { 
  fetchKejadianData, 
  addKejadianRow, 
  initializeSheet,
  fetchDropdownOptions,
  isGoogleConfigured,
  getInputSheetGid
} from '@/lib/google-sheets';

// Sample data for demonstration when Google Sheets is not configured
const SAMPLE_DATA = [
  {
    id: 1,
    'Header Timestamp': new Date().toISOString(),
    'Tanggal Kejadian': '2024-01-15',
    'Waktu Kejadian': '08:30',
    'Shift Kejadian': 'Pagi',
    'Gardu Kejadian': 'Gardu 1',
    'Waktu Mengirformasikan': '08:35',
    'Waktu Penanganan': '08:45',
    'PETUGAS KSPT': 'Ahmad',
    'PETUGAS PULTOL': 'Budi',
    'Petugas Security': 'Candra',
    'PETUGAS IT': 'Dani',
    'PETUGAS TEKNISI': 'Eko',
    'Lokasi Kejadian': 'Gerbang Tol KM 15',
    'Kronologi Kejadian': 'Palang pintu tol tidak dapat bergerak naik',
    'Antrian Kendaraan': '15',
    'Keluhan Pengguna Jalan': 'Antrian terlalu lama',
    'Tindakan KSPT': 'Koordinasi dengan tim teknis',
    'Tindakan IT': 'Cek sistem dan restart server',
    'Tindakan Teknisi': 'Perbaikan motor palang',
    'Tindakan PulTol': 'Pengaturan lalu lintas manual',
    'Tindakan Security': 'Pengamanan lokasi',
    'A.Jenis Gangguan - Palang': 'Motor Rusak',
    'B.Jenis Gangguan Reader / Periferal': '-',
    'C. Jenis Gangguan - Sistim': '-',
    'D. Jenis Gangguan - Kelistrikan': '-',
    'Status Tindakan': 'Selesai',
    'Jumlah Alarm': '2',
    'Jumlah Reset': '1',
    'Foto Sebelum': '',
    'Foto Sesudah': '',
  },
  {
    id: 2,
    'Header Timestamp': new Date(Date.now() - 3600000).toISOString(),
    'Tanggal Kejadian': '2024-01-15',
    'Waktu Kejadian': '10:15',
    'Shift Kejadian': 'Pagi',
    'Gardu Kejadian': 'Gardu 2',
    'Waktu Mengirformasikan': '10:20',
    'Waktu Penanganan': '',
    'PETUGAS KSPT': 'Fani',
    'PETUGAS PULTOL': 'Gita',
    'Petugas Security': 'Hadi',
    'PETUGAS IT': '',
    'PETUGAS TEKNISI': 'Iwan',
    'Lokasi Kejadian': 'Gerbang Tol KM 25',
    'Kronologi Kejadian': 'Reader kartu tidak dapat membaca kartu',
    'Antrian Kendaraan': '8',
    'Keluhan Pengguna Jalan': 'Kartu tidak terbaca',
    'Tindakan KSPT': 'Sedang dalam proses penanganan',
    'Tindakan IT': '',
    'Tindakan Teknisi': 'Sedang menuju lokasi',
    'Tindakan PulTol': 'Membantu secara manual',
    'Tindakan Security': 'Pengamanan lokasi',
    'A.Jenis Gangguan - Palang': '-',
    'B.Jenis Gangguan Reader / Periferal': 'Reader Error',
    'C. Jenis Gangguan - Sistim': '-',
    'D. Jenis Gangguan - Kelistrikan': '-',
    'Status Tindakan': 'Proses',
    'Jumlah Alarm': '1',
    'Jumlah Reset': '0',
    'Foto Sebelum': '',
    'Foto Sesudah': '',
  },
  {
    id: 3,
    'Header Timestamp': new Date(Date.now() - 7200000).toISOString(),
    'Tanggal Kejadian': '2024-01-15',
    'Waktu Kejadian': '06:00',
    'Shift Kejadian': 'Malam',
    'Gardu Kejadian': 'Gardu 3',
    'Waktu Mengirformasikan': '06:05',
    'Waktu Penanganan': '',
    'PETUGAS KSPT': 'Joko',
    'PETUGAS PULTOL': 'Krisna',
    'Petugas Security': 'Lukman',
    'PETUGAS IT': '',
    'PETUGAS TEKNISI': '',
    'Lokasi Kejadian': 'Gerbang Tol KM 35',
    'Kronologi Kejadian': 'Sistem komputer mati total',
    'Antrian Kendaraan': '25',
    'Keluhan Pengguna Jalan': 'Sistem tidak berfungsi',
    'Tindakan KSPT': 'Menunggu tim IT',
    'Tindakan IT': '',
    'Tindakan Teknisi': '',
    'Tindakan PulTol': 'Membuka palang manual',
    'Tindakan Security': 'Pengamanan lokasi',
    'A.Jenis Gangguan - Palang': '-',
    'B.Jenis Gangguan Reader / Periferal': '-',
    'C. Jenis Gangguan - Sistim': 'Server Down',
    'D. Jenis Gangguan - Kelistrikan': '-',
    'Status Tindakan': 'Pending',
    'Jumlah Alarm': '3',
    'Jumlah Reset': '0',
    'Foto Sebelum': '',
    'Foto Sesudah': '',
  },
];

const SAMPLE_DROPDOWNS = {
  'Shift Kejadian': ['Pagi', 'Siang', 'Malam'],
  'Gardu Kejadian': ['Gardu 1', 'Gardu 2', 'Gardu 3', 'Gardu 4', 'Gardu 5'],
  'Lokasi Kejadian': ['Gerbang Tol KM 15', 'Gerbang Tol KM 25', 'Gerbang Tol KM 35', 'Gerbang Tol KM 45'],
  'Status Tindakan': ['Pending', 'Proses', 'Selesai'],
  'Jenis Gangguan - Palang': ['Motor Rusak', 'Sensor Error', 'Palang Patah', 'Lainnya'],
  'Jenis Gangguan Reader / Periferal': ['Reader Error', 'Printer Rusak', 'Scanner Error', 'Lainnya'],
  'Jenis Gangguan - Sistim': ['Server Down', 'Network Error', 'Database Error', 'Lainnya'],
  'Jenis Gangguan - Kelistrikan': ['Listrik Mati', 'UPS Error', 'Kabel Putus', 'Lainnya'],
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    // Check if Google Sheets is configured
    if (!isGoogleConfigured()) {
      console.log('Google Sheets not configured, returning sample data');
      
      if (type === 'dropdowns') {
        return NextResponse.json({ 
          success: true, 
          data: SAMPLE_DROPDOWNS,
          isDemo: true,
          message: 'Mode demo - Google Sheets belum dikonfigurasi'
        });
      }
      
      return NextResponse.json({ 
        success: true, 
        data: SAMPLE_DATA,
        isDemo: true,
        message: 'Mode demo - Google Sheets belum dikonfigurasi'
      });
    }

    if (type === 'dropdowns') {
      const options = await fetchDropdownOptions();
      return NextResponse.json({ success: true, data: options, isDemo: false });
    }

    await initializeSheet();
    const data = await fetchKejadianData();
    const sheetGid = await getInputSheetGid();
    return NextResponse.json({ success: true, data, isDemo: false, sheetGid });
  } catch (error) {
    console.error('GET Error:', error);
    
    // Return sample data on error
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    
    if (type === 'dropdowns') {
      return NextResponse.json({ 
        success: true, 
        data: SAMPLE_DROPDOWNS,
        isDemo: true,
        message: 'Menggunakan data demo - Gagal menghubungi Google Sheets'
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: SAMPLE_DATA,
      isDemo: true,
      message: 'Menggunakan data demo - Gagal menghubungi Google Sheets'
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isGoogleConfigured()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Google Sheets belum dikonfigurasi. Silakan setup kredensial terlebih dahulu.',
        isDemo: true
      }, { status: 400 });
    }
    
    const body = await request.json();
    await addKejadianRow(body);
    return NextResponse.json({ success: true, isDemo: false });
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan data ke Google Sheets' },
      { status: 500 }
    );
  }
}
