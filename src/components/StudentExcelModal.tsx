import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Users,
  Search,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Student } from '../types';
import {
  exportStudentTemplateXLSX,
  exportStudentTemplateCSV,
  exportStudentsToXLSX,
  parseStudentExcelFile,
} from '../utils/excelStudents';

interface StudentExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStudents: Student[];
  onImportStudents: (students: Student[]) => Promise<void> | void;
}

export const StudentExcelModal: React.FC<StudentExcelModalProps> = ({
  isOpen,
  onClose,
  currentStudents,
  onImportStudents,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'template'>('import');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedStudents, setParsedStudents] = useState<Student[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [rawCount, setRawCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewSearch, setPreviewSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process selected file
  const handleFile = async (file: File) => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      alert('กรุณาเลือกไฟล์ Excel (.xlsx, .xls) หรือ CSV (.csv)');
      return;
    }

    setSelectedFile(file);
    setIsLoading(true);
    setParseErrors([]);

    try {
      const result = await parseStudentExcelFile(file);
      setParsedStudents(result.students);
      setParseErrors(result.errors);
      setRawCount(result.rawCount);
    } catch (err: any) {
      console.error('Failed to parse excel file:', err);
      setParseErrors([err.message || 'เกิดข้อผิดพลาดในการอ่านไฟล์ Excel']);
      setParsedStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleResetFile = () => {
    setSelectedFile(null);
    setParsedStudents([]);
    setParseErrors([]);
    setRawCount(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Confirm import
  const handleConfirmImport = async () => {
    if (parsedStudents.length === 0) return;
    setIsSubmitting(true);
    try {
      await onImportStudents(parsedStudents);
      handleResetFile();
      onClose();
    } catch (err: any) {
      alert(`นำเข้าไม่สำเร็จ: ${err.message || 'โปรดลองใหม่อีกครั้ง'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Existing student codes set for comparison
  const existingCodesSet = new Set(
    currentStudents.map((s) => s.studentCode.trim().toUpperCase())
  );

  const newCount = parsedStudents.filter(
    (s) => !existingCodesSet.has(s.studentCode.trim().toUpperCase())
  ).length;
  const updateCount = parsedStudents.length - newCount;

  // Filter preview table
  const filteredPreview = parsedStudents.filter((st) => {
    if (!previewSearch.trim()) return true;
    const q = previewSearch.toLowerCase().trim();
    return (
      st.name.toLowerCase().includes(q) ||
      st.studentCode.toLowerCase().includes(q) ||
      (st.nickname && st.nickname.toLowerCase().includes(q)) ||
      st.grade.toLowerCase().includes(q) ||
      st.busNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                จัดการนำเข้า-ส่งออก Excel นักเรียน
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-normal">
                  .xlsx / .csv
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                นำเข้าไฟล์รายชื่อนักเรียนจากโปรแกรม Excel และดาวน์โหลดแม่แบบสำหรับกรอกข้อมูล
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-white/10 bg-slate-900/60 px-6 pt-2">
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'import'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            นำเข้าไฟล์ Excel (Import Excel)
            {parsedStudents.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300">
                {parsedStudents.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('template')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'template'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            ดาวน์โหลดแม่แบบ Excel (Export Template)
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* ========================================================= */}
          {/* TAB 1: IMPORT EXCEL */}
          {/* ========================================================= */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              {!selectedFile ? (
                /* Upload Drop Zone */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-emerald-400 bg-emerald-500/10'
                      : 'border-white/15 bg-slate-950/40 hover:border-emerald-500/50 hover:bg-slate-950/70'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                    <Upload className="w-7 h-7 animate-bounce" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    ลากไฟล์ Excel (.xlsx, .xls) หรือ CSV มาวางที่นี่
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mb-4">
                    หรือคลิกเพื่อเลือกไฟล์จากคอมพิวเตอร์ของคุณ ระบบจะตรวจจับคอลัมน์ชื่อ รหัส
                    ชั้น หอพัก และสายรถให้อัตโนมัติ
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg flex items-center gap-1.5 transition-all"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      เลือกไฟล์จากเครื่อง
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        exportStudentTemplateXLSX();
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs border border-white/10 flex items-center gap-1.5 transition-all"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      ดาวน์โหลดไฟล์ตัวอย่างก่อน
                    </button>
                  </div>
                </div>
              ) : (
                /* File Selected & Preview Mode */
                <div className="space-y-4">
                  {/* File Info Bar */}
                  <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {selectedFile.name}
                          </span>
                          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          อ่านพบข้อมูลทั้งหมด{' '}
                          <strong className="text-white">{rawCount}</strong> แถว (สำเร็จ{' '}
                          <strong className="text-emerald-400">{parsedStudents.length}</strong>{' '}
                          คน)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetFile}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-white/10 transition-colors"
                      >
                        เปลี่ยนไฟล์
                      </button>
                    </div>
                  </div>

                  {/* Summary Stats Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-950/40 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                        ✓
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">พร้อมนำเข้าทั้งหมด</div>
                        <div className="text-base font-bold text-emerald-400">
                          {parsedStudents.length} คน
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950/40 border border-blue-500/20 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                        +
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">นักเรียนใหม่</div>
                        <div className="text-base font-bold text-blue-400">
                          {newCount} คน
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950/40 border border-amber-500/20 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                        ↺
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">อัปเดตข้อมูลเดิม</div>
                        <div className="text-base font-bold text-amber-400">
                          {updateCount} คน
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Errors / Warnings if any */}
                  {parseErrors.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                      <div className="space-y-1">
                        <span className="font-bold">การแจ้งเตือนระหว่างอ่านไฟล์:</span>
                        <ul className="list-disc pl-4 space-y-0.5 text-amber-200/80">
                          {parseErrors.slice(0, 5).map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                          {parseErrors.length > 5 && (
                            <li>และอีก {parseErrors.length - 5} ข้อความ...</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Search in Preview */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-xs">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        placeholder="ค้นหาในตัวอย่าง..."
                        value={previewSearch}
                        onChange={(e) => setPreviewSearch(e.target.value)}
                      />
                    </div>
                    <span className="text-xs text-slate-400">
                      แสดงตัวอย่าง {filteredPreview.length} จาก {parsedStudents.length} คน
                    </span>
                  </div>

                  {/* Data Preview Table */}
                  <div className="bg-slate-950/80 border border-white/10 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="sticky top-0 bg-slate-900 border-b border-white/10 text-slate-400">
                        <tr>
                          <th className="py-2 px-3">รหัส</th>
                          <th className="py-2 px-3">ชื่อ-นามสกุล</th>
                          <th className="py-2 px-3">ชื่อเล่น</th>
                          <th className="py-2 px-3">ระดับชั้น</th>
                          <th className="py-2 px-3">หอพัก</th>
                          <th className="py-2 px-3">สายรถ</th>
                          <th className="py-2 px-3">จุดขึ้นรถ</th>
                          <th className="py-2 px-3">เบอร์โทร</th>
                          <th className="py-2 px-3 text-right">ประเภท</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredPreview.slice(0, 100).map((st, i) => {
                          const isExisting = existingCodesSet.has(
                            st.studentCode.trim().toUpperCase()
                          );
                          return (
                            <tr key={i} className="hover:bg-white/5 text-slate-300">
                              <td className="py-2 px-3 font-mono font-bold text-amber-400">
                                {st.studentCode}
                              </td>
                              <td className="py-2 px-3 font-semibold text-white">
                                {st.name}
                              </td>
                              <td className="py-2 px-3 text-slate-400">
                                {st.nickname || '-'}
                              </td>
                              <td className="py-2 px-3">
                                {st.className || st.grade || '-'}
                              </td>
                              <td className="py-2 px-3">{st.dorm || '-'}</td>
                              <td className="py-2 px-3 text-emerald-400 font-medium">
                                {st.busNumber}
                              </td>
                              <td className="py-2 px-3 text-slate-400 truncate max-w-[140px]">
                                {st.pickup || '-'}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-400">
                                {st.parentPhone || '-'}
                              </td>
                              <td className="py-2 px-3 text-right">
                                {isExisting ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    อัปเดต
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                    ใหม่
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleResetFile}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-white/10 transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      disabled={parsedStudents.length === 0 || isSubmitting}
                      onClick={handleConfirmImport}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          กำลังบันทึกข้อมูล...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          ยืนยันนำเข้าข้อมูล ({parsedStudents.length} คน)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: EXPORT TEMPLATE */}
          {/* ========================================================= */}
          {activeTab === 'template' && (
            <div className="space-y-5">
              {/* Template Download Card */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">
                        ไฟล์แม่แบบรายชื่อนักเรียน (Student Template)
                      </h4>
                      <p className="text-xs text-slate-400">
                        ดาวน์โหลดไฟล์แม่แบบที่มีคอลัมน์มาตรฐานครบถ้วน พร้อมตัวอย่างข้อมูล 5 แถว
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={exportStudentTemplateXLSX}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-2 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      ดาวน์โหลดแม่แบบ Excel (.xlsx)
                    </button>

                    <button
                      type="button"
                      onClick={exportStudentTemplateCSV}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-white/10 flex items-center gap-2 transition-all"
                    >
                      <FileText className="w-4 h-4 text-amber-400" />
                      ดาวน์โหลดแม่แบบ CSV (.csv)
                    </button>

                    <button
                      type="button"
                      onClick={() => exportStudentsToXLSX(currentStudents)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-semibold text-xs border border-emerald-500/30 flex items-center gap-2 transition-all"
                    >
                      <Users className="w-4 h-4 text-emerald-400" />
                      ส่งออกข้อมูลนักเรียนปัจจุบัน ({currentStudents.length} คน)
                    </button>
                  </div>
                </div>
              </div>

              {/* Column Specification Guide */}
              <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-5 space-y-3">
                <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  โครงสร้างคอลัมน์ในไฟล์แม่แบบ (Column Format)
                </h5>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900 border-b border-white/10 text-slate-400">
                      <tr>
                        <th className="py-2 px-3">ชื่อคอลัมน์ (หัวตาราง)</th>
                        <th className="py-2 px-3">ความจำเป็น</th>
                        <th className="py-2 px-3">ตัวอย่างข้อมูล</th>
                        <th className="py-2 px-3">คำอธิบาย</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      <tr>
                        <td className="py-2 px-3 font-mono font-bold text-amber-300">รหัสนักเรียน</td>
                        <td className="py-2 px-3 text-rose-400 font-medium">จำเป็น*</td>
                        <td className="py-2 px-3 font-mono">10001</td>
                        <td className="py-2 px-3 text-slate-400">รหัสประจำตัว หรือเลขสแกน QR Code</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono font-bold text-amber-300">ชื่อ-นามสกุล</td>
                        <td className="py-2 px-3 text-rose-400 font-medium">จำเป็น*</td>
                        <td className="py-2 px-3">เด็กชายธนภัทร รัตนเวช</td>
                        <td className="py-2 px-3 text-slate-400">ชื่อและนามสกุลเต็มของนักเรียน</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono text-slate-200">ชื่อเล่น</td>
                        <td className="py-2 px-3 text-slate-500">ไม่จำเป็น</td>
                        <td className="py-2 px-3">ภัทร</td>
                        <td className="py-2 px-3 text-slate-400">ชื่อเล่นสำหรับแสดงผล</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono text-slate-200">ระดับชั้น</td>
                        <td className="py-2 px-3 text-slate-400">แนะนำ</td>
                        <td className="py-2 px-3">ม.1</td>
                        <td className="py-2 px-3 text-slate-400">ระดับชั้นเรียน เช่น ม.1, ป.6</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono text-slate-200">ห้อง</td>
                        <td className="py-2 px-3 text-slate-500">ไม่จำเป็น</td>
                        <td className="py-2 px-3">1</td>
                        <td className="py-2 px-3 text-slate-400">เลขห้องเรียน</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono text-slate-200">เลขที่</td>
                        <td className="py-2 px-3 text-slate-500">ไม่จำเป็น</td>
                        <td className="py-2 px-3">5</td>
                        <td className="py-2 px-3 text-slate-400">เลขที่นั่งในห้อง</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono text-slate-200">หอพัก</td>
                        <td className="py-2 px-3 text-slate-400">แนะนำ</td>
                        <td className="py-2 px-3">หอ A</td>
                        <td className="py-2 px-3 text-slate-400">ชื่อหอพักหรือที่อยู่หลัก</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono text-slate-200">สายรถ</td>
                        <td className="py-2 px-3 text-slate-400">แนะนำ</td>
                        <td className="py-2 px-3 font-semibold text-emerald-400">CAR01</td>
                        <td className="py-2 px-3 text-slate-400">รหัสสายรถ เช่น CAR01, CAR02</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono text-slate-200">จุดขึ้นรถ</td>
                        <td className="py-2 px-3 text-slate-500">ไม่จำเป็น</td>
                        <td className="py-2 px-3">จุดรับส่งหน้าหอ A</td>
                        <td className="py-2 px-3 text-slate-400">จุดจอดรับส่งนักเรียน</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono text-slate-200">ชื่อผู้ปกครอง</td>
                        <td className="py-2 px-3 text-slate-500">ไม่จำเป็น</td>
                        <td className="py-2 px-3">คุณสมศักดิ์ รัตนเวช</td>
                        <td className="py-2 px-3 text-slate-400">ชื่อผู้ปกครองหรือเบอร์ติดต่อฉุกเฉิน</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono text-slate-200">เบอร์โทรผู้ปกครอง</td>
                        <td className="py-2 px-3 text-slate-400">แนะนำ</td>
                        <td className="py-2 px-3 font-mono">081-234-5678</td>
                        <td className="py-2 px-3 text-slate-400">เบอร์โทรศัพท์สำหรับโทรออกหรือแจ้งเตือน</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono text-slate-200">สถานะ</td>
                        <td className="py-2 px-3 text-slate-500">ไม่จำเป็น</td>
                        <td className="py-2 px-3">ปกติ</td>
                        <td className="py-2 px-3 text-slate-400">สถานะนักเรียน เช่น ปกติ, ลา</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
