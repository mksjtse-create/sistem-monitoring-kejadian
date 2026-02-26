'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Users,
  MapPin,
  Building2,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface KejadianData {
  id: number;
  'Header Timestamp': string;
  'Tanggal Kejadian': string;
  'Waktu Kejadian': string;
  'Shift Kejadian': string;
  'Gardu Kejadian': string;
  'Status Tindakan': string;
  'A.Jenis Gangguan - Palang': string;
  'B.Jenis Gangguan Reader / Periferal': string;
  'C. Jenis Gangguan - Sistim': string;
  'D. Jenis Gangguan - Kelistrikan': string;
  'Lokasi Kejadian': string;
  'PETUGAS KSPT': string;
  'PETUGAS PULTOL': string;
  [key: string]: string | number;
}

interface RecapitulationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: KejadianData[];
}

const MONTHS = [
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

const SHIFTS = [
  { key: 'I', label: 'I (Satu)', color: 'bg-amber-50 border-amber-200', textColor: 'text-amber-700' },
  { key: 'II', label: 'II (Dua)', color: 'bg-sky-50 border-sky-200', textColor: 'text-sky-700' },
  { key: 'III', label: 'III (Tiga)', color: 'bg-slate-800 border-slate-700', textColor: 'text-white' },
];

export default function RecapitulationDialog({ open, onOpenChange, data }: RecapitulationDialogProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth.toString());
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedYearlyYear, setSelectedYearlyYear] = useState<string>(currentYear.toString());

  // Generate years from data
  const years = useMemo(() => {
    const yearSet = new Set<number>();
    data.forEach(item => {
      if (item['Tanggal Kejadian']) {
        const date = new Date(item['Tanggal Kejadian']);
        if (!isNaN(date.getTime())) {
          yearSet.add(date.getFullYear());
        }
      }
    });
    yearSet.add(currentYear);
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [data, currentYear]);

  // Filter data by month and year
  const monthlyData = useMemo(() => {
    return data.filter(item => {
      if (!item['Tanggal Kejadian']) return false;
      const date = new Date(item['Tanggal Kejadian']);
      if (isNaN(date.getTime())) return false;
      return (
        date.getMonth() + 1 === parseInt(selectedMonth) &&
        date.getFullYear() === parseInt(selectedYear)
      );
    });
  }, [data, selectedMonth, selectedYear]);

  // Filter data by year
  const yearlyData = useMemo(() => {
    return data.filter(item => {
      if (!item['Tanggal Kejadian']) return false;
      const date = new Date(item['Tanggal Kejadian']);
      if (isNaN(date.getTime())) return false;
      return date.getFullYear() === parseInt(selectedYearlyYear);
    });
  }, [data, selectedYearlyYear]);

  // Calculate statistics
  const calculateStats = (filteredData: KejadianData[]) => {
    const total = filteredData.length;
    const selesai = filteredData.filter(d => d['Status Tindakan']?.toLowerCase() === 'selesai').length;
    const proses = filteredData.filter(d => 
      d['Status Tindakan']?.toLowerCase() === 'proses' || 
      d['Status Tindakan']?.toLowerCase() === 'dalam proses'
    ).length;
    const pending = filteredData.filter(d => 
      d['Status Tindakan']?.toLowerCase() === 'pending' || !d['Status Tindakan']
    ).length;

    // By gangguan type
    const gangguanPalang = filteredData.filter(d => d['A.Jenis Gangguan - Palang'] && d['A.Jenis Gangguan - Palang'] !== '-').length;
    const gangguanReader = filteredData.filter(d => d['B.Jenis Gangguan Reader / Periferal'] && d['B.Jenis Gangguan Reader / Periferal'] !== '-').length;
    const gangguanSistem = filteredData.filter(d => d['C. Jenis Gangguan - Sistim'] && d['C. Jenis Gangguan - Sistim'] !== '-').length;
    const gangguanListrik = filteredData.filter(d => d['D. Jenis Gangguan - Kelistrikan'] && d['D. Jenis Gangguan - Kelistrikan'] !== '-').length;

    // By shift - I, II, III
    const shiftI = filteredData.filter(d => {
      const shift = d['Shift Kejadian']?.toLowerCase() || '';
      return shift.includes('i (') || shift.includes('i(') || shift === 'i' || shift.includes('satu');
    }).length;
    const shiftII = filteredData.filter(d => {
      const shift = d['Shift Kejadian']?.toLowerCase() || '';
      return shift.includes('ii (') || shift.includes('ii(') || shift === 'ii' || shift.includes('dua');
    }).length;
    const shiftIII = filteredData.filter(d => {
      const shift = d['Shift Kejadian']?.toLowerCase() || '';
      return shift.includes('iii (') || shift.includes('iii(') || shift === 'iii' || shift.includes('tiga');
    }).length;

    // By gardu
    const garduStats: Record<string, number> = {};
    filteredData.forEach(d => {
      const gardu = d['Gardu Kejadian'] || 'Tidak Diketahui';
      if (gardu && gardu !== '-') {
        garduStats[gardu] = (garduStats[gardu] || 0) + 1;
      }
    });

    // By lokasi
    const lokasiStats: Record<string, number> = {};
    filteredData.forEach(d => {
      const lokasi = d['Lokasi Kejadian'] || 'Tidak Diketahui';
      if (lokasi && lokasi !== '-') {
        lokasiStats[lokasi] = (lokasiStats[lokasi] || 0) + 1;
      }
    });

    // By Petugas KSPT
    const ksptStats: Record<string, number> = {};
    filteredData.forEach(d => {
      const kspt = d['PETUGAS KSPT'] || 'Tidak Diketahui';
      if (kspt && kspt !== '-') {
        ksptStats[kspt] = (ksptStats[kspt] || 0) + 1;
      }
    });

    // By Petugas PulTol
    const pultolStats: Record<string, number> = {};
    filteredData.forEach(d => {
      const pultol = d['PETUGAS PULTOL'] || 'Tidak Diketahui';
      if (pultol && pultol !== '-') {
        pultolStats[pultol] = (pultolStats[pultol] || 0) + 1;
      }
    });

    return {
      total,
      selesai,
      proses,
      pending,
      gangguanPalang,
      gangguanReader,
      gangguanSistem,
      gangguanListrik,
      shiftI,
      shiftII,
      shiftIII,
      garduStats,
      lokasiStats,
      ksptStats,
      pultolStats,
      completionRate: total > 0 ? Math.round((selesai / total) * 100) : 0,
    };
  };

  const monthlyStats = useMemo(() => calculateStats(monthlyData), [monthlyData]);
  const yearlyStats = useMemo(() => calculateStats(yearlyData), [yearlyData]);

  // Monthly breakdown for yearly view
  const monthlyBreakdown = useMemo(() => {
    const breakdown: { month: string; total: number; selesai: number }[] = [];
    for (let m = 1; m <= 12; m++) {
      const monthData = yearlyData.filter(item => {
        if (!item['Tanggal Kejadian']) return false;
        const date = new Date(item['Tanggal Kejadian']);
        if (isNaN(date.getTime())) return false;
        return date.getMonth() + 1 === m;
      });
      breakdown.push({
        month: MONTHS[m - 1].label,
        total: monthData.length,
        selesai: monthData.filter(d => d['Status Tindakan']?.toLowerCase() === 'selesai').length,
      });
    }
    return breakdown;
  }, [yearlyData]);

  // Export to CSV
  const exportToCSV = (filteredData: KejadianData[], filename: string) => {
    if (filteredData.length === 0) {
      alert('Tidak ada data untuk diekspor');
      return;
    }

    const headers = [
      'No', 'Tanggal', 'Waktu', 'Shift', 'Gardu', 'Lokasi', 'Petugas KSPT', 'Petugas PulTol', 'Status',
      'G. Palang', 'G. Reader', 'G. Sistem', 'G. Listrik'
    ];

    const rows = filteredData.map((item, index) => [
      index + 1,
      item['Tanggal Kejadian'] || '',
      item['Waktu Kejadian'] || '',
      item['Shift Kejadian'] || '',
      item['Gardu Kejadian'] || '',
      item['Lokasi Kejadian'] || '',
      item['PETUGAS KSPT'] || '',
      item['PETUGAS PULTOL'] || '',
      item['Status Tindakan'] || '',
      item['A.Jenis Gangguan - Palang'] || '',
      item['B.Jenis Gangguan Reader / Periferal'] || '',
      item['C. Jenis Gangguan - Sistim'] || '',
      item['D. Jenis Gangguan - Kelistrikan'] || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: {
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
    subtitle?: string;
  }) => (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
          <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-').replace('600', '100')}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ProgressBar = ({ label, value, max, color }: {
    label: string;
    value: number;
    max: number;
    color: string;
  }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <Progress value={max > 0 ? (value / max) * 100 : 0} className={`h-2 ${color}`} />
    </div>
  );

  const StatsTable = ({ title, stats, icon: Icon }: {
    title: string;
    stats: Record<string, number>;
    icon: React.ElementType;
  }) => (
    <Card className="bg-white border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <Icon className="h-4 w-4 text-sky-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {Object.keys(stats).length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Object.entries(stats)
              .sort(([, a], [, b]) => b - a)
              .map(([key, count]) => (
                <div key={key} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-600 truncate flex-1">{key}</span>
                  <Badge variant="outline" className="border-sky-200 text-sky-700 ml-2">
                    {count}
                  </Badge>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-4">Tidak ada data</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-slate-800 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-sky-500" />
            Rekapitulasi Kejadian
          </DialogTitle>
          <DialogDescription>
            Ringkasan data kejadian berdasarkan periode waktu
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100">
            <TabsTrigger value="monthly" className="data-[state=active]:bg-white">
              <Calendar className="h-4 w-4 mr-2" />
              Bulanan
            </TabsTrigger>
            <TabsTrigger value="yearly" className="data-[state=active]:bg-white">
              <TrendingUp className="h-4 w-4 mr-2" />
              Tahunan
            </TabsTrigger>
          </TabsList>

          {/* Monthly Tab */}
          <TabsContent value="monthly" className="space-y-4 mt-4">
            {/* Filter */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Periode:</span>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(monthlyData, `Rekap_${MONTHS[parseInt(selectedMonth) - 1].label}_${selectedYear}`)}
                className="ml-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {/* Monthly Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard title="Total Kejadian" value={monthlyStats.total} icon={Activity} color="text-sky-600" />
              <StatCard title="Selesai" value={monthlyStats.selesai} icon={CheckCircle2} color="text-emerald-600" />
              <StatCard title="Dalam Proses" value={monthlyStats.proses} icon={Clock} color="text-amber-600" />
              <StatCard title="Pending" value={monthlyStats.pending} icon={AlertTriangle} color="text-red-600" />
            </div>

            {/* Completion Rate */}
            <Card className="bg-gradient-to-r from-sky-50 to-emerald-50 border-sky-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Tingkat Penyelesaian</span>
                  <span className="text-2xl font-bold text-emerald-600">{monthlyStats.completionRate}%</span>
                </div>
                <Progress value={monthlyStats.completionRate} className="h-3 bg-sky-100" />
              </CardContent>
            </Card>

            {/* Shift Distribution - I, II, III */}
            <Card className="bg-white border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Berdasarkan Shift</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className={`text-center p-4 rounded-lg border ${SHIFTS[0].color}`}>
                    <p className={`text-xs ${SHIFTS[0].textColor.replace('text-', 'text-').replace('-700', '-600')}`}>Shift {SHIFTS[0].label}</p>
                    <p className={`text-2xl font-bold ${SHIFTS[0].textColor}`}>{monthlyStats.shiftI}</p>
                  </div>
                  <div className={`text-center p-4 rounded-lg border ${SHIFTS[1].color}`}>
                    <p className={`text-xs ${SHIFTS[1].textColor.replace('text-', 'text-').replace('-700', '-600')}`}>Shift {SHIFTS[1].label}</p>
                    <p className={`text-2xl font-bold ${SHIFTS[1].textColor}`}>{monthlyStats.shiftII}</p>
                  </div>
                  <div className={`text-center p-4 rounded-lg border ${SHIFTS[2].color}`}>
                    <p className="text-xs text-slate-300">Shift {SHIFTS[2].label}</p>
                    <p className="text-2xl font-bold text-white">{monthlyStats.shiftIII}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gangguan Types */}
            <Card className="bg-white border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Berdasarkan Jenis Gangguan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ProgressBar label="Gangguan Palang" value={monthlyStats.gangguanPalang} max={monthlyStats.total} color="bg-sky-500" />
                <ProgressBar label="Gangguan Reader/Periferal" value={monthlyStats.gangguanReader} max={monthlyStats.total} color="bg-emerald-500" />
                <ProgressBar label="Gangguan Sistem" value={monthlyStats.gangguanSistem} max={monthlyStats.total} color="bg-amber-500" />
                <ProgressBar label="Gangguan Kelistrikan" value={monthlyStats.gangguanListrik} max={monthlyStats.total} color="bg-red-500" />
              </CardContent>
            </Card>

            {/* Location, Gardu, KSPT, PulTol Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatsTable title="Berdasarkan Lokasi Kejadian" stats={monthlyStats.lokasiStats} icon={MapPin} />
              <StatsTable title="Berdasarkan Gardu Kejadian" stats={monthlyStats.garduStats} icon={Building2} />
              <StatsTable title="Berdasarkan Petugas KSPT" stats={monthlyStats.ksptStats} icon={Users} />
              <StatsTable title="Berdasarkan Petugas PulTol" stats={monthlyStats.pultolStats} icon={Users} />
            </div>
          </TabsContent>

          {/* Yearly Tab */}
          <TabsContent value="yearly" className="space-y-4 mt-4">
            {/* Filter */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Tahun:</span>
                <Select value={selectedYearlyYear} onValueChange={setSelectedYearlyYear}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(yearlyData, `Rekap_Tahunan_${selectedYearlyYear}`)}
                className="ml-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {/* Yearly Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard title="Total Kejadian" value={yearlyStats.total} icon={Activity} color="text-sky-600" subtitle={`Tahun ${selectedYearlyYear}`} />
              <StatCard title="Selesai" value={yearlyStats.selesai} icon={CheckCircle2} color="text-emerald-600" />
              <StatCard title="Dalam Proses" value={yearlyStats.proses} icon={Clock} color="text-amber-600" />
              <StatCard title="Pending" value={yearlyStats.pending} icon={AlertTriangle} color="text-red-600" />
            </div>

            {/* Yearly Completion Rate */}
            <Card className="bg-gradient-to-r from-sky-50 to-emerald-50 border-sky-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Tingkat Penyelesaian Tahunan</span>
                  <span className="text-2xl font-bold text-emerald-600">{yearlyStats.completionRate}%</span>
                </div>
                <Progress value={yearlyStats.completionRate} className="h-3 bg-sky-100" />
              </CardContent>
            </Card>

            {/* Shift Distribution - I, II, III */}
            <Card className="bg-white border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Berdasarkan Shift</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className={`text-center p-4 rounded-lg border ${SHIFTS[0].color}`}>
                    <p className={`text-xs ${SHIFTS[0].textColor.replace('text-', 'text-').replace('-700', '-600')}`}>Shift {SHIFTS[0].label}</p>
                    <p className={`text-2xl font-bold ${SHIFTS[0].textColor}`}>{yearlyStats.shiftI}</p>
                  </div>
                  <div className={`text-center p-4 rounded-lg border ${SHIFTS[1].color}`}>
                    <p className={`text-xs ${SHIFTS[1].textColor.replace('text-', 'text-').replace('-700', '-600')}`}>Shift {SHIFTS[1].label}</p>
                    <p className={`text-2xl font-bold ${SHIFTS[1].textColor}`}>{yearlyStats.shiftII}</p>
                  </div>
                  <div className={`text-center p-4 rounded-lg border ${SHIFTS[2].color}`}>
                    <p className="text-xs text-slate-300">Shift {SHIFTS[2].label}</p>
                    <p className="text-2xl font-bold text-white">{yearlyStats.shiftIII}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Breakdown Chart */}
            <Card className="bg-white border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Kejadian per Bulan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {monthlyBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="w-20 text-xs text-slate-600">{item.month}</span>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${yearlyStats.total > 0 ? (item.total / yearlyStats.total) * 100 : 0}%` }}
                            transition={{ delay: index * 0.05 }}
                            className="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full"
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-700 w-8">{item.total}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Gangguan Types Yearly */}
            <Card className="bg-white border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Berdasarkan Jenis Gangguan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ProgressBar label="Gangguan Palang" value={yearlyStats.gangguanPalang} max={yearlyStats.total} color="bg-sky-500" />
                <ProgressBar label="Gangguan Reader/Periferal" value={yearlyStats.gangguanReader} max={yearlyStats.total} color="bg-emerald-500" />
                <ProgressBar label="Gangguan Sistem" value={yearlyStats.gangguanSistem} max={yearlyStats.total} color="bg-amber-500" />
                <ProgressBar label="Gangguan Kelistrikan" value={yearlyStats.gangguanListrik} max={yearlyStats.total} color="bg-red-500" />
              </CardContent>
            </Card>

            {/* Location, Gardu, KSPT, PulTol Stats Yearly */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatsTable title="Berdasarkan Lokasi Kejadian" stats={yearlyStats.lokasiStats} icon={MapPin} />
              <StatsTable title="Berdasarkan Gardu Kejadian" stats={yearlyStats.garduStats} icon={Building2} />
              <StatsTable title="Berdasarkan Petugas KSPT" stats={yearlyStats.ksptStats} icon={Users} />
              <StatsTable title="Berdasarkan Petugas PulTol" stats={yearlyStats.pultolStats} icon={Users} />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
