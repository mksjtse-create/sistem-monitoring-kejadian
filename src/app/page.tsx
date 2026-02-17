'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Activity,
  Shield,
  Settings,
  Trash2,
  Edit,
  Eye,
  Car,
  Wrench,
  Zap,
  Monitor,
  Building2,
  Timer,
  UserCheck,
  Menu,
  X,
  Upload,
  Image as ImageIcon,
  LogOut,
  User,
  BarChart3,
  FileText,
  Download,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import LoginPage from '@/components/LoginPage';
import RecapitulationDialog from '@/components/RecapitulationDialog';

// Types
interface KejadianData {
  id: number;
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

type DropdownOptions = Record<string, string[]>;

// Column definitions
const COLUMNS = [
  { key: 'id', label: 'No', width: '50px' },
  { key: 'Tanggal Kejadian', label: 'Tanggal', width: '120px' },
  { key: 'Waktu Kejadian', label: 'Waktu', width: '100px' },
  { key: 'Shift Kejadian', label: 'Shift', width: '80px' },
  { key: 'Gardu Kejadian', label: 'Gardu', width: '100px' },
  { key: 'Waktu Mengirformasikan', label: 'Waktu Info', width: '120px' },
  { key: 'Waktu Penanganan', label: 'Waktu Tangani', width: '120px' },
  { key: 'PETUGAS KSPT', label: 'KSPT', width: '100px' },
  { key: 'PETUGAS PULTOL', label: 'PulTol', width: '100px' },
  { key: 'Petugas Security', label: 'Security', width: '100px' },
  { key: 'PETUGAS IT', label: 'IT', width: '100px' },
  { key: 'PETUGAS TEKNISI', label: 'Teknisi', width: '100px' },
  { key: 'Lokasi Kejadian', label: 'Lokasi', width: '150px' },
  { key: 'Kronologi Kejadian', label: 'Kronologi', width: '200px' },
  { key: 'Antrian Kendaraan', label: 'Antrian', width: '80px' },
  { key: 'Keluhan Pengguna Jalan', label: 'Keluhan', width: '150px' },
  { key: 'Tindakan KSPT', label: 'Tindakan KSPT', width: '150px' },
  { key: 'Tindakan IT', label: 'Tindakan IT', width: '150px' },
  { key: 'Tindakan Teknisi', label: 'Tindakan Teknisi', width: '150px' },
  { key: 'Tindakan PulTol', label: 'Tindakan PulTol', width: '150px' },
  { key: 'Tindakan Security', label: 'Tindakan Security', width: '150px' },
  { key: 'A.Jenis Gangguan - Palang', label: 'G. Palang', width: '120px' },
  { key: 'B.Jenis Gangguan Reader / Periferal', label: 'G. Reader', width: '120px' },
  { key: 'C. Jenis Gangguan - Sistim', label: 'G. Sistem', width: '120px' },
  { key: 'D. Jenis Gangguan - Kelistrikan', label: 'G. Listrik', width: '120px' },
  { key: 'Status Tindakan', label: 'Status', width: '100px' },
  { key: 'Jumlah Alarm', label: 'Alarm', width: '80px' },
  { key: 'Jumlah Reset', label: 'Reset', width: '80px' },
  { key: 'Foto Sebelum', label: 'Foto Sebelum', width: '100px' },
  { key: 'Foto Sesudah', label: 'Foto Sesudah', width: '100px' },
];

// Form fields configuration
const FORM_FIELDS = [
  { key: 'Tanggal Kejadian', label: 'Tanggal Kejadian', type: 'date', required: true },
  { key: 'Waktu Kejadian', label: 'Waktu Kejadian', type: 'time', required: true },
  { key: 'Shift Kejadian', label: 'Shift Kejadian', type: 'select', required: true },
  { key: 'Gardu Kejadian', label: 'Gardu Kejadian', type: 'select', required: true },
  { key: 'Waktu Mengirformasikan', label: 'Waktu Mengirformasikan', type: 'time' },
  { key: 'Waktu Penanganan', label: 'Waktu Penanganan', type: 'time' },
  { key: 'PETUGAS KSPT', label: 'Petugas KSPT', type: 'select' },
  { key: 'PETUGAS PULTOL', label: 'Petugas PulTol', type: 'select' },
  { key: 'Petugas Security', label: 'Petugas Security', type: 'select' },
  { key: 'PETUGAS IT', label: 'Petugas IT', type: 'select' },
  { key: 'PETUGAS TEKNISI', label: 'Petugas Teknisi', type: 'select' },
  { key: 'Lokasi Kejadian', label: 'Lokasi Kejadian', type: 'select' },
  { key: 'Kronologi Kejadian', label: 'Kronologi Kejadian', type: 'textarea' },
  { key: 'Antrian Kendaraan', label: 'Antrian Kendaraan', type: 'number' },
  { key: 'Keluhan Pengguna Jalan', label: 'Keluhan Pengguna Jalan', type: 'textarea' },
  { key: 'Tindakan KSPT', label: 'Tindakan KSPT', type: 'textarea' },
  { key: 'Tindakan IT', label: 'Tindakan IT', type: 'textarea' },
  { key: 'Tindakan Teknisi', label: 'Tindakan Teknisi', type: 'textarea' },
  { key: 'Tindakan PulTol', label: 'Tindakan PulTol', type: 'textarea' },
  { key: 'Tindakan Security', label: 'Tindakan Security', type: 'textarea' },
  { key: 'A.Jenis Gangguan - Palang', label: 'Jenis Gangguan - Palang', type: 'select' },
  { key: 'B.Jenis Gangguan Reader / Periferal', label: 'Jenis Gangguan Reader/Periferal', type: 'select' },
  { key: 'C. Jenis Gangguan - Sistim', label: 'Jenis Gangguan - Sistem', type: 'select' },
  { key: 'D. Jenis Gangguan - Kelistrikan', label: 'Jenis Gangguan - Kelistrikan', type: 'select' },
  { key: 'Status Tindakan', label: 'Status Tindakan', type: 'select', required: true },
  { key: 'Jumlah Alarm', label: 'Jumlah Alarm', type: 'number' },
  { key: 'Jumlah Reset', label: 'Jumlah Reset', type: 'number' },
  { key: 'Foto Sebelum', label: 'Foto Sebelum', type: 'photo' },
  { key: 'Foto Sesudah', label: 'Foto Sesudah', type: 'photo' },
];

export default function Dashboard() {
  const { user, isAuthenticated, logout, isLoading: authLoading } = useAuth();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<KejadianData[]>([]);
  const [dropdowns, setDropdowns] = useState<DropdownOptions>({});
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoMessage, setDemoMessage] = useState('');
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<KejadianData | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Photo preview states
  const [photoPreview, setPhotoPreview] = useState<Record<string, string>>({});
  
  // Recapitulation dialog state
  const [isRecapOpen, setIsRecapOpen] = useState(false);
  
  // Sheet gid for direct navigation
  const [sheetGid, setSheetGid] = useState<number | null>(null);

  // Set mounted and initial time on client
  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
  }, []);

  // Update time every second
  useEffect(() => {
    if (!mounted) return;
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [mounted]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dataRes, dropdownsRes] = await Promise.all([
        fetch('/api/sheets'),
        fetch('/api/sheets?type=dropdowns'),
      ]);
      
      const dataJson = await dataRes.json();
      const dropdownsJson = await dropdownsRes.json();
      
      if (dataJson.success) {
        setData(dataJson.data);
        setIsDemoMode(dataJson.isDemo || false);
        setDemoMessage(dataJson.message || '');
        if (dataJson.sheetGid !== undefined) {
          setSheetGid(dataJson.sheetGid);
        }
      }
      if (dropdownsJson.success) {
        setDropdowns(dropdownsJson.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengambil data dari spreadsheet',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [fetchData, isAuthenticated]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-white to-emerald-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Calculate statistics
  const stats = {
    total: data.length,
    selesai: data.filter(d => d['Status Tindakan']?.toLowerCase() === 'selesai').length,
    proses: data.filter(d => d['Status Tindakan']?.toLowerCase() === 'proses' || d['Status Tindakan']?.toLowerCase() === 'dalam proses').length,
    pending: data.filter(d => d['Status Tindakan']?.toLowerCase() === 'pending' || !d['Status Tindakan']).length,
  };

  // Upload photo to server and return URL
  const uploadPhoto = async (base64Data: string): Promise<string> => {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Data }),
    });
    const json = await res.json();
    if (json.success) {
      return json.url;
    }
    throw new Error('Failed to upload photo');
  };

  // Generate PDF report
  const generatePDF = async (kejadianData: Record<string, string>): Promise<string | null> => {
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kejadianData),
      });
      const json = await res.json();
      if (json.success) {
        return json.url;
      }
      return null;
    } catch (error) {
      console.error('Error generating PDF:', error);
      return null;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isDemoMode) {
      toast({
        title: 'Mode Demo',
        description: 'Untuk menyimpan data, silakan konfigurasi Google Sheets API terlebih dahulu.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Upload photos first if they are base64
      const dataToSubmit = { ...formData };
      
      for (const field of ['Foto Sebelum', 'Foto Sesudah']) {
        const value = dataToSubmit[field];
        if (value && value.startsWith('data:image')) {
          // Show loading toast
          toast({
            title: 'Mengupload foto...',
            description: `Sedang mengupload ${field}`,
          });
          
          const url = await uploadPhoto(value);
          dataToSubmit[field] = url;
        }
      }
      
      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit),
      });
      
      const json = await res.json();
      if (json.success) {
        // Generate PDF automatically
        toast({
          title: 'Menyimpan data...',
          description: 'Data berhasil disimpan, sedang membuat laporan PDF',
        });
        
        const pdfUrl = await generatePDF(dataToSubmit);
        
        if (pdfUrl) {
          toast({
            title: 'Berhasil',
            description: 'Data berhasil ditambahkan dan laporan PDF telah dibuat',
          });
          // Open PDF in new tab
          window.open(pdfUrl, '_blank');
        } else {
          toast({
            title: 'Berhasil',
            description: 'Data berhasil ditambahkan (PDF gagal dibuat)',
          });
        }
        
        setIsAddFormOpen(false);
        setFormData({});
        setPhotoPreview({});
        fetchData();
      } else {
        throw new Error(json.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menambahkan data',
        variant: 'destructive',
      });
    }
  };

  // Handle edit
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    
    try {
      // Upload photos first if they are base64
      const dataToSubmit = { ...formData };
      
      for (const field of ['Foto Sebelum', 'Foto Sesudah']) {
        const value = dataToSubmit[field];
        if (value && value.startsWith('data:image')) {
          // Show loading toast
          toast({
            title: 'Mengupload foto...',
            description: `Sedang mengupload ${field}`,
          });
          
          const url = await uploadPhoto(value);
          dataToSubmit[field] = url;
        }
      }
      
      const res = await fetch(`/api/sheets/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit),
      });
      
      const json = await res.json();
      if (json.success) {
        toast({
          title: 'Berhasil',
          description: 'Data berhasil diperbarui',
        });
        setIsEditFormOpen(false);
        setSelectedItem(null);
        setFormData({});
        setPhotoPreview({});
        fetchData();
      } else {
        throw new Error(json.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memperbarui data',
        variant: 'destructive',
      });
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    
    try {
      const res = await fetch(`/api/sheets/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast({
          title: 'Berhasil',
          description: 'Data berhasil dihapus',
        });
        fetchData();
      } else {
        throw new Error(json.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menghapus data',
        variant: 'destructive',
      });
    }
  };

  // Render form field
  const renderFormField = (field: typeof FORM_FIELDS[0]) => {
    // Try multiple ways to find dropdown options
    const findOptions = (): string[] => {
      // Debug: log available dropdown keys
      const availableKeys = Object.keys(dropdowns);
      
      // 1. Try exact field key
      if (dropdowns[field.key]?.length) return dropdowns[field.key];
      
      // 2. Try uppercase version
      const upperKey = field.key.toUpperCase();
      if (dropdowns[upperKey]?.length) return dropdowns[upperKey];
      
      // 3. Try normalized key (remove prefixes A., B., C., D.)
      const normalizedKey = field.key.replace(/^[A-D]\.\s*/i, '');
      if (dropdowns[normalizedKey]?.length) return dropdowns[normalizedKey];
      
      // 4. Special mapping for Jenis Gangguan fields
      const gangguanMapping: Record<string, string[]> = {
        'A.Jenis Gangguan - Palang': ['Jenis Gangguan Palang', 'JENIS GANGGUAN PALANG', 'Gangguan Palang', 'GANGGUAN PALANG'],
        'B.Jenis Gangguan Reader / Periferal': ['Jenis Gangguan Reader / Periferal', 'JENIS GANGGUAN READER', 'Gangguan Reader'],
        'C. Jenis Gangguan - Sistim': ['Jenis Gangguan - Sistim', 'JENIS GANGGUAN - SISTIM', 'Gangguan Sistem', 'Gangguan Sistim'],
        'D. Jenis Gangguan - Kelistrikan': ['Gangguan Kelistrikan', 'GANGGUAN KELISTRIKAN', 'Jenis Gangguan - Kelistrikan'],
      };
      
      if (gangguanMapping[field.key]) {
        for (const keyword of gangguanMapping[field.key]) {
          for (const key of availableKeys) {
            if (key.toUpperCase() === keyword.toUpperCase() || 
                key.toUpperCase().includes(keyword.toUpperCase())) {
              return dropdowns[key];
            }
          }
        }
      }
      
      // 5. Try case-insensitive match with all keys
      const lowerFieldKey = field.key.toLowerCase();
      for (const key of availableKeys) {
        if (key.toLowerCase() === lowerFieldKey) {
          return dropdowns[key];
        }
      }
      
      // 6. Try partial match - check if key contains "KSPT", "PULTOL", "IT", "TEKNISI", "SECURITY"
      const petugasKeywords: Record<string, string[]> = {
        'PETUGAS KSPT': ['KSPT'],
        'PETUGAS PULTOL': ['PULTOL', 'NAMA PULTOL'],
        'PETUGAS IT': ['NAMA IT'],
        'PETUGAS TEKNISI': ['NAMA TEKNISI', 'TEKNISI'],
        'Petugas Security': ['SECURITY'],
      };
      
      const keywords = petugasKeywords[field.key];
      if (keywords) {
        for (const keyword of keywords) {
          for (const key of availableKeys) {
            if (key.toUpperCase().includes(keyword.toUpperCase())) {
              return dropdowns[key];
            }
          }
        }
      }
      
      // 7. Try general partial match
      for (const key of availableKeys) {
        if (key.toLowerCase().includes(lowerFieldKey) || lowerFieldKey.includes(key.toLowerCase())) {
          return dropdowns[key];
        }
      }
      
      return [];
    };
    
    const options = field.type === 'select' ? findOptions() : [];

    switch (field.type) {
      case 'select':
        return (
          <Select
            value={formData[field.key] || ''}
            onValueChange={(value) => setFormData({ ...formData, [field.key]: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={options.length > 0 ? `Pilih ${field.label}` : `Tidak ada opsi ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'textarea':
        return (
          <Textarea
            value={formData[field.key] || ''}
            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
            placeholder={`Masukkan ${field.label}`}
            rows={3}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={formData[field.key] || ''}
            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
          />
        );
      case 'time':
        return (
          <Input
            type="time"
            value={formData[field.key] || ''}
            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={formData[field.key] || ''}
            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
            placeholder={`Masukkan ${field.label}`}
          />
        );
      case 'url':
        return (
          <Input
            type="url"
            value={formData[field.key] || ''}
            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
            placeholder={`Masukkan URL ${field.label}`}
          />
        );
      case 'photo':
        const handleFileUpload = (fieldKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              setFormData({ ...formData, [fieldKey]: dataUrl });
              setPhotoPreview({ ...photoPreview, [fieldKey]: dataUrl });
            };
            reader.readAsDataURL(file);
          }
        };

        const currentPreview = photoPreview[field.key] || formData[field.key];

        return (
          <div className="space-y-3">
            {/* Preview */}
            {currentPreview && (
              <div className="relative">
                <img 
                  src={currentPreview} 
                  alt={field.label}
                  className="w-full h-32 object-cover rounded-lg border border-sky-200"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                  onClick={() => {
                    setFormData({ ...formData, [field.key]: '' });
                    setPhotoPreview({ ...photoPreview, [field.key]: '' });
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            {/* Upload Button */}
            <label className="block">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(field.key, e)}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                asChild
              >
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {field.label}
                </span>
              </Button>
            </label>
          </div>
        );
      default:
        return (
          <Input
            type="text"
            value={formData[field.key] || ''}
            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
            placeholder={`Masukkan ${field.label}`}
          />
        );
    }
  };

  // Status badge color
  const getStatusBadge = (status: string) => {
    const lowerStatus = status?.toLowerCase() || '';
    if (lowerStatus === 'selesai') {
      return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Selesai</Badge>;
    } else if (lowerStatus === 'proses' || lowerStatus === 'dalam proses') {
      return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Proses</Badge>;
    } else if (lowerStatus === 'pending') {
      return <Badge className="bg-red-500 hover:bg-red-600 text-white">Pending</Badge>;
    }
    return <Badge variant="outline" className="border-slate-300">{status || '-'}</Badge>;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-sky-100 via-white to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-sky-200 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/logo-company.jpg" 
                alt="Logo PT Makassar Metro Network" 
                className="h-10 w-auto object-contain"
              />
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold text-slate-800 leading-tight">PT. MAKASSAR METRO NETWORK</h1>
                <p className="text-xs text-slate-600 leading-tight">Unit Operasional Pengumpulan Tol</p>
                <p className="text-xs font-medium text-sky-600 leading-tight">Sistem Monitoring Kejadian</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 border border-sky-200">
                      <Calendar className="h-4 w-4 text-sky-600" />
                      <span className="text-sm font-medium text-slate-700">
                        {mounted && currentTime ? format(currentTime, 'EEEE, dd MMMM yyyy', { locale: localeId }) : '--:--:--'}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tanggal Hari Ini</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-2 shadow-md">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Clock className="h-4 w-4 text-white" />
                </motion.div>
                <span className="text-lg font-mono font-bold text-white">
                  {mounted && currentTime ? format(currentTime, 'HH:mm:ss') : '--:--:--'}
                </span>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 border border-slate-200">
                <User className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">{user?.name}</span>
                <Badge variant="outline" className="text-xs border-sky-300 text-sky-700">{user?.role}</Badge>
              </div>

              {/* Logout Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={logout}
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Keluar</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-slate-700"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden pb-4 space-y-3"
            >
              {/* Company Branding Mobile */}
              <div className="flex items-center gap-2">
                <img 
                  src="/logo-company.jpg" 
                  alt="Logo" 
                  className="h-8 w-auto object-contain"
                />
                <div>
                  <p className="text-xs font-bold text-slate-800">PT. MAKASSAR METRO NETWORK</p>
                  <p className="text-xs text-sky-600">Sistem Monitoring Kejadian</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-sky-50 px-3 py-2 border border-sky-200">
                <Calendar className="h-4 w-4 text-sky-600" />
                <span className="text-sm font-medium text-slate-700">
                  {mounted && currentTime ? format(currentTime, 'EEEE, dd MMMM yyyy', { locale: localeId }) : '--:--:--'}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 px-3 py-2 shadow-md">
                <Clock className="h-4 w-4 text-white" />
                <span className="text-lg font-mono font-bold text-white">
                  {mounted && currentTime ? format(currentTime, 'HH:mm:ss') : '--:--:--'}
                </span>
              </div>
              {/* Mobile User Info & Logout */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 border border-slate-200">
                  <User className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">{user?.name}</span>
                  <Badge variant="outline" className="text-xs border-sky-300 text-sky-700">{user?.role}</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Keluar
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </header>

      {/* Demo Mode Banner */}
      {isDemoMode && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-100 to-orange-100 border-b border-amber-300"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Mode Demo Aktif</p>
                  <p className="text-xs text-amber-600">{demoMessage || 'Data yang ditampilkan adalah data contoh'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-400 text-amber-700 hover:bg-amber-200"
                  onClick={() => window.open('https://console.cloud.google.com/', '_blank')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Setup Google Sheets
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white border-sky-200 shadow-md hover:shadow-lg hover:border-sky-400 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Total Kejadian</p>
                    <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-400 to-sky-500 flex items-center justify-center shadow-md">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white border-emerald-200 shadow-md hover:shadow-lg hover:border-emerald-400 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Selesai</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.selesai}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-md">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white border-amber-200 shadow-md hover:shadow-lg hover:border-amber-400 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Dalam Proses</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.proses}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-md">
                    <Timer className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white border-red-200 shadow-md hover:shadow-lg hover:border-red-400 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Pending</p>
                    <p className="text-2xl font-bold text-red-600">{stats.pending}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center shadow-md">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <Card className="bg-white border-sky-200 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Tingkat Penyelesaian</span>
                <span className="text-sm font-bold text-sky-600">
                  {stats.total > 0 ? Math.round((stats.selesai / stats.total) * 100) : 0}%
                </span>
              </div>
              <Progress 
                value={stats.total > 0 ? (stats.selesai / stats.total) * 100 : 0} 
                className="h-3 bg-sky-100"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap gap-3 mb-6"
        >
          <Dialog open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Kejadian
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-sky-200">
              <DialogHeader>
                <DialogTitle className="text-slate-800">Tambah Kejadian Baru</DialogTitle>
                <DialogDescription className="text-slate-600">
                  Isi form berikut untuk menambahkan kejadian baru ke spreadsheet
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {FORM_FIELDS.map((field) => (
                    <div key={field.key} className={field.type === 'textarea' || field.type === 'photo' ? 'md:col-span-2' : ''}>
                      <Label className="text-slate-700 mb-2 block">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {renderFormField(field)}
                    </div>
                  ))}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline" className="border-slate-300 text-slate-700">
                      Batal
                    </Button>
                  </DialogClose>
                  <Button type="submit" className="bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white">
                    Simpan
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            onClick={fetchData}
            disabled={loading}
            className="border-sky-300 text-sky-700 hover:bg-sky-50 hover:text-sky-800"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                  onClick={() => window.open(`https://docs.google.com/spreadsheets/d/1zFcTvgm8yWcKaa6tp-RnkG-TOkGA285s6NzIMaEfTj8/edit#gid=${sheetGid ?? 0}`, '_blank')}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Buka Spreadsheet
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Buka Sheet Input_Kejadian</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
            onClick={() => setIsRecapOpen(true)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Rekapitulasi
          </Button>
        </motion.div>

        {/* Recapitulation Dialog */}
        <RecapitulationDialog
          open={isRecapOpen}
          onOpenChange={setIsRecapOpen}
          data={data}
        />

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="bg-white border-sky-200 shadow-md">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-sky-500" />
                    Data Kejadian
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Daftar kejadian dan gangguan yang tercatat
                  </CardDescription>
                </div>
                <Badge className="bg-sky-100 text-sky-700 border border-sky-200">
                  {data.length} Records
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
                </div>
              ) : data.length === 0 ? (
                <div className="text-center py-12 text-slate-600">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Belum ada data kejadian</p>
                  <p className="text-sm mt-2">Klik tombol "Tambah Kejadian" untuk menambahkan data</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-sky-50">
                      <TableRow className="border-sky-200 hover:bg-sky-50">
                        <TableHead className="text-slate-600 font-semibold w-24">Aksi</TableHead>
                        {COLUMNS.slice(1).map((col) => (
                          <TableHead
                            key={col.key}
                            className="text-slate-600 font-semibold whitespace-nowrap"
                          >
                            {col.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {data.map((row, index) => (
                          <motion.tr
                            key={row.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-sky-100 hover:bg-sky-50"
                          >
                            <TableCell className="py-3">
                              <div className="flex items-center gap-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-slate-600 hover:text-sky-600 hover:bg-sky-100"
                                        onClick={() => {
                                          setSelectedItem(row);
                                          setIsViewOpen(true);
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Lihat Detail</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-slate-600 hover:text-amber-600 hover:bg-amber-50"
                                        onClick={() => {
                                          setSelectedItem(row);
                                          setFormData(row as unknown as Record<string, string>);
                                          setIsEditFormOpen(true);
                                        }}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Edit</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-slate-600 hover:text-purple-600 hover:bg-purple-50"
                                        onClick={async () => {
                                          toast({
                                            title: 'Membuat PDF...',
                                            description: 'Sedang membuat laporan PDF',
                                          });
                                          const pdfUrl = await generatePDF(row as unknown as Record<string, string>);
                                          if (pdfUrl) {
                                            window.open(pdfUrl, '_blank');
                                          } else {
                                            toast({
                                              title: 'Error',
                                              description: 'Gagal membuat PDF',
                                              variant: 'destructive',
                                            });
                                          }
                                        }}
                                      >
                                        <FileText className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Generate PDF</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-slate-600 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleDelete(row.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Hapus</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-700 whitespace-nowrap">
                              {row.id}
                            </TableCell>
                            <TableCell className="text-slate-700 whitespace-nowrap">
                              {row['Tanggal Kejadian'] || '-'}
                            </TableCell>
                            <TableCell className="text-slate-700 whitespace-nowrap">
                              {row['Waktu Kejadian'] || '-'}
                            </TableCell>
                            <TableCell className="text-slate-700 whitespace-nowrap">
                              {row['Shift Kejadian'] || '-'}
                            </TableCell>
                            <TableCell className="text-slate-700 whitespace-nowrap">
                              {row['Gardu Kejadian'] || '-'}
                            </TableCell>
                            <TableCell className="text-slate-700 whitespace-nowrap">
                              {row['Waktu Mengirformasikan'] || '-'}
                            </TableCell>
                            <TableCell className="text-slate-700 whitespace-nowrap">
                              {row['Waktu Penanganan'] || '-'}
                            </TableCell>
                            <TableCell className="text-slate-700 whitespace-nowrap">
                              {row['PETUGAS KSPT'] || '-'}
                            </TableCell>
                            <TableCell className="text-slate-700 whitespace-nowrap">
                              {row['PETUGAS PULTOL'] || '-'}
                            </TableCell>
                            <TableCell className="text-slate-700 whitespace-nowrap">
                              {row['Petugas Security'] || '-'}
                            </TableCell>
                            <TableCell className="text-slate-700 whitespace-nowrap">
                              {row['PETUGAS IT'] || '-'}
                            </TableCell>
                            <TableCell className="text-slate-700 whitespace-nowrap">
                              {row['PETUGAS TEKNISI'] || '-'}
                            </TableCell>
                            <TableCell className="text-slate-700 whitespace-nowrap max-w-[200px] truncate">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger className="truncate">
                                    {row['Lokasi Kejadian'] || '-'}
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{row['Lokasi Kejadian'] || '-'}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell className="text-slate-700 max-w-[200px] truncate">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger className="truncate">
                                    {row['Kronologi Kejadian'] || '-'}
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-[300px]">
                                    <p>{row['Kronologi Kejadian'] || '-'}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell className="text-slate-700 whitespace-nowrap">
                              {row['Antrian Kendaraan'] || '-'}
                            </TableCell>
                            <TableCell className="text-slate-700 max-w-[150px] truncate">
                              {row['Keluhan Pengguna Jalan'] || '-'}
                            </TableCell>
                            <TableCell className="text-slate-700 max-w-[150px] truncate">
                              {row['Tindakan KSPT'] || '-'}
                            </TableCell>
                            <TableCell className="text-slate-700 max-w-[150px] truncate">
                              {row['Tindakan IT'] || '-'}
                            </TableCell>
                            <TableCell className="text-slate-700 max-w-[150px] truncate">
                              {row['Tindakan Teknisi'] || '-'}
                            </TableCell>
                            <TableCell className="text-slate-700 max-w-[150px] truncate">
                              {row['Tindakan PulTol'] || '-'}
                            </TableCell>
                            <TableCell className="text-slate-700 max-w-[150px] truncate">
                              {row['Tindakan Security'] || '-'}
                            </TableCell>
                            <TableCell className="text-slate-700 whitespace-nowrap">
                              {row['A.Jenis Gangguan - Palang'] || '-'}
                            </TableCell>
                            <TableCell className="text-slate-700 whitespace-nowrap">
                              {row['B.Jenis Gangguan Reader / Periferal'] || '-'}
                            </TableCell>
                            <TableCell className="text-slate-700 whitespace-nowrap">
                              {row['C. Jenis Gangguan - Sistim'] || '-'}
                            </TableCell>
                            <TableCell className="text-slate-700 whitespace-nowrap">
                              {row['D. Jenis Gangguan - Kelistrikan'] || '-'}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {getStatusBadge(row['Status Tindakan'])}
                            </TableCell>
                            <TableCell className="text-slate-700 whitespace-nowrap">
                              {row['Jumlah Alarm'] || '-'}
                            </TableCell>
                            <TableCell className="text-slate-700 whitespace-nowrap">
                              {row['Jumlah Reset'] || '-'}
                            </TableCell>
                            <TableCell className="text-slate-700 whitespace-nowrap">
                              {row['Foto Sebelum'] ? (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <img 
                                      src={row['Foto Sebelum']} 
                                      alt="Foto Sebelum"
                                      className="w-16 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity border border-sky-200"
                                    />
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl bg-white">
                                    <DialogHeader>
                                      <DialogTitle className="text-slate-800">Foto Sebelum</DialogTitle>
                                    </DialogHeader>
                                    <img 
                                      src={row['Foto Sebelum']} 
                                      alt="Foto Sebelum"
                                      className="w-full max-h-[70vh] object-contain rounded-lg"
                                    />
                                  </DialogContent>
                                </Dialog>
                              ) : <span className="text-slate-400 text-sm">-</span>}
                            </TableCell>
                            <TableCell className="text-slate-700 whitespace-nowrap">
                              {row['Foto Sesudah'] ? (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <img 
                                      src={row['Foto Sesudah']} 
                                      alt="Foto Sesudah"
                                      className="w-16 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity border border-sky-200"
                                    />
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl bg-white">
                                    <DialogHeader>
                                      <DialogTitle className="text-slate-800">Foto Sesudah</DialogTitle>
                                    </DialogHeader>
                                    <img 
                                      src={row['Foto Sesudah']} 
                                      alt="Foto Sesudah"
                                      className="w-full max-h-[70vh] object-contain rounded-lg"
                                    />
                                  </DialogContent>
                                </Dialog>
                              ) : <span className="text-slate-400 text-sm">-</span>}
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* View Detail Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white border-sky-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800 flex items-center gap-2">
              <Eye className="h-5 w-5 text-sky-500" />
              Detail Kejadian
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {COLUMNS.slice(1).map((col) => (
                  <div 
                    key={col.key} 
                    className={col.key === 'Foto Sebelum' || col.key === 'Foto Sesudah' ? 'md:col-span-2' : ''}
                  >
                    <Label className="text-slate-500 text-xs">{col.label}</Label>
                    {(col.key === 'Foto Sebelum' || col.key === 'Foto Sesudah') ? (
                      <div className="mt-1">
                        {selectedItem[col.key as keyof KejadianData] ? (
                          <img 
                            src={selectedItem[col.key as keyof KejadianData] as string}
                            alt={col.label}
                            className="w-full max-h-64 object-contain rounded-lg border border-sky-100 bg-sky-50"
                          />
                        ) : (
                          <p className="text-slate-400 text-sm italic">Tidak ada foto</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-700 bg-sky-50 rounded-lg px-3 py-2 border border-sky-100">
                        {selectedItem[col.key as keyof KejadianData] || '-'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100">
                Tutup
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-sky-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800">Edit Kejadian</DialogTitle>
            <DialogDescription className="text-slate-500">
              Perbarui data kejadian
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FORM_FIELDS.map((field) => (
                <div key={field.key} className={field.type === 'textarea' || field.type === 'photo' ? 'md:col-span-2' : ''}>
                  <Label className="text-slate-700 mb-2 block">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {renderFormField(field)}
                </div>
              ))}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100">
                  Batal
                </Button>
              </DialogClose>
              <Button type="submit" className="bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white">
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="mt-auto border-t border-sky-200 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-sm text-slate-600">
              © 2024 Sistem Monitoring Kejadian & Gangguan
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500">
                Last Update: {mounted && currentTime ? format(currentTime, 'HH:mm:ss') : '--:--:--'}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
