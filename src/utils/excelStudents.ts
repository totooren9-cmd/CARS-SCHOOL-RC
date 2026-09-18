import * as XLSX from 'xlsx';
import { Student, ScanRecord } from '../types';

/**
 * Sample template rows for student import
 */
const TEMPLATE_SAMPLE_ROWS = [
  {
    'รหัสนักเรียน': '10001',
    'ชื่อ-นามสกุล': 'เด็กชายธนภัทร รัตนเวช',
    'ชื่อเล่น': 'ภัทร',
    'ระดับชั้น': 'ม.1',
    'ห้อง': '1',
    'เลขที่': '1',
    'หอพัก': 'หอ A',
    'สายรถ': 'CAR01',
    'จุดขึ้นรถ': 'จุดรับส่งหน้าหอ A',
    'ชื่อผู้ปกครอง': 'คุณสมศักดิ์ รัตนเวช',
    'เบอร์โทรผู้ปกครอง': '081-234-5678',
    'สถานะ': 'ปกติ',
  },
  {
    'รหัสนักเรียน': '10002',
    'ชื่อ-นามสกุล': 'เด็กหญิงกัญญาณัฐ วงศ์วิจิตร',
    'ชื่อเล่น': 'ปลาย',
    'ระดับชั้น': 'ม.1',
    'ห้อง': '1',
    'เลขที่': '2',
    'หอพัก': 'หอ B',
    'สายรถ': 'CAR02',
    'จุดขึ้นรถ': 'ซุ้มประตูโรงเรียน',
    'ชื่อผู้ปกครอง': 'คุณรัตนา วงศ์วิจิตร',
    'เบอร์โทรผู้ปกครอง': '089-876-5432',
    'สถานะ': 'ปกติ',
  },
  {
    'รหัสนักเรียน': '10003',
    'ชื่อ-นามสกุล': 'เด็กชายชินดนัย เมธากุล',
    'ชื่อเล่น': 'ชิน',
    'ระดับชั้น': 'ม.2',
    'ห้อง': '2',
    'เลขที่': '5',
    'หอพัก': 'หอ C',
    'สายรถ': 'CAR03',
    'จุดขึ้นรถ': 'อาคาร 4 โดมกีฬา',
    'ชื่อผู้ปกครอง': 'คุณกฤษดา เมธากุล',
    'เบอร์โทรผู้ปกครอง': '086-555-1234',
    'สถานะ': 'ปกติ',
  },
  {
    'รหัสนักเรียน': '10004',
    'ชื่อ-นามสกุล': 'เด็กหญิงวรินทร จินดารัตน์',
    'ชื่อเล่น': 'มิ้นท์',
    'ระดับชั้น': 'ม.3',
    'ห้อง': '1',
    'เลขที่': '10',
    'หอพัก': 'หอ A',
    'สายรถ': 'CAR01',
    'จุดขึ้นรถ': 'ศาลาหน้าหอพัก A',
    'ชื่อผู้ปกครอง': 'คุณสุดา จินดารัตน์',
    'เบอร์โทรผู้ปกครอง': '084-333-9876',
    'สถานะ': 'ปกติ',
  },
  {
    'รหัสนักเรียน': '10005',
    'ชื่อ-นามสกุล': 'เด็กชายณภัทร ปัญญาวงศ์',
    'ชื่อเล่น': 'เจแปน',
    'ระดับชั้น': 'ม.4',
    'ห้อง': '3',
    'เลขที่': '14',
    'หอพัก': 'หอ B',
    'สายรถ': 'CAR02',
    'จุดขึ้นรถ': 'จุดรวมพลเสาธง',
    'ชื่อผู้ปกครอง': 'คุณณัฐวุฒิ ปัญญาวงศ์',
    'เบอร์โทรผู้ปกครอง': '082-999-4455',
    'สถานะ': 'ปกติ',
  },
];

const AVATAR_COLORS = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-purple-500',
  'bg-sky-500',
];

/**
 * Export sample template for student import
 */
export function exportStudentTemplateXLSX(): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(TEMPLATE_SAMPLE_ROWS);

  // Set column widths
  ws['!cols'] = [
    { wch: 14 }, // รหัสนักเรียน
    { wch: 28 }, // ชื่อ-นามสกุล
    { wch: 12 }, // ชื่อเล่น
    { wch: 12 }, // ระดับชั้น
    { wch: 8 },  // ห้อง
    { wch: 8 },  // เลขที่
    { wch: 12 }, // หอพัก
    { wch: 12 }, // สายรถ
    { wch: 24 }, // จุดขึ้นรถ
    { wch: 24 }, // ชื่อผู้ปกครอง
    { wch: 16 }, // เบอร์โทรผู้ปกครอง
    { wch: 10 }, // สถานะ
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'แม่แบบนักเรียน');
  XLSX.writeFile(wb, 'student_import_template.xlsx');
}

/**
 * Export sample template as CSV
 */
export function exportStudentTemplateCSV(): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(TEMPLATE_SAMPLE_ROWS);
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, 'student_import_template.csv');
}

/**
 * Export current students list to Excel file
 */
export function exportStudentsToXLSX(students: Student[], filename = 'students_export.xlsx'): void {
  const rows = students.map((s, index) => ({
    'ลำดับ': index + 1,
    'รหัสนักเรียน': s.studentCode || s.id,
    'ชื่อ-นามสกุล': s.name,
    'ชื่อเล่น': s.nickname || '',
    'ระดับชั้น': s.grade || s.className || '',
    'ห้อง': s.room || s.classroom || '',
    'เลขที่': s.number || '',
    'หอพัก': s.dorm || '',
    'สายรถ': s.busNumber || s.carID || '',
    'จุดขึ้นรถ': s.pickup || s.busStopName || s.dormOrStop || '',
    'ชื่อผู้ปกครอง': s.parent || '',
    'เบอร์โทรผู้ปกครอง': s.parentPhone || '',
    'สถานะ': s.status || 'ปกติ',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  ws['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 28 },
    { wch: 12 },
    { wch: 12 },
    { wch: 8 },
    { wch: 8 },
    { wch: 12 },
    { wch: 14 },
    { wch: 26 },
    { wch: 24 },
    { wch: 16 },
    { wch: 10 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'รายชื่อนักเรียน');
  XLSX.writeFile(wb, filename);
}

/**
 * Export filtered scan report to Excel (.xlsx) file
 */
export function exportScansToXLSX(scans: ScanRecord[], filename = 'scan_report.xlsx'): void {
  const rows = scans.map((s, idx) => ({
    'ลำดับ': idx + 1,
    'วันที่': s.dateThai || '',
    'เวลา': s.timeThai || '',
    'รหัสนักเรียน': s.studentCode || '',
    'ชื่อ-นามสกุล': s.name || '',
    'ระดับชั้น': s.grade || '',
    'สายรถ': s.busNumber || s.carID || '',
    'สถานะ': s.scanType || 'ขึ้นรถ',
    'จุดสแกน': s.locationName || s.dorm || '',
    'ละติจูด': s.latitude ?? '',
    'ลองจิจูด': s.longitude ?? '',
    'ผู้บันทึก': s.scannerName || 'เจ้าหน้าที่',
    'อุปกรณ์': s.device || 'MOBILE01',
    'หมายเหตุ': s.note || '',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 26 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 24 },
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
    { wch: 14 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'รายงานการสแกน');
  XLSX.writeFile(wb, filename);
}

/**
 * Helper to normalize string for flexible header matching
 */
function cleanKey(key: string): string {
  return String(key || '').toLowerCase().replace(/[\s\-_()\[\]*]/g, '');
}

/**
 * Parse an Excel or CSV file buffer into Student objects
 */
export async function parseStudentExcelFile(
  file: File
): Promise<{ students: Student[]; errors: string[]; rawCount: number }> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });

  if (!wb.SheetNames || wb.SheetNames.length === 0) {
    throw new Error('ไม่พบข้อมูล Sheet ในไฟล์ Excel');
  }

  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const students: Student[] = [];
  const errors: string[] = [];

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2; // account for header row

    // Find columns flexibly
    let studentCode = '';
    let name = '';
    let nickname = '';
    let grade = '';
    let room = '';
    let number = '';
    let dorm = '';
    let busNumber = '';
    let pickup = '';
    let parent = '';
    let parentPhone = '';
    let status = 'ปกติ';

    for (const [key, val] of Object.entries(row)) {
      const k = cleanKey(key);
      const strVal = String(val ?? '').trim();
      if (!strVal) continue;

      if (
        k.includes('รหัส') ||
        k.includes('studentcode') ||
        k.includes('stdcode') ||
        k === 'code' ||
        k === 'id'
      ) {
        studentCode = strVal;
      } else if (
        k.includes('ชื่อนามสกุล') ||
        k.includes('ชื่อสกุล') ||
        k.includes('fullname') ||
        k.includes('studentname') ||
        k === 'ชื่อ' ||
        k === 'name'
      ) {
        name = strVal;
      } else if (k.includes('ชื่อเล่น') || k.includes('nickname') || k === 'nick') {
        nickname = strVal;
      } else if (
        k.includes('ระดับชั้น') ||
        k.includes('ชั้น') ||
        k.includes('grade') ||
        k.includes('level')
      ) {
        grade = strVal;
      } else if (k.includes('ห้อง') || k.includes('room') || k.includes('classroom')) {
        room = strVal;
      } else if (k.includes('เลขที่') || k.includes('number') || k === 'no') {
        number = strVal;
      } else if (k.includes('หอพัก') || k.includes('หอ') || k.includes('dorm')) {
        dorm = strVal;
      } else if (
        k.includes('สายรถ') ||
        k.includes('รถบัส') ||
        k.includes('รถ') ||
        k.includes('bus') ||
        k.includes('carid') ||
        k.includes('busnumber')
      ) {
        busNumber = strVal;
      } else if (
        k.includes('จุดขึ้นรถ') ||
        k.includes('จุดรับส่ง') ||
        k.includes('จุดขึ้น') ||
        k.includes('สถานที่') ||
        k.includes('pickup') ||
        k.includes('stop')
      ) {
        pickup = strVal;
      } else if (k.includes('ผู้ปกครอง') || k.includes('parent') || k.includes('guardian')) {
        parent = strVal;
      } else if (
        k.includes('เบอร์') ||
        k.includes('โทร') ||
        k.includes('phone') ||
        k.includes('tel') ||
        k.includes('mobile')
      ) {
        parentPhone = strVal;
      } else if (k.includes('สถานะ') || k.includes('status')) {
        status = strVal;
      }
    }

    // Validation
    if (!name && !studentCode) {
      // Empty row, skip silently
      return;
    }

    if (!name) {
      errors.push(`แถวที่ ${rowNum}: ไม่มีข้อมูลชื่อ-นามสกุล (ข้ามแถวนี้)`);
      return;
    }

    if (!studentCode) {
      // Auto-generate code if missing
      studentCode = `AUTO${Date.now().toString().slice(-4)}${idx}`;
    }

    const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
    const normalizedCar = busNumber.toUpperCase().startsWith('CAR')
      ? busNumber.toUpperCase()
      : busNumber || 'CAR01';

    const fullClassName = grade && room ? `${grade}/${room}` : grade || 'ม.1';

    const student: Student = {
      id: studentCode,
      studentCode,
      name,
      nickname,
      grade: grade || 'ม.1',
      room,
      classroom: fullClassName,
      className: fullClassName,
      number,
      dorm: dorm || 'หอ A',
      carID: normalizedCar,
      busNumber: normalizedCar,
      dormOrStop: pickup || 'จุดรับส่งหน้าโรงเรียน',
      busStopName: pickup || 'จุดรับส่งหน้าโรงเรียน',
      pickup: pickup || 'จุดรับส่งหน้าโรงเรียน',
      parent,
      parentPhone: parentPhone || '-',
      status: status || 'ปกติ',
      avatarColor: color,
      avatar: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(studentCode)}`,
      avatarUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(studentCode)}`,
    };

    students.push(student);
  });

  return {
    students,
    errors,
    rawCount: rawRows.length,
  };
}
