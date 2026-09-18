import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  UserPlus,
  Bus,
  Trash2,
  Edit,
  QrCode,
  Search,
  Filter,
  RefreshCw,
  Plus,
  CheckCircle2,
  X,
  Phone,
  User,
  MapPin,
  Calendar,
  FileSpreadsheet,
  Layers,
  Database,
  Shield,
  Clock,
  Car as CarIcon,
  AlertTriangle,
} from 'lucide-react';
import { Student, ScanRecord, Car, AdminTab } from '../types';
import { GoogleSheetsPanel } from './GoogleSheetsPanel';
import { SupabasePanel } from './SupabasePanel';
import { isSupabaseConnected } from '../services/supabaseClient';

interface AdminDashboardProps {
  students: Student[];
  cars?: Car[];
  scans: ScanRecord[];
  onAddStudent: (student: Student) => Promise<boolean | void> | void;
  onEditStudent?: (student: Student) => Promise<boolean | void> | void;
  onDeleteStudent: (id: string) => Promise<boolean | void> | void;
  onAddCar?: (car: Car) => Promise<boolean | void> | void;
  onEditCar?: (car: Car) => Promise<boolean | void> | void;
  onDeleteCar?: (carId: string) => Promise<boolean | void> | void;
  onDeleteScan?: (scanId: string) => Promise<boolean | void> | void;
  onClearAllScans?: () => Promise<boolean | void> | void;
  onCloseAdmin: () => void;
  appsScriptUrl: string;
  onUpdateAppsScriptUrl: (url: string) => void;
  connectedSheetId: string;
  onUpdateConnectedSheetId: (id: string, url: string, title?: string) => void;
  connectedSheetTitle: string;
  connectedSheetUrl: string;
  autoSyncEnabled: boolean;
  onToggleAutoSync: () => void;
  onSyncFromGoogleSheets?: () => Promise<void>;
  isSyncingSheets?: boolean;
  onSyncFromSupabase?: () => Promise<void>;
  isSyncingSupabase?: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  students,
  cars = [],
  scans,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onAddCar,
  onEditCar,
  onDeleteCar,
  onDeleteScan,
  onClearAllScans,
  onCloseAdmin,
  appsScriptUrl,
  onUpdateAppsScriptUrl,
  connectedSheetId,
  onUpdateConnectedSheetId,
  connectedSheetTitle,
  connectedSheetUrl,
  autoSyncEnabled,
  onToggleAutoSync,
  onSyncFromGoogleSheets,
  isSyncingSheets = false,
  onSyncFromSupabase,
  isSyncingSupabase = false,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Student Filter state
  const [stuSearch, setStuSearch] = useState('');
  const [stuCar, setStuCar] = useState('');
  const [stuGrade, setStuGrade] = useState('');
  const [stuDorm, setStuDorm] = useState('');

  // Student Modals
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Student Form Fields
  const [formStudentCode, setFormStudentCode] = useState('');
  const [formStudentName, setFormStudentName] = useState('');
  const [formStudentNickname, setFormStudentNickname] = useState('');
  const [formStudentGrade, setFormStudentGrade] = useState('ม.1');
  const [formStudentRoom, setFormStudentRoom] = useState('1');
  const [formStudentNumber, setFormStudentNumber] = useState('');
  const [formStudentDorm, setFormStudentDorm] = useState('หอ A');
  const [formStudentCar, setFormStudentCar] = useState('CAR01');
  const [formStudentStop, setFormStudentStop] = useState('');
  const [formStudentParent, setFormStudentParent] = useState('');
  const [formStudentPhone, setFormStudentPhone] = useState('');
  const [formStudentStatus, setFormStudentStatus] = useState('ใช้งาน');

  // Car Modals
  const [isAddingCar, setIsAddingCar] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);

  // Car Form Fields
  const [formCarId, setFormCarId] = useState('');
  const [formCarPlate, setFormCarPlate] = useState('');
  const [formCarName, setFormCarName] = useState('');
  const [formCarRoute, setFormCarRoute] = useState('');
  const [formCarDriver, setFormCarDriver] = useState('');
  const [formCarDriverPhone, setFormCarDriverPhone] = useState('');
  const [formCarAttendant, setFormCarAttendant] = useState('');
  const [formCarCapacity, setFormCarCapacity] = useState('60');
  const [formCarStatus, setFormCarStatus] = useState('ใช้งาน');

  // QR Code Tab state
  const [qrCar, setQrCar] = useState('');
  const [generatedQRs, setGeneratedQRs] = useState<{ student: Student; qrUrl: string }[]>([]);
  const [selectedStudentForQR, setSelectedStudentForQR] = useState<Student | null>(null);
  const [singleQrUrl, setSingleQrUrl] = useState<string>('');

  // Reports Tab state
  const [reportMode, setReportMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [reportDate, setReportDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reportCar, setReportCar] = useState('');

  // Confirm delete dialog state
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{
    type: 'student' | 'car' | 'scan' | 'clear_scans';
    id?: string;
    name?: string;
  } | null>(null);

  const supabaseConnected = isSupabaseConnected();

  // Reset Student Form
  const resetStudentForm = () => {
    setFormStudentCode('');
    setFormStudentName('');
    setFormStudentNickname('');
    setFormStudentGrade('ม.1');
    setFormStudentRoom('1');
    setFormStudentNumber('');
    setFormStudentDorm('หอ A');
    setFormStudentCar(cars[0]?.carID || 'CAR01');
    setFormStudentStop('');
    setFormStudentParent('');
    setFormStudentPhone('');
    setFormStudentStatus('ใช้งาน');
    setIsAddingStudent(false);
    setEditingStudent(null);
  };

  // Open Edit Student
  const handleStartEditStudent = (st: Student) => {
    setEditingStudent(st);
    setFormStudentCode(st.studentCode || st.id);
    setFormStudentName(st.name);
    setFormStudentNickname(st.nickname || '');
    setFormStudentGrade(st.grade || 'ม.1');
    setFormStudentRoom(st.room || (st.className ? st.className.split('/')[1] : '1'));
    setFormStudentNumber(st.number ? String(st.number) : '');
    setFormStudentDorm(st.dorm || 'หอ A');
    setFormStudentCar(st.carID || st.busNumber || 'CAR01');
    setFormStudentStop(st.pickup || st.busStopName || st.dormOrStop || '');
    setFormStudentParent(st.parent || '');
    setFormStudentPhone(st.parentPhone || '');
    setFormStudentStatus(st.status || 'ใช้งาน');
  };

  // Save Student (Add / Edit)
  const handleSubmitStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentCode.trim() || !formStudentName.trim()) return;

    const studentData: Student = {
      id: formStudentCode.trim(),
      studentCode: formStudentCode.trim(),
      name: formStudentName.trim(),
      nickname: formStudentNickname.trim() || undefined,
      grade: formStudentGrade,
      room: formStudentRoom,
      className: `${formStudentGrade}/${formStudentRoom}`,
      classroom: `${formStudentGrade}/${formStudentRoom}`,
      number: formStudentNumber ? Number(formStudentNumber) : undefined,
      dorm: formStudentDorm,
      carID: formStudentCar,
      busNumber: formStudentCar,
      dormOrStop: formStudentStop || formStudentDorm,
      busStopName: formStudentStop || formStudentDorm,
      pickup: formStudentStop || undefined,
      parent: formStudentParent || undefined,
      parentPhone: formStudentPhone || '081-000-0000',
      status: formStudentStatus,
      avatarColor: formStudentDorm.includes('B')
        ? 'bg-blue-500'
        : formStudentDorm.includes('C')
        ? 'bg-amber-500'
        : formStudentDorm.includes('D')
        ? 'bg-emerald-500'
        : 'bg-indigo-500',
      qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(formStudentCode.trim())}`,
    };

    if (editingStudent) {
      if (onEditStudent) {
        await onEditStudent(studentData);
      }
    } else {
      await onAddStudent(studentData);
    }

    resetStudentForm();
  };

  // Reset Car Form
  const resetCarForm = () => {
    setFormCarId('');
    setFormCarPlate('');
    setFormCarName('');
    setFormCarRoute('');
    setFormCarDriver('');
    setFormCarDriverPhone('');
    setFormCarAttendant('');
    setFormCarCapacity('60');
    setFormCarStatus('ใช้งาน');
    setIsAddingCar(false);
    setEditingCar(null);
  };

  // Open Edit Car
  const handleStartEditCar = (car: Car) => {
    setEditingCar(car);
    setFormCarId(car.carID);
    setFormCarPlate(car.plate);
    setFormCarName(car.name);
    setFormCarRoute(car.route || '');
    setFormCarDriver(car.driver || '');
    setFormCarDriverPhone(car.driverPhone || '');
    setFormCarAttendant(car.attendant || '');
    setFormCarCapacity(String(car.capacity || 60));
    setFormCarStatus(car.status || 'ใช้งาน');
  };

  // Save Car (Add / Edit)
  const handleSubmitCar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCarId.trim() || !formCarPlate.trim() || !formCarName.trim()) return;

    const carData: Car = {
      carID: formCarId.trim(),
      plate: formCarPlate.trim(),
      name: formCarName.trim(),
      route: formCarRoute.trim() || 'เส้นทางทั่วไป',
      driver: formCarDriver.trim() || 'พนักงานขับรถ',
      driverPhone: formCarDriverPhone.trim() || '081-000-0000',
      attendant: formCarAttendant.trim() || 'เจ้าหน้าที่ประจำรถ',
      capacity: Number(formCarCapacity) || 60,
      status: formCarStatus,
    };

    if (editingCar) {
      if (onEditCar) {
        await onEditCar(carData);
      }
    } else {
      if (onAddCar) {
        await onAddCar(carData);
      }
    }

    resetCarForm();
  };

  // Handle Confirmed Delete
  const handleExecuteDelete = async () => {
    if (!deleteConfirmItem) return;

    if (deleteConfirmItem.type === 'student' && deleteConfirmItem.id) {
      await onDeleteStudent(deleteConfirmItem.id);
    } else if (deleteConfirmItem.type === 'car' && deleteConfirmItem.id && onDeleteCar) {
      await onDeleteCar(deleteConfirmItem.id);
    } else if (deleteConfirmItem.type === 'scan' && deleteConfirmItem.id && onDeleteScan) {
      await onDeleteScan(deleteConfirmItem.id);
    } else if (deleteConfirmItem.type === 'clear_scans' && onClearAllScans) {
      await onClearAllScans();
    }

    setDeleteConfirmItem(null);
  };

  // Generate single QR when modal or selection changes
  useEffect(() => {
    if (selectedStudentForQR) {
      const payload = JSON.stringify({
        code: selectedStudentForQR.studentCode,
        name: selectedStudentForQR.name,
        grade: selectedStudentForQR.grade,
        bus: selectedStudentForQR.busNumber,
      });
      QRCode.toDataURL(payload, { width: 260, margin: 2 }).then(setSingleQrUrl);
    }
  }, [selectedStudentForQR]);

  // Generate batch QR codes for selected bus
  const generateQRCodes = async () => {
    const targetStudents = students.filter(
      (s) => !qrCar || s.busNumber === qrCar || s.carID === qrCar
    );

    const results: { student: Student; qrUrl: string }[] = [];
    for (const student of targetStudents) {
      const payload = JSON.stringify({
        code: student.studentCode,
        name: student.name,
        grade: student.grade,
        bus: student.busNumber || student.carID,
      });
      const url = await QRCode.toDataURL(payload, { width: 180, margin: 2 });
      results.push({ student, qrUrl: url });
    }
    setGeneratedQRs(results);
  };

  // Export Excel CSV
  const exportExcel = () => {
    const headers = [
      'ScanID',
      'StudentCode',
      'Name',
      'Grade',
      'CarID',
      'BusNumber',
      'Location',
      'Latitude',
      'Longitude',
      'Date',
      'Time',
      'ScanType',
      'Status',
    ];

    const rows = scans.map((s) => [
      s.scanId || s.id,
      s.studentCode,
      `"${s.name}"`,
      s.grade,
      s.carID || '',
      `"${s.busNumber}"`,
      `"${s.locationName}"`,
      s.latitude,
      s.longitude,
      s.dateThai,
      s.timeThai,
      s.scanType || 'ขึ้นรถ',
      'สำเร็จ',
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `รายงานสแกนรถ_Supabase_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered students for Students tab
  const filteredStudents = students.filter((s) => {
    const matchSearch =
      !stuSearch.trim() ||
      s.name.toLowerCase().includes(stuSearch.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(stuSearch.toLowerCase()) ||
      (s.nickname && s.nickname.toLowerCase().includes(stuSearch.toLowerCase())) ||
      s.grade.toLowerCase().includes(stuSearch.toLowerCase());

    const matchCar = !stuCar || s.busNumber === stuCar || s.carID === stuCar;
    const matchGrade = !stuGrade || s.grade === stuGrade || s.className?.startsWith(stuGrade);
    const matchDorm = !stuDorm || s.dorm === stuDorm;

    return matchSearch && matchCar && matchGrade && matchDorm;
  });

  // Calculate unique buses & dorms
  const allBuses = Array.from(
    new Set([...cars.map((c) => c.carID), ...students.map((s) => s.busNumber || s.carID || 'CAR01')])
  ).filter(Boolean);

  const allDorms = Array.from(
    new Set(students.map((s) => s.dorm).filter(Boolean))
  ) as string[];

  // Bus stats
  const busStats = allBuses.map((bus) => {
    const busStudents = students.filter((s) => s.busNumber === bus || s.carID === bus);
    const busScans = scans.filter((s) => s.busNumber === bus || s.carID === bus);
    return {
      bus,
      total: busStudents.length,
      scanned: busScans.length,
      percent: busStudents.length > 0 ? Math.round((busScans.length / busStudents.length) * 100) : 0,
    };
  });

  return (
    <section id="screen-admin" className="screen admin-screen active fixed inset-0 z-50 flex flex-col overflow-hidden select-none bg-slate-950 text-slate-100">
      {/* Topbar */}
      <div className="admin-topbar bg-slate-900/90 border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <button
          className="icon-circle w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white transition-colors"
          type="button"
          onClick={onCloseAdmin}
          title="กลับหน้าสแกน"
        >
          ←
        </button>
        <div className="admin-title text-center">
          <div className="flex items-center justify-center gap-2">
            <strong className="text-sm font-bold text-white">ระบบจัดการหลังบ้าน</strong>
            {supabaseConnected ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Supabase 100%
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Local State
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400">แอดมินระบบเช็คอินรถรับส่ง</span>
        </div>
        <button
          className="icon-circle w-9 h-9 rounded-full bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 flex items-center justify-center transition-colors"
          type="button"
          onClick={onCloseAdmin}
          title="ปิดหน้าต่าง"
        >
          ✕
        </button>
      </div>

      {/* Cloud & Realtime Action Bar */}
      <div className="bg-slate-900 border-b border-white/5 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300">ฐานข้อมูล:</span>
            <span className="text-emerald-400 font-mono text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              นักเรียน ({students.length}) • รถ ({cars.length}) • สแกน ({scans.length})
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('supabase')}
            className="text-[11px] px-2.5 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30 hover:bg-teal-500/30 transition-colors flex items-center gap-1 font-semibold"
          >
            <span>⚡ Supabase Database (CRUD 100%)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onSyncFromSupabase && (
            <button
              type="button"
              onClick={() => onSyncFromSupabase()}
              disabled={isSyncingSupabase}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs shadow transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingSupabase ? 'animate-spin' : ''}`} />
              <span>{isSyncingSupabase ? 'กำลังซิงค์...' : 'ดึงสดจาก Supabase'}</span>
            </button>
          )}

          {onSyncFromGoogleSheets && (
            <button
              type="button"
              onClick={() => onSyncFromGoogleSheets()}
              disabled={isSyncingSheets}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-xs shadow transition-all active:scale-95 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3 h-3" />
              <span>{isSyncingSheets ? 'กำลังดึง...' : 'ซิงค์ Sheets'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-tabs flex overflow-x-auto bg-slate-900/80 border-b border-white/5 p-1 gap-1" id="adminTabs">
        <button
          className={`at px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'dashboard' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
          type="button"
          onClick={() => setActiveTab('dashboard')}
        >
          📊 แดชบอร์ด
        </button>
        <button
          className={`at px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'students' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
          type="button"
          onClick={() => setActiveTab('students')}
        >
          <User className="w-3.5 h-3.5" />
          <span>นักเรียน ({students.length})</span>
        </button>
        <button
          className={`at px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'cars' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
          type="button"
          onClick={() => setActiveTab('cars')}
        >
          <Bus className="w-3.5 h-3.5" />
          <span>รถรับส่ง ({cars.length})</span>
        </button>
        <button
          className={`at px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'qrcode' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
          type="button"
          onClick={() => setActiveTab('qrcode')}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>สร้าง QR Code</span>
        </button>
        <button
          className={`at px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'reports' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
          type="button"
          onClick={() => setActiveTab('reports')}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>รายงานสแกน</span>
        </button>
        <button
          className={`at px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'sheets' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
          type="button"
          onClick={() => setActiveTab('sheets')}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Google Sheets</span>
        </button>
        <button
          className={`at px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'supabase' ? 'bg-teal-600 text-white shadow-md' : 'text-teal-400 hover:text-teal-200'
          }`}
          type="button"
          onClick={() => setActiveTab('supabase')}
        >
          <Database className="w-3.5 h-3.5 text-teal-300" />
          <span>Supabase SQL & Sync</span>
        </button>
      </div>

      {/* Admin Body Panels */}
      <div className="admin-body flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
        {/* ======================================================== */}
        {/* TAB 1: DASHBOARD */}
        {/* ======================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5" id="tab-dashboard">
            {/* Stat Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-900 border border-white/10 p-4 rounded-2xl shadow-sm">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>สแกนวันนี้</span>
                  <Clock className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-white mt-2">
                  {scans.length} <span className="text-xs text-slate-400 font-normal">ครั้ง</span>
                </div>
                <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>เช็คอิน Realtime</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-white/10 p-4 rounded-2xl shadow-sm">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>นักเรียนทั้งหมด</span>
                  <User className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white mt-2">
                  {students.length} <span className="text-xs text-slate-400 font-normal">คน</span>
                </div>
                <div className="text-[11px] text-blue-400 mt-1">
                  ฐานข้อมูล Supabase
                </div>
              </div>

              <div className="bg-slate-900 border border-white/10 p-4 rounded-2xl shadow-sm">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>รถรับส่ง</span>
                  <Bus className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-white mt-2">
                  {cars.length} <span className="text-xs text-slate-400 font-normal">คัน</span>
                </div>
                <div className="text-[11px] text-amber-400 mt-1">
                  {allBuses.length} สายบริการ
                </div>
              </div>

              <div className="bg-slate-900 border border-white/10 p-4 rounded-2xl shadow-sm">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>อัตราขึ้นรถ</span>
                  <Shield className="w-4 h-4 text-teal-400" />
                </div>
                <div className="text-2xl font-bold text-teal-400 mt-2">
                  {students.length > 0 ? Math.round((scans.length / students.length) * 100) : 0}%
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  ความครอบคลุม
                </div>
              </div>
            </div>

            {/* Bus Cards */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bus className="w-4 h-4 text-amber-400" />
                  <span>สถานะรถรับส่งแยกตามสาย</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('cars')}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  จัดการรถ &gt;
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {busStats.map((item) => (
                  <div
                    key={item.bus}
                    className="bg-slate-950 border border-white/5 p-3.5 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>{item.bus}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        ขึ้นแล้ว <strong className="text-white">{item.scanned}</strong> จาก {item.total} คน
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {item.percent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Scans Table */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>รายการสแกนล่าสุด (Supabase Live Scans)</span>
                </h3>
                <div className="flex items-center gap-2">
                  {onClearAllScans && scans.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteConfirmItem({
                          type: 'clear_scans',
                          name: 'ล้างประวัติการสแกนทั้งหมด',
                        })
                      }
                      className="text-xs text-rose-400 hover:text-rose-300 px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-800/40 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>ล้างประวัติ</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="table w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400">
                      <th className="py-2.5">เวลา</th>
                      <th>รหัสนักเรียน</th>
                      <th>ชื่อ-สกุล</th>
                      <th>ชั้น</th>
                      <th>สายรถ</th>
                      <th>จุดสแกน</th>
                      <th>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scans.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-slate-500">
                          ยังไม่มีประวัติการสแกนในระบบ Supabase
                        </td>
                      </tr>
                    ) : (
                      scans.slice(0, 15).map((s, index) => (
                        <tr key={`admin-top-scan-${s.id || s.scanId || 'item'}-${index}`} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-2.5 font-mono text-emerald-400 font-semibold">{s.timeThai}</td>
                          <td className="font-mono text-amber-400">{s.studentCode}</td>
                          <td className="font-semibold text-white">{s.name}</td>
                          <td className="text-slate-300">{s.grade}</td>
                          <td className="text-slate-300">{s.busNumber}</td>
                          <td className="text-slate-400">{s.locationName}</td>
                          <td>
                            {onDeleteScan && (
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteConfirmItem({
                                    type: 'scan',
                                    id: s.scanId || s.id,
                                    name: `สแกนของ ${s.name} (${s.timeThai})`,
                                  })
                                }
                                className="p-1 rounded bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 transition-colors"
                                title="ลบรายการสแกนนี้ออกจาก Supabase"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: STUDENTS (CRUD 100%) */}
        {/* ======================================================== */}
        {activeTab === 'students' && (
          <div className="space-y-4" id="tab-students">
            {/* Filter & Action Bar */}
            <div className="flex flex-wrap gap-2.5 items-center justify-between">
              <div className="flex flex-wrap gap-2 flex-1">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    placeholder="🔎 ค้นหา ชื่อ, รหัส, ชื่อเล่น, ชั้น..."
                    value={stuSearch}
                    onChange={(e) => setStuSearch(e.target.value)}
                  />
                </div>

                <select
                  className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  value={stuCar}
                  onChange={(e) => setStuCar(e.target.value)}
                >
                  <option value="">ทุกสายรถ</option>
                  {allBuses.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>

                <select
                  className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  value={stuDorm}
                  onChange={(e) => setStuDorm(e.target.value)}
                >
                  <option value="">ทุกหอพัก</option>
                  {allDorms.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all"
                  onClick={() => {
                    resetStudentForm();
                    setIsAddingStudent(true);
                  }}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ เพิ่มนักเรียนใหม่</span>
                </button>
              </div>
            </div>

            {/* Student Table */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-3 bg-slate-950/60 border-b border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span>
                  แสดงผล <strong>{filteredStudents.length}</strong> จากทั้งหมด {students.length} คน
                </span>
                <span className="text-emerald-400 font-mono text-[11px]">
                  ⚡ Realtime Supabase PostgreSQL
                </span>
              </div>

              <div className="overflow-x-auto max-h-[600px]">
                <table className="table w-full text-xs text-left" id="stuTable">
                  <thead className="sticky top-0 bg-slate-900 z-10">
                    <tr className="border-b border-white/10 text-slate-400">
                      <th className="py-2.5 px-3">รหัส</th>
                      <th>ชื่อ-นามสกุล</th>
                      <th>ชื่อเล่น</th>
                      <th>ชั้น/ห้อง</th>
                      <th>เลขที่</th>
                      <th>หอพัก</th>
                      <th>สายรถ</th>
                      <th>จุดขึ้นรถ</th>
                      <th>ผู้ปกครอง/เบอร์</th>
                      <th>สถานะ</th>
                      <th className="text-right px-3">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="text-center py-8 text-slate-500">
                          ไม่พบข้อมูลนักเรียนที่ค้นหา
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((st) => (
                        <tr
                          key={st.id}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors text-slate-200"
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{st.studentCode}</td>
                          <td className="font-semibold text-white">{st.name}</td>
                          <td className="text-slate-300">{st.nickname || '-'}</td>
                          <td>{st.className || st.grade}</td>
                          <td className="font-mono text-slate-400">{st.number || '-'}</td>
                          <td>
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-white/5">
                              {st.dorm || '-'}
                            </span>
                          </td>
                          <td className="text-emerald-400 font-medium">{st.carID || st.busNumber}</td>
                          <td className="text-slate-400 truncate max-w-[120px]">{st.pickup || st.busStopName || '-'}</td>
                          <td className="font-mono text-slate-300 text-[11px]">
                            {st.parentPhone || '-'}
                          </td>
                          <td>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] ${
                                st.status === 'ใช้งาน' || !st.status
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {st.status || 'ใช้งาน'}
                            </span>
                          </td>
                          <td className="text-right px-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedStudentForQR(st)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] transition-colors"
                                title="ดู QR Code"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartEditStudent(st)}
                                className="p-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/70 text-blue-300 text-[10px] transition-colors"
                                title="แก้ไขข้อมูลใน Supabase"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteConfirmItem({
                                    type: 'student',
                                    id: st.id,
                                    name: `${st.name} (${st.studentCode})`,
                                  })
                                }
                                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/70 text-rose-300 text-[10px] transition-colors"
                                title="ลบออกจาก Supabase"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: CARS (CRUD 100%) */}
        {/* ======================================================== */}
        {activeTab === 'cars' && (
          <div className="space-y-4" id="tab-cars">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Bus className="w-4 h-4 text-amber-400" />
                  <span>ข้อมูลรถรับส่งนักเรียน (ตาราง: public.cars)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  เชื่อมต่อกับ Supabase 100% เพิ่ม แก้ไข ลบ และดึงข้อมูลสด
                </p>
              </div>

              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all"
                onClick={() => {
                  resetCarForm();
                  setIsAddingCar(true);
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ เพิ่มรถรับส่ง</span>
              </button>
            </div>

            <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 bg-slate-950/40">
                      <th className="py-3 px-3">CarID</th>
                      <th>ทะเบียนรถ</th>
                      <th>ชื่อรถ / สาย</th>
                      <th>เส้นทาง / หอพัก</th>
                      <th>คนขับ</th>
                      <th>เบอร์โทรคนขับ</th>
                      <th>พี่เลี้ยงประจำรถ</th>
                      <th>ความจุ</th>
                      <th>สถานะ</th>
                      <th className="text-right px-3">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cars.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-8 text-slate-500">
                          ยังไม่มีข้อมูลรถในระบบ Supabase
                        </td>
                      </tr>
                    ) : (
                      cars.map((car) => (
                        <tr key={car.carID} className="border-b border-white/5 hover:bg-white/5 transition-colors text-slate-200">
                          <td className="py-3 px-3 font-mono font-bold text-amber-400">{car.carID}</td>
                          <td className="font-semibold text-white">{car.plate}</td>
                          <td>{car.name}</td>
                          <td className="text-emerald-300 font-medium">{car.route}</td>
                          <td>{car.driver}</td>
                          <td className="font-mono text-slate-400">{car.driverPhone}</td>
                          <td>{car.attendant}</td>
                          <td className="font-mono">{car.capacity} ที่นั่ง</td>
                          <td>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] ${
                                car.status === 'ใช้งาน'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {car.status}
                            </span>
                          </td>
                          <td className="text-right px-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleStartEditCar(car)}
                                className="p-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/70 text-blue-300 text-[10px] transition-colors"
                                title="แก้ไขรถใน Supabase"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteConfirmItem({
                                    type: 'car',
                                    id: car.carID,
                                    name: `${car.name} (${car.carID})`,
                                  })
                                }
                                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/70 text-rose-300 text-[10px] transition-colors"
                                title="ลบรถออกจาก Supabase"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: QR CODES */}
        {/* ======================================================== */}
        {activeTab === 'qrcode' && (
          <div className="space-y-4" id="tab-qrcode">
            <div className="flex flex-wrap gap-2 items-center justify-between bg-slate-900 p-3 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <select
                  id="qrCar"
                  className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  value={qrCar}
                  onChange={(e) => setQrCar(e.target.value)}
                >
                  <option value="">ทุกสายรถ ({students.length} คน)</option>
                  {allBuses.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <button
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5"
                  type="button"
                  onClick={generateQRCodes}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>สร้าง QR Code ทั้งหมด</span>
                </button>
              </div>

              <button
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5"
                type="button"
                onClick={() => window.print()}
              >
                <span>🖨️ พิมพ์บัตร QR</span>
              </button>
            </div>

            <div className="bg-slate-900 border border-white/10 rounded-2xl p-4">
              <div id="qrGrid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {generatedQRs.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-slate-500 text-xs">
                    เลือกสายรถแล้วกด &quot;สร้าง QR Code ทั้งหมด&quot; เพื่อแสดงบัตรพร้อม QR Code
                  </div>
                ) : (
                  generatedQRs.map(({ student, qrUrl }) => (
                    <div
                      key={student.id}
                      className="bg-slate-950 border border-white/10 p-3 rounded-2xl text-center flex flex-col items-center space-y-2 shadow-sm"
                    >
                      <div className="bg-white p-2 rounded-xl shadow-inner">
                        <img src={qrUrl} alt={student.name} className="w-28 h-28" />
                      </div>
                      <div className="text-xs font-bold text-white truncate max-w-[150px]">
                        {student.name}
                      </div>
                      <div className="text-[10px] text-amber-300 font-mono">
                        {student.studentCode} • {student.grade}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {student.busNumber || student.carID}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: REPORTS */}
        {/* ======================================================== */}
        {activeTab === 'reports' && (
          <div className="space-y-4" id="tab-reports">
            <div className="flex flex-wrap gap-2 items-center justify-between bg-slate-900 p-3 rounded-2xl border border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  id="reportDate"
                  className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                />
                <select
                  id="reportCar"
                  className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  value={reportCar}
                  onChange={(e) => setReportCar(e.target.value)}
                >
                  <option value="">ทุกสายรถ</option>
                  {allBuses.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow"
                type="button"
                onClick={exportExcel}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>ดาวน์โหลด Excel CSV</span>
              </button>
            </div>

            {/* Scans List Table */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">ประวัติการสแกนทั้งหมด ({scans.length} รายการ)</h3>
              </div>

              <div className="overflow-x-auto max-h-[500px]">
                <table className="table w-full text-xs text-left" id="reportStuTable">
                  <thead className="sticky top-0 bg-slate-900 z-10">
                    <tr className="border-b border-white/10 text-slate-400">
                      <th className="py-2.5">เวลา</th>
                      <th>รหัส</th>
                      <th>ชื่อ-สกุล</th>
                      <th>สายรถ</th>
                      <th>จุดสแกน</th>
                      <th>พิกัด GPS</th>
                      <th>สถานะ</th>
                      <th className="text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scans.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-500">
                          ยังไม่มีข้อมูลการสแกน
                        </td>
                      </tr>
                    ) : (
                      scans.map((s, index) => (
                        <tr key={`admin-all-scan-${s.id || s.scanId || 'item'}-${index}`} className="border-b border-white/5 hover:bg-white/5 text-slate-200">
                          <td className="py-2 font-mono text-emerald-400">{s.timeThai}</td>
                          <td className="font-mono text-amber-400">{s.studentCode}</td>
                          <td className="font-semibold text-white">{s.name}</td>
                          <td>{s.busNumber || s.carID}</td>
                          <td className="text-slate-400">{s.locationName}</td>
                          <td className="text-[10px] font-mono text-slate-400">
                            {s.latitude ? `${s.latitude.toFixed(4)}, ${s.longitude.toFixed(4)}` : '-'}
                          </td>
                          <td>
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300">
                              ขึ้นรถแล้ว
                            </span>
                          </td>
                          <td className="text-right">
                            {onDeleteScan && (
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteConfirmItem({
                                    type: 'scan',
                                    id: s.scanId || s.id,
                                    name: `สแกนของ ${s.name}`,
                                  })
                                }
                                className="p-1 rounded bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: GOOGLE SHEETS */}
        {/* ======================================================== */}
        {activeTab === 'sheets' && (
          <div className="space-y-4" id="tab-sheets">
            <GoogleSheetsPanel
              appsScriptUrl={appsScriptUrl}
              onUpdateAppsScriptUrl={onUpdateAppsScriptUrl}
              connectedSheetId={connectedSheetId}
              onUpdateConnectedSheetId={onUpdateConnectedSheetId}
              connectedSheetTitle={connectedSheetTitle}
              connectedSheetUrl={connectedSheetUrl}
              autoSyncEnabled={autoSyncEnabled}
              onToggleAutoSync={onToggleAutoSync}
              scans={scans}
              onRefreshFromGoogleSheets={onSyncFromGoogleSheets}
              isSyncingSheets={isSyncingSheets}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 7: SUPABASE DATABASE & SQL */}
        {/* ======================================================== */}
        {activeTab === 'supabase' && (
          <div className="space-y-4" id="tab-supabase">
            <SupabasePanel
              onSyncFromSupabase={onSyncFromSupabase}
              isSyncingSupabase={isSyncingSupabase}
            />
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT STUDENT (Supabase 100%) */}
      {/* ======================================================== */}
      {(isAddingStudent || editingStudent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>{editingStudent ? 'แก้ไขข้อมูลนักเรียน (Supabase)' : 'เพิ่มนักเรียนใหม่ (Supabase)'}</span>
              </h3>
              <button
                type="button"
                onClick={resetStudentForm}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitStudent} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">รหัสนักเรียน (student_id) *</label>
                  <input
                    required
                    disabled={Boolean(editingStudent)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono disabled:opacity-60"
                    placeholder="เช่น STD0301"
                    value={formStudentCode}
                    onChange={(e) => setFormStudentCode(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">ชื่อเล่น (nickname)</label>
                  <input
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    placeholder="เช่น น้องโบ๊ท"
                    value={formStudentNickname}
                    onChange={(e) => setFormStudentNickname(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">ชื่อ-นามสกุล (name) *</label>
                <input
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  placeholder="เช่น ด.ช. กานต์ ธนบดี"
                  value={formStudentName}
                  onChange={(e) => setFormStudentName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">ระดับชั้น (grade)</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    value={formStudentGrade}
                    onChange={(e) => setFormStudentGrade(e.target.value)}
                  >
                    <option value="ม.1">ม.1</option>
                    <option value="ม.2">ม.2</option>
                    <option value="ม.3">ม.3</option>
                    <option value="ม.4">ม.4</option>
                    <option value="ม.5">ม.5</option>
                    <option value="ม.6">ม.6</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">ห้อง (room)</label>
                  <input
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    placeholder="1"
                    value={formStudentRoom}
                    onChange={(e) => setFormStudentRoom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">เลขที่ (seat_number)</label>
                  <input
                    type="number"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    placeholder="12"
                    value={formStudentNumber}
                    onChange={(e) => setFormStudentNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">หอพัก (dorm)</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    value={formStudentDorm}
                    onChange={(e) => setFormStudentDorm(e.target.value)}
                  >
                    <option value="หอ A">หอ A (ชาย ม.ต้น)</option>
                    <option value="หอ B">หอ B (หญิง ม.ต้น)</option>
                    <option value="หอ C">หอ C (ชาย ม.ปลาย)</option>
                    <option value="หอ D">หอ D (หญิง ม.ปลาย)</option>
                    <option value="หอ E">หอ E (หอนานาชาติ)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">สายรถรับส่ง (car_id)</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    value={formStudentCar}
                    onChange={(e) => setFormStudentCar(e.target.value)}
                  >
                    {cars.map((c) => (
                      <option key={c.carID} value={c.carID}>
                        {c.carID} - {c.name} ({c.plate})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">จุดขึ้นรถ / รับส่ง (pickup_point)</label>
                <input
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  placeholder="เช่น หน้าหอพัก A หรือ ประตู 1 โรงเรียน"
                  value={formStudentStop}
                  onChange={(e) => setFormStudentStop(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">ชื่อผู้ปกครอง (parent_name)</label>
                  <input
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    placeholder="เช่น คุณพ่อสมศักดิ์"
                    value={formStudentParent}
                    onChange={(e) => setFormStudentParent(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">เบอร์โทรผู้ปกครอง (parent_phone)</label>
                  <input
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    placeholder="081-234-5678"
                    value={formStudentPhone}
                    onChange={(e) => setFormStudentPhone(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">สถานะ (status)</label>
                <select
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  value={formStudentStatus}
                  onChange={(e) => setFormStudentStatus(e.target.value)}
                >
                  <option value="ใช้งาน">ใช้งาน (Active)</option>
                  <option value="ลาพักการศึกษา">ลาพักการศึกษา</option>
                  <option value="ระงับการใช้">ระงับการใช้</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  onClick={resetStudentForm}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-900/40"
                >
                  {editingStudent ? 'บันทึกการแก้ไข (Update)' : 'บันทึกลง Supabase (Insert)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT CAR (Supabase 100%) */}
      {/* ======================================================== */}
      {(isAddingCar || editingCar) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bus className="w-4 h-4 text-amber-400" />
                <span>{editingCar ? 'แก้ไขข้อมูลรถรับส่ง (Supabase)' : 'เพิ่มรถรับส่งใหม่ (Supabase)'}</span>
              </h3>
              <button
                type="button"
                onClick={resetCarForm}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCar} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">รหัสรถ (car_id) *</label>
                  <input
                    required
                    disabled={Boolean(editingCar)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono disabled:opacity-60"
                    placeholder="เช่น CAR06"
                    value={formCarId}
                    onChange={(e) => setFormCarId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">ทะเบียนรถ (plate_number) *</label>
                  <input
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    placeholder="เช่น 1กข 5566"
                    value={formCarPlate}
                    onChange={(e) => setFormCarPlate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">ชื่อรถ / สายรถ (name) *</label>
                <input
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  placeholder="เช่น รถบัสสาย 6 (หอพักนานาชาติ)"
                  value={formCarName}
                  onChange={(e) => setFormCarName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">เส้นทาง / หอพัก (route)</label>
                <input
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  placeholder="เช่น หอ A - อาคารเรียน 1"
                  value={formCarRoute}
                  onChange={(e) => setFormCarRoute(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">พนักงานขับรถ (driver_name)</label>
                  <input
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    placeholder="เช่น นายประสิทธิ์ ขับดี"
                    value={formCarDriver}
                    onChange={(e) => setFormCarDriver(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">เบอร์คนขับ (driver_phone)</label>
                  <input
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    placeholder="081-111-2222"
                    value={formCarDriverPhone}
                    onChange={(e) => setFormCarDriverPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-slate-300 font-semibold block mb-1">พี่เลี้ยงประจำรถ (attendant_name)</label>
                  <input
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    placeholder="เช่น น.ส. อารียา ดูแลดี"
                    value={formCarAttendant}
                    onChange={(e) => setFormCarAttendant(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">ความจุ (ที่นั่ง)</label>
                  <input
                    type="number"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    value={formCarCapacity}
                    onChange={(e) => setFormCarCapacity(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">สถานะรถ (status)</label>
                <select
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  value={formCarStatus}
                  onChange={(e) => setFormCarStatus(e.target.value)}
                >
                  <option value="ใช้งาน">ใช้งาน (Active)</option>
                  <option value="ซ่อมบำรุง">ซ่อมบำรุง (Maintenance)</option>
                  <option value="สำรอง">สำรอง (Standby)</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  onClick={resetCarForm}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-lg shadow-amber-900/40"
                >
                  {editingCar ? 'บันทึกการแก้ไขรถ (Update)' : 'บันทึกรถลง Supabase (Insert)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* ======================================================== */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">ยืนยันการลบข้อมูล?</h3>
              <p className="text-xs text-slate-300 mt-1">
                คุณต้องการลบ <strong className="text-rose-400">{deleteConfirmItem.name}</strong> ออกจาก Supabase ใช่หรือไม่?
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                การดำเนินการนี้จะลบข้อมูลออกจากระบบฐานข้อมูลคลาวด์ทันที
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
                onClick={() => setDeleteConfirmItem(null)}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-900/40"
                onClick={handleExecuteDelete}
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SINGLE STUDENT QR */}
      {/* ======================================================== */}
      {selectedStudentForQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-xs w-full text-center space-y-3 shadow-2xl">
            <h3 className="text-base font-bold text-white">บัตร QR Code ประจำตัว</h3>
            <div className="bg-white p-4 rounded-2xl inline-block shadow-inner">
              <img src={singleQrUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">{selectedStudentForQR.name}</div>
              <div className="text-xs text-amber-400 font-mono">
                {selectedStudentForQR.studentCode} • {selectedStudentForQR.grade}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {selectedStudentForQR.busNumber || selectedStudentForQR.carID} • {selectedStudentForQR.dorm}
              </div>
            </div>
            <button
              type="button"
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
              onClick={() => setSelectedStudentForQR(null)}
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
