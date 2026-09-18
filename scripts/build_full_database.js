import fs from 'fs';
import path from 'path';

// Generate 300 students exactly matching the pattern in the prompt
const firstNames = [
  'ด.ช.อนุชา', 'ด.ญ.สุนีย์', 'ด.ช.ศิริพร', 'ด.ญ.ชลธิชา', 'ด.ช.กิตติ',
  'ด.ญ.อารีย์', 'ด.ช.ณัฐริกา', 'ด.ญ.กัลยา', 'ด.ช.ปิยะ', 'ด.ญ.ปรีชา',
  'ด.ช.ปาริชาติ', 'ด.ญ.ธิดารัตน์', 'ด.ช.มานะ', 'ด.ญ.ชัยวัฒน์', 'ด.ช.จันทร์เพ็ญ',
  'ด.ญ.อรทัย', 'ด.ช.พิมพ์ใจ', 'ด.ญ.วีระ', 'ด.ช.มาลี', 'ด.ญ.พิมพ์ชนก',
  'ด.ช.หนึ่งฤทัย', 'ด.ญ.ณัฐพล', 'ด.ช.ศุภชัย', 'ด.ญ.กมลชนก', 'ด.ช.วรรณา',
  'ด.ญ.สายไหม', 'ด.ช.ธนกร', 'ด.ญ.รัตนา', 'ด.ช.เบญจวรรณ', 'ด.ญ.สมชาย'
];

const lastNames = [
  'พฤกษ์ชาติ', 'วงศ์ไทย', 'อรุณรัตน์', 'ชัยชนะ', 'ทองคำ',
  'เรืองศรี', 'อินทรีย์', 'แสงทอง', 'สมบูรณ์', 'เกษมศรี',
  'บุญมี', 'เพชรรัตน์', 'มั่นคง', 'ศรีสุข', 'ดวงแก้ว',
  'เจริญสุข', 'รักเรียน', 'สายสมร', 'พูลสวัสดิ์', 'ใจดี'
];

const nicknames = ['โอ๊ต', 'มิ้นท์', 'แบม', 'พีช', 'แตงโม', 'ชาย'];

const dormCars = [
  { dorm: 'หอ A', car: 'CAR01', pickup: 'ประตูหลัง' },
  { dorm: 'หอ B', car: 'CAR02', pickup: 'หน้าโรงอาหาร' },
  { dorm: 'หอ C', car: 'CAR03', pickup: 'ลานจอดรถ' },
  { dorm: 'หอ D', car: 'CAR04', pickup: 'ประตูหน้า' },
  { dorm: 'หอ E', car: 'CAR05', pickup: 'ประตูหลัง' }
];

const grades = [
  { grade: 'ป.4', room: '2' },
  { grade: 'ม.1', room: '3' },
  { grade: 'ม.4', room: '1' },
  { grade: 'ป.1', room: '2' },
  { grade: 'ป.4', room: '3' },
  { grade: 'ม.1', room: '1' },
  { grade: 'ม.4', room: '2' },
  { grade: 'ป.1', room: '3' },
  { grade: 'ป.4', room: '1' },
  { grade: 'ม.1', room: '2' },
  { grade: 'ม.4', room: '3' },
  { grade: 'ป.1', room: '1' }
];

// Generate 300 students
const students = [];
for (let i = 1; i <= 300; i++) {
  const idNum = String(i).padStart(4, '0');
  const student_id = `STD${idNum}`;
  const idx = i - 1;
  const fn = firstNames[idx % firstNames.length];
  const ln = lastNames[idx % lastNames.length];
  const fullName = `${fn} ${ln}`;
  const nick = nicknames[idx % nicknames.length];
  const gr = grades[idx % grades.length];
  const dc = dormCars[idx % dormCars.length];
  const seatNum = ((idx % 40) + 1);
  const phone = `081${String(1000000 + i).slice(1)}`;
  const parentName = `ผู้ปกครอง ${ln}`;

  students.push({
    student_id,
    qr_code: student_id,
    name: fullName,
    nickname: nick,
    grade: gr.grade,
    room: gr.room,
    seat_number: seatNum,
    dorm: dc.dorm,
    car_id: dc.car,
    pickup_point: dc.pickup,
    parent_name: parentName,
    parent_phone: phone,
    status: 'ใช้งาน'
  });
}

// 5 Cars
const cars = [
  { car_id: 'CAR01', plate_number: '1กข 1234', name: 'รถคันที่ 1', route: 'หอ A', driver_name: 'นายสมชาย ใจดี', driver_phone: '081-111-1111', attendant_name: 'นางสาวเอ  รักเรียน', capacity: 60, status: 'ใช้งาน' },
  { car_id: 'CAR02', plate_number: '2กข 2345', name: 'รถคันที่ 2', route: 'หอ B', driver_name: 'นายวิชัย มั่นคง', driver_phone: '082-222-2222', attendant_name: 'นางสาวบี  ศรีสุข', capacity: 60, status: 'ใช้งาน' },
  { car_id: 'CAR03', plate_number: '3กข 3456', name: 'รถคันที่ 3', route: 'หอ C', driver_name: 'นายประเสริฐ ทองคำ', driver_phone: '083-333-3333', attendant_name: 'นางสาวซี  บุญมี', capacity: 60, status: 'ใช้งาน' },
  { car_id: 'CAR04', plate_number: '4กข 4567', name: 'รถคันที่ 4', route: 'หอ D', driver_name: 'นายอนุชา แสงทอง', driver_phone: '084-444-4444', attendant_name: 'นางสาวดี  พูลสุข', capacity: 60, status: 'ใช้งาน' },
  { car_id: 'CAR05', plate_number: '5กข 5678', name: 'รถคันที่ 5', route: 'หอ E', driver_name: 'นายธนกร วงศ์ไทย', driver_phone: '085-555-5555', attendant_name: 'นางสาวอี  จันทร์เพ็ญ', capacity: 60, status: 'ใช้งาน' }
];

// 3 Users
const users = [
  { user_id: 'U001', name: 'ผู้ดูแลระบบ', email: 'admin@example.com', role: 'Admin', car_id: 'ALL', status: 'ใช้งาน' },
  { user_id: 'U002', name: 'เจ้าหน้าที่รถ 1', email: 'staff1@example.com', role: 'Staff', car_id: 'CAR01', status: 'ใช้งาน' },
  { user_id: 'U003', name: 'ผู้บริหาร (ดูรายงาน)', email: 'viewer@example.com', role: 'Viewer', car_id: 'ALL', status: 'ใช้งาน' }
];

// 10 Settings
const settings = [
  { key: 'system_name', value: 'ระบบเช็คอินนักเรียนขึ้นรถ (QR Bus)', description: 'ชื่อระบบ' },
  { key: 'academic_year', value: '2569', description: 'ปีการศึกษา' },
  { key: 'car_count', value: '5', description: 'จำนวนรถ' },
  { key: 'prevent_duplicate_scan', value: 'YES', description: 'ป้องกันสแกนซ้ำ' },
  { key: 'duplicate_interval_minutes', value: '5', description: 'ระยะเวลาสแกนซ้ำ (นาที)' },
  { key: 'scan_start_time', value: '6:00', description: 'เวลาเริ่มสแกน' },
  { key: 'scan_end_time', value: '20:00', description: 'เวลาเลิกสแกน' },
  { key: 'auto_scan_mode', value: 'YES', description: 'โหมดสแกนอัตโนมัติ' },
  { key: 'default_scanner_role', value: 'เจ้าหน้าที่', description: 'ผู้สแกนเริ่มต้น' },
  { key: 'scanner_device_id', value: 'MOBILE01', description: 'รหัสเครื่องสแกน' }
];

// Sample scans generator for 2026-09-14 to 2026-09-18
const scans = [];
const scanDates = ['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18'];

scanDates.forEach((date, dIdx) => {
  // Morning check-in (ขึ้นรถ)
  students.slice(0, 45).forEach((stu, sIdx) => {
    const hour = '06';
    const min = String(20 + Math.floor(sIdx / 2)).padStart(2, '0');
    const sec = String((sIdx * 17) % 60).padStart(2, '0');
    const carObj = cars.find(c => c.car_id === stu.car_id) || cars[0];
    const scanId = `SC${date.replace(/-/g, '')}${String(100 + sIdx + 1)}`;

    scans.push({
      scan_id: scanId,
      scan_date: date,
      scan_time: `${hour}:${min}:${sec}`,
      student_id: stu.student_id,
      student_name: stu.name,
      car_id: stu.car_id,
      plate_number: carObj.plate_number,
      dorm: stu.dorm,
      scan_type: 'ขึ้นรถ',
      scanner_by: 'เจ้าหน้าที่',
      scanner_device: 'MOBILE01',
      scan_result: 'สำเร็จ',
      note: '',
      latitude: 13.7548 + (sIdx * 0.0002),
      longitude: 100.4982 + (sIdx * 0.0002)
    });
  });

  // Afternoon drop-off (ลงรถ)
  if (date !== '2026-09-18') {
    students.slice(0, 40).forEach((stu, sIdx) => {
      const hour = '16';
      const min = String(Math.floor(sIdx * 1.2)).padStart(2, '0');
      const sec = String((sIdx * 23) % 60).padStart(2, '0');
      const carObj = cars.find(c => c.car_id === stu.car_id) || cars[0];
      const scanId = `SC${date.replace(/-/g, '')}${String(200 + sIdx + 1)}`;

      scans.push({
        scan_id: scanId,
        scan_date: date,
        scan_time: `${hour}:${min}:${sec}`,
        student_id: stu.student_id,
        student_name: stu.name,
        car_id: stu.car_id,
        plate_number: carObj.plate_number,
        dorm: stu.dorm,
        scan_type: 'ลงรถ',
        scanner_by: 'เจ้าหน้าที่',
        scanner_device: 'MOBILE01',
        scan_result: 'สำเร็จ',
        note: '',
        latitude: 13.7548 + (sIdx * 0.0002),
        longitude: 100.4982 + (sIdx * 0.0002)
      });
    });
  }
});

// Build SQL
let sql = `-- ========================================================
-- SUPABASE POSTGRESQL SCHEMA & INITIAL SEED DATA
-- ระบบเช็คอินนักเรียนขึ้นรถโรงเรียน (QR School Bus Scanner)
-- รองรับเชื่อมต่อ Supabase 100% (No Mockup, Real Cloud Data)
-- ========================================================

-- 1. สร้างตาราง: cars (รถรับส่งนักเรียน 02_รถ)
CREATE TABLE IF NOT EXISTS public.cars (
    car_id TEXT PRIMARY KEY,
    plate_number TEXT NOT NULL,
    name TEXT NOT NULL,
    route TEXT,
    driver_name TEXT,
    driver_phone TEXT,
    attendant_name TEXT,
    capacity INTEGER DEFAULT 60,
    status TEXT DEFAULT 'ใช้งาน',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. สร้างตาราง: students (ข้อมูลนักเรียน 01_นักเรียน)
CREATE TABLE IF NOT EXISTS public.students (
    student_id TEXT PRIMARY KEY,
    qr_code TEXT NOT NULL,
    name TEXT NOT NULL,
    nickname TEXT,
    grade TEXT,
    room TEXT,
    seat_number INTEGER,
    dorm TEXT,
    car_id TEXT REFERENCES public.cars(car_id) ON DELETE SET NULL,
    pickup_point TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    map_link TEXT,
    parent_name TEXT,
    parent_phone TEXT,
    status TEXT DEFAULT 'ใช้งาน',
    qr_image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. สร้างตาราง: scans (บันทึกการสแกน 03_บันทึกการสแกน)
CREATE TABLE IF NOT EXISTS public.scans (
    scan_id TEXT PRIMARY KEY,
    scan_date DATE NOT NULL,
    scan_time TIME NOT NULL,
    student_id TEXT REFERENCES public.students(student_id) ON DELETE CASCADE,
    student_name TEXT,
    car_id TEXT REFERENCES public.cars(car_id) ON DELETE SET NULL,
    plate_number TEXT,
    dorm TEXT,
    scan_type TEXT NOT NULL DEFAULT 'ขึ้นรถ', -- 'ขึ้นรถ' หรือ 'ลงรถ'
    scanner_by TEXT DEFAULT 'เจ้าหน้าที่',
    scanner_device TEXT DEFAULT 'MOBILE01',
    scan_result TEXT DEFAULT 'สำเร็จ',
    note TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. สร้างตาราง: users (ผู้ใช้งาน 04_ผู้ใช้งาน)
CREATE TABLE IF NOT EXISTS public.users (
    user_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'Staff', -- 'Admin', 'Staff', 'Viewer'
    car_id TEXT DEFAULT 'ALL',
    status TEXT DEFAULT 'ใช้งาน',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. สร้างตาราง: settings (ตั้งค่าระบบ 05_ตั้งค่า)
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- สร้าง Indexes เพื่อความรวดเร็วในการสืบค้น
CREATE INDEX IF NOT EXISTS idx_students_car_id ON public.students(car_id);
CREATE INDEX IF NOT EXISTS idx_students_dorm ON public.students(dorm);
CREATE INDEX IF NOT EXISTS idx_scans_date ON public.scans(scan_date);
CREATE INDEX IF NOT EXISTS idx_scans_student_id ON public.scans(student_id);
CREATE INDEX IF NOT EXISTS idx_scans_car_id ON public.scans(car_id);

-- เปิด Row Level Security (RLS)
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- นโยบาย RLS (อนุญาต Anonymous & Authenticated ให้อ่านและบันทึกได้สะดวก 100%)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public cars access" ON public.cars;
    CREATE POLICY "Public cars access" ON public.cars FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public students access" ON public.students;
    CREATE POLICY "Public students access" ON public.students FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public scans access" ON public.scans;
    CREATE POLICY "Public scans access" ON public.scans FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public users access" ON public.users;
    CREATE POLICY "Public users access" ON public.users FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public settings access" ON public.settings;
    CREATE POLICY "Public settings access" ON public.settings FOR ALL USING (true) WITH CHECK (true);
END $$;

-- เปิดใช้งาน Realtime สำหรับตาราง scans และ students
ALTER PUBLICATION supabase_realtime ADD TABLE public.scans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;

-- ========================================================
-- INSERT ข้อมูลรถรับส่ง (02_รถ)
-- ========================================================
INSERT INTO public.cars (car_id, plate_number, name, route, driver_name, driver_phone, attendant_name, capacity, status)
VALUES
` + cars.map(c => `('${c.car_id}', '${c.plate_number}', '${c.name}', '${c.route}', '${c.driver_name}', '${c.driver_phone}', '${c.attendant_name}', ${c.capacity}, '${c.status}')`).join(',\n') + `
ON CONFLICT (car_id) DO UPDATE SET
    plate_number = EXCLUDED.plate_number,
    name = EXCLUDED.name,
    route = EXCLUDED.route,
    driver_name = EXCLUDED.driver_name,
    driver_phone = EXCLUDED.driver_phone,
    attendant_name = EXCLUDED.attendant_name,
    capacity = EXCLUDED.capacity,
    status = EXCLUDED.status;

-- ========================================================
-- INSERT ข้อมูลผู้ใช้งาน (04_ผู้ใช้งาน)
-- ========================================================
INSERT INTO public.users (user_id, name, email, role, car_id, status)
VALUES
` + users.map(u => `('${u.user_id}', '${u.name}', '${u.email}', '${u.role}', '${u.car_id}', '${u.status}')`).join(',\n') + `
ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    car_id = EXCLUDED.car_id,
    status = EXCLUDED.status;

-- ========================================================
-- INSERT ข้อมูลตั้งค่า (05_ตั้งค่า)
-- ========================================================
INSERT INTO public.settings (key, value, description)
VALUES
` + settings.map(s => `('${s.key}', '${s.value}', '${s.description}')`).join(',\n') + `
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ========================================================
-- INSERT ข้อมูลนักเรียน 300 คน (STD0001 - STD0300)
-- ========================================================
INSERT INTO public.students (student_id, qr_code, name, nickname, grade, room, seat_number, dorm, car_id, pickup_point, parent_name, parent_phone, status)
VALUES
` + students.map(s => `('${s.student_id}', '${s.qr_code}', '${s.name}', '${s.nickname}', '${s.grade}', '${s.room}', ${s.seat_number}, '${s.dorm}', '${s.car_id}', '${s.pickup_point}', '${s.parent_name}', '${s.parent_phone}', '${s.status}')`).join(',\n') + `
ON CONFLICT (student_id) DO UPDATE SET
    name = EXCLUDED.name,
    nickname = EXCLUDED.nickname,
    grade = EXCLUDED.grade,
    room = EXCLUDED.room,
    seat_number = EXCLUDED.seat_number,
    dorm = EXCLUDED.dorm,
    car_id = EXCLUDED.car_id,
    pickup_point = EXCLUDED.pickup_point,
    parent_name = EXCLUDED.parent_name,
    parent_phone = EXCLUDED.parent_phone,
    status = EXCLUDED.status;

-- ========================================================
-- INSERT บันทึกการสแกนตัวอย่าง
-- ========================================================
INSERT INTO public.scans (scan_id, scan_date, scan_time, student_id, student_name, car_id, plate_number, dorm, scan_type, scanner_by, scanner_device, scan_result, latitude, longitude)
VALUES
` + scans.map(sc => `('${sc.scan_id}', '${sc.scan_date}', '${sc.scan_time}', '${sc.student_id}', '${sc.student_name}', '${sc.car_id}', '${sc.plate_number}', '${sc.dorm}', '${sc.scan_type}', '${sc.scanner_by}', '${sc.scanner_device}', '${sc.scan_result}', ${sc.latitude}, ${sc.longitude})`).join(',\n') + `
ON CONFLICT (scan_id) DO NOTHING;
`;

// Write supabase_schema.sql
fs.writeFileSync(path.resolve(process.cwd(), 'supabase_schema.sql'), sql, 'utf8');

// Also write to public/supabase_schema.sql so user can download from browser
const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
fs.writeFileSync(path.resolve(publicDir, 'supabase_schema.sql'), sql, 'utf8');

// Write src/data/supabaseSeed.ts
const seedCars = cars.map(c => ({
  carID: c.car_id,
  plate: c.plate_number,
  name: c.name,
  route: c.route,
  driver: c.driver_name,
  driverPhone: c.driver_phone,
  attendant: c.attendant_name,
  capacity: c.capacity,
  status: c.status
}));

const seedStudents = students.map(s => ({
  id: s.student_id,
  studentCode: s.student_id,
  name: s.name,
  nickname: s.nickname,
  grade: s.grade,
  classroom: s.grade + '/' + s.room,
  className: s.grade + '/' + s.room,
  room: s.room,
  number: s.seat_number,
  dorm: s.dorm,
  carID: s.car_id,
  plate: cars.find(c => c.car_id === s.car_id)?.plate_number || 'กข-1234',
  busNumber: s.car_id,
  dormOrStop: s.dorm,
  pickup: s.pickup_point,
  parent: s.parent_name,
  parentPhone: s.parent_phone,
  status: s.status,
  avatarColor: s.dorm === 'หอ A' ? 'bg-indigo-500' : s.dorm === 'หอ B' ? 'bg-blue-500' : s.dorm === 'หอ C' ? 'bg-amber-500' : s.dorm === 'หอ D' ? 'bg-emerald-500' : 'bg-rose-500',
  qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + encodeURIComponent(s.student_id)
}));

const seedScans = scans.slice(0, 150).map(sc => ({
  id: sc.scan_id,
  scanId: sc.scan_id,
  timestamp: new Date(sc.scan_date + 'T' + sc.scan_time).getTime(),
  dateThai: sc.scan_date,
  timeThai: sc.scan_time + ' น.',
  studentId: sc.student_id,
  studentCode: sc.student_id,
  name: sc.student_name,
  grade: 'ม.1',
  dorm: sc.dorm,
  carID: sc.car_id,
  plate: sc.plate_number,
  busNumber: sc.car_id,
  locationName: sc.dorm,
  latitude: sc.latitude,
  longitude: sc.longitude,
  scanSource: 'camera',
  status: 'success',
  scanType: sc.scan_type,
  scannerName: sc.scanner_by,
  device: sc.scanner_device
}));

const tsSeed = `// Auto-generated Supabase Seed Data (300 Students, 5 Cars, Settings, Users, Scans)
import { Student, Car, ScanRecord } from '../types';

export const SUPABASE_CARS: Car[] = ${JSON.stringify(seedCars, null, 2)};

export const SUPABASE_STUDENTS: Student[] = ${JSON.stringify(seedStudents, null, 2)};

export const SUPABASE_SCANS: ScanRecord[] = ${JSON.stringify(seedScans, null, 2)};

export const SUPABASE_USERS = ${JSON.stringify(users, null, 2)};

export const SUPABASE_SETTINGS = ${JSON.stringify(settings, null, 2)};
`;

fs.writeFileSync(path.resolve(process.cwd(), 'src/data/supabaseSeed.ts'), tsSeed, 'utf8');

console.log('Successfully generated supabase_schema.sql and src/data/supabaseSeed.ts with 300 students!');
