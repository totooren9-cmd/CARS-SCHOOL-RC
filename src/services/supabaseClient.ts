import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Student, Car, ScanRecord } from '../types';
import { SUPABASE_STUDENTS, SUPABASE_CARS, SUPABASE_SCANS } from '../data/supabaseSeed';

// LocalStorage Keys for persistent client-side configuration
const STORAGE_KEY_URL = 'qr_bus_supabase_url';
const STORAGE_KEY_KEY = 'qr_bus_supabase_anon_key';

// Default / fallback demo URL if needed or environment variables
export function getStoredSupabaseConfig(): { url: string; anonKey: string } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  const localUrl = (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : '') || '';
  const localKey = (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) : '') || '';

  return {
    url: localUrl || envUrl,
    anonKey: localKey || envKey,
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
    cachedClient = null; // reset cached instance
  }
}

export function clearSupabaseConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_KEY);
    cachedClient = null;
  }
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getStoredSupabaseConfig();
  if (!url || !anonKey) {
    return null;
  }

  if (!cachedClient) {
    try {
      cachedClient = createClient(url, anonKey, {
        auth: { persistSession: true },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return cachedClient;
}

export function isSupabaseConnected(): boolean {
  const { url, anonKey } = getStoredSupabaseConfig();
  return Boolean(url && anonKey);
}

// Test connectivity to Supabase
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  studentCount?: number;
  carCount?: number;
  scanCount?: number;
  scansTableReady?: boolean;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'กรุณาระบุ Supabase Project URL และ Anon Key เพื่อเชื่อมต่อฐานข้อมูล',
    };
  }

  try {
    const [stuRes, carRes, scanRes] = await Promise.all([
      client.from('students').select('student_id', { count: 'exact', head: true }),
      client.from('cars').select('car_id', { count: 'exact', head: true }),
      client.from('scans').select('scan_id', { count: 'exact', head: true }),
    ]);

    if (stuRes.error && stuRes.error.code === '42P01') {
      return {
        success: false,
        message: 'เชื่อมต่อ Supabase สำเร็จ แต่ยังไม่พบตาราง public.students! กรุณารันโค้ด SQL จากแท็บ Supabase SQL ใน Supabase SQL Editor ก่อน',
      };
    }

    if (scanRes.error && scanRes.error.code === '42P01') {
      return {
        success: false,
        message: 'เชื่อมต่อสำเร็จ แต่ยังไม่พบตาราง public.scans! ให้รันคำสั่ง SQL สร้างตาราง scans ใน Supabase ก่อน เพื่อบันทึกการสแกนได้จริง',
        studentCount: stuRes.count || 0,
        carCount: carRes.count || 0,
        scansTableReady: false,
      };
    }

    if (scanRes.error && (scanRes.error.code === '42501' || scanRes.error.message?.includes('policy'))) {
      return {
        success: false,
        message: 'ตาราง public.scans ติดนโยบายความปลอดภัย RLS! กรุณาเพิ่ม Policy "Public scans access" ใน Supabase',
        studentCount: stuRes.count || 0,
        carCount: carRes.count || 0,
        scansTableReady: false,
      };
    }

    if (stuRes.error) {
      return {
        success: false,
        message: `ข้อผิดพลาดตารางนักเรียน: ${stuRes.error.message}`,
      };
    }

    return {
      success: true,
      message: 'เชื่อมต่อฐานข้อมูล Supabase และตารางสแกนสำเร็จ 100%!',
      studentCount: stuRes.count || 0,
      carCount: carRes.count || 0,
      scanCount: scanRes.count || 0,
      scansTableReady: true,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `ไม่สามารถเชื่อมต่อ Supabase ได้: ${msg}`,
    };
  }
}

// Helper to map DB row to Student model
function mapStudentRow(s: Record<string, unknown>): Student {
  const studentId = String(s.student_id || '');
  const grade = String(s.grade || 'ม.1');
  const room = String(s.room || '1');
  const dorm = String(s.dorm || 'หอ A');
  const carId = String(s.car_id || 'CAR01');
  const nickname = s.nickname ? String(s.nickname) : undefined;
  const parentName = s.parent_name ? String(s.parent_name) : undefined;
  const pickupPoint = s.pickup_point ? String(s.pickup_point) : undefined;
  const seatNumber = s.seat_number ? Number(s.seat_number) : undefined;

  let avatarColor = 'bg-indigo-500';
  if (dorm.includes('B')) avatarColor = 'bg-blue-500';
  else if (dorm.includes('C')) avatarColor = 'bg-amber-500';
  else if (dorm.includes('D')) avatarColor = 'bg-emerald-500';
  else if (dorm.includes('E')) avatarColor = 'bg-rose-500';

  return {
    id: studentId,
    studentCode: studentId,
    name: String(s.name || ''),
    nickname,
    grade,
    classroom: `${grade}/${room}`,
    className: `${grade}/${room}`,
    room,
    number: seatNumber,
    dorm,
    carID: carId,
    plate: '1กข 1234',
    busNumber: carId,
    dormOrStop: pickupPoint || dorm,
    busStopName: pickupPoint || dorm,
    pickup: pickupPoint,
    parent: parentName,
    parentPhone: String(s.parent_phone || '0810000000'),
    status: String(s.status || 'ใช้งาน'),
    avatarColor,
    qrUrl: String(
      s.qr_image ||
        `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(studentId)}`
    ),
  };
}

// ==========================================
// 1. STUDENTS CRUD (SELECT, INSERT, UPDATE, DELETE)
// ==========================================

// SELECT: Fetch Students from Supabase
export async function fetchStudentsFromSupabase(): Promise<{ success: boolean; data: Student[]; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, data: SUPABASE_STUDENTS, error: 'No client configured' };
  }

  try {
    const { data, error } = await client
      .from('students')
      .select('*')
      .order('student_id', { ascending: true });

    if (error) {
      console.warn('Supabase fetch students error:', error);
      return { success: false, data: SUPABASE_STUDENTS, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: true, data: [] };
    }

    const mappedStudents: Student[] = data.map(mapStudentRow);
    return { success: true, data: mappedStudents };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Failed to fetch students from Supabase:', err);
    return { success: false, data: SUPABASE_STUDENTS, error: msg };
  }
}

// INSERT: Add Student to Supabase
export async function insertStudentToSupabase(student: Student): Promise<{ success: boolean; error?: string; data?: Student }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'ยังไม่ได้เชื่อมต่อ Supabase' };
  }

  try {
    const studentId = (student.studentCode || student.id || `STD${Date.now()}`).trim();
    const grade = student.grade || 'ม.1';
    let room = student.room || '1';
    if (student.className && student.className.includes('/')) {
      room = student.className.split('/')[1] || room;
    }

    const row = {
      student_id: studentId,
      qr_code: studentId,
      name: student.name.trim(),
      nickname: student.nickname?.trim() || null,
      grade: grade,
      room: room,
      seat_number: student.number ? Number(student.number) : null,
      dorm: student.dorm || student.dormOrStop || 'หอ A',
      car_id: student.carID || student.busNumber || 'CAR01',
      pickup_point: student.pickup || student.busStopName || student.dormOrStop || 'จุดรับส่งหน้าโรงเรียน',
      parent_name: student.parent || null,
      parent_phone: student.parentPhone || '0810000000',
      status: student.status || 'ใช้งาน',
      qr_image:
        student.qrUrl ||
        `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(studentId)}`,
    };

    const { data, error } = await client.from('students').insert([row]).select().single();
    if (error) {
      console.error('Insert student error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data ? mapStudentRow(data) : undefined };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// UPDATE: Edit Student in Supabase
export async function updateStudentInSupabase(student: Student): Promise<{ success: boolean; error?: string; data?: Student }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'ยังไม่ได้เชื่อมต่อ Supabase' };
  }

  try {
    const studentId = (student.studentCode || student.id).trim();
    const grade = student.grade || 'ม.1';
    let room = student.room || '1';
    if (student.className && student.className.includes('/')) {
      room = student.className.split('/')[1] || room;
    }

    const row = {
      name: student.name.trim(),
      nickname: student.nickname?.trim() || null,
      grade: grade,
      room: room,
      seat_number: student.number ? Number(student.number) : null,
      dorm: student.dorm || student.dormOrStop || 'หอ A',
      car_id: student.carID || student.busNumber || 'CAR01',
      pickup_point: student.pickup || student.busStopName || student.dormOrStop || null,
      parent_name: student.parent || null,
      parent_phone: student.parentPhone || '0810000000',
      status: student.status || 'ใช้งาน',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('students')
      .update(row)
      .eq('student_id', studentId)
      .select()
      .single();

    if (error) {
      console.error('Update student error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data ? mapStudentRow(data) : undefined };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// DELETE: Delete Student from Supabase
export async function deleteStudentFromSupabase(studentId: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'ยังไม่ได้เชื่อมต่อ Supabase' };
  }

  try {
    const { error } = await client.from('students').delete().eq('student_id', studentId.trim());
    if (error) {
      console.error('Delete student error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// ==========================================
// 2. CARS CRUD (SELECT, INSERT, UPDATE, DELETE)
// ==========================================

function mapCarRow(c: Record<string, unknown>): Car {
  return {
    carID: String(c.car_id || ''),
    plate: String(c.plate_number || ''),
    name: String(c.name || ''),
    route: String(c.route || ''),
    driver: String(c.driver_name || ''),
    driverPhone: String(c.driver_phone || ''),
    attendant: String(c.attendant_name || ''),
    capacity: Number(c.capacity || 60),
    status: String(c.status || 'ใช้งาน'),
  };
}

// SELECT: Fetch Cars from Supabase
export async function fetchCarsFromSupabase(): Promise<{ success: boolean; data: Car[]; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, data: SUPABASE_CARS, error: 'No client configured' };
  }

  try {
    const { data, error } = await client
      .from('cars')
      .select('*')
      .order('car_id', { ascending: true });

    if (error) {
      console.warn('Supabase fetch cars error:', error);
      return { success: false, data: SUPABASE_CARS, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: true, data: [] };
    }

    const mappedCars: Car[] = data.map(mapCarRow);
    return { success: true, data: mappedCars };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Failed to fetch cars from Supabase:', err);
    return { success: false, data: SUPABASE_CARS, error: msg };
  }
}

// INSERT: Add Car to Supabase
export async function insertCarToSupabase(car: Car): Promise<{ success: boolean; error?: string; data?: Car }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'ยังไม่ได้เชื่อมต่อ Supabase' };
  }

  try {
    const row = {
      car_id: car.carID.trim(),
      plate_number: car.plate.trim(),
      name: car.name.trim(),
      route: car.route?.trim() || null,
      driver_name: car.driver?.trim() || null,
      driver_phone: car.driverPhone?.trim() || null,
      attendant_name: car.attendant?.trim() || null,
      capacity: Number(car.capacity) || 60,
      status: car.status || 'ใช้งาน',
    };

    const { data, error } = await client.from('cars').insert([row]).select().single();
    if (error) {
      console.error('Insert car error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data ? mapCarRow(data) : undefined };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// UPDATE: Edit Car in Supabase
export async function updateCarInSupabase(car: Car): Promise<{ success: boolean; error?: string; data?: Car }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'ยังไม่ได้เชื่อมต่อ Supabase' };
  }

  try {
    const row = {
      plate_number: car.plate.trim(),
      name: car.name.trim(),
      route: car.route?.trim() || null,
      driver_name: car.driver?.trim() || null,
      driver_phone: car.driverPhone?.trim() || null,
      attendant_name: car.attendant?.trim() || null,
      capacity: Number(car.capacity) || 60,
      status: car.status || 'ใช้งาน',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('cars')
      .update(row)
      .eq('car_id', car.carID.trim())
      .select()
      .single();

    if (error) {
      console.error('Update car error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data ? mapCarRow(data) : undefined };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// DELETE: Delete Car from Supabase
export async function deleteCarFromSupabase(carId: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'ยังไม่ได้เชื่อมต่อ Supabase' };
  }

  try {
    const { error } = await client.from('cars').delete().eq('car_id', carId.trim());
    if (error) {
      console.error('Delete car error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// ==========================================
// 3. SCANS CRUD (SELECT, INSERT, DELETE, CLEAR)
// ==========================================

function mapScanRow(sc: Record<string, unknown>): ScanRecord {
  const scanDate = String(sc.scan_date || '');
  const scanTime = String(sc.scan_time || '');
  const studentId = String(sc.student_id || '');
  const dateObj = new Date(`${scanDate}T${scanTime}`);
  const timestamp = isNaN(dateObj.getTime()) ? Date.now() : dateObj.getTime();

  return {
    id: String(sc.scan_id || `sc-${Date.now()}`),
    scanId: String(sc.scan_id || `sc-${Date.now()}`),
    timestamp: timestamp,
    dateThai: scanDate,
    timeThai: `${scanTime} น.`,
    time: `${scanTime} น.`,
    studentId: studentId,
    studentCode: studentId,
    name: String(sc.student_name || 'นักเรียน'),
    grade: 'ม.1',
    dorm: sc.dorm ? String(sc.dorm) : undefined,
    carID: sc.car_id ? String(sc.car_id) : undefined,
    plate: sc.plate_number ? String(sc.plate_number) : undefined,
    busNumber: String(sc.car_id || 'CAR01'),
    locationName: String(sc.dorm || 'จุดรับส่ง'),
    latitude: sc.latitude ? Number(sc.latitude) : 13.7548,
    longitude: sc.longitude ? Number(sc.longitude) : 100.4982,
    scanSource: 'camera',
    status: 'success',
    scanType: String(sc.scan_type || 'ขึ้นรถ'),
    scannerName: String(sc.scanner_by || 'เจ้าหน้าที่'),
    device: String(sc.scanner_device || 'MOBILE01'),
    note: sc.note ? String(sc.note) : undefined,
  };
}

// SELECT: Fetch Scans from Supabase
export async function fetchScansFromSupabase(): Promise<{ success: boolean; data: ScanRecord[]; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, data: SUPABASE_SCANS, error: 'No client configured' };
  }

  try {
    const { data, error } = await client
      .from('scans')
      .select('*')
      .order('scan_date', { ascending: false })
      .order('scan_time', { ascending: false })
      .limit(500);

    if (error) {
      console.warn('Supabase fetch scans error:', error);
      return { success: false, data: SUPABASE_SCANS, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: true, data: [] };
    }

    const mappedScans: ScanRecord[] = data.map(mapScanRow);
    return { success: true, data: mappedScans };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Failed to fetch scans from Supabase:', err);
    return { success: false, data: SUPABASE_SCANS, error: msg };
  }
}

// ==========================================
// PENDING SCANS QUEUE (OFFLINE-FIRST / RECOVERY)
// ==========================================
const STORAGE_KEY_PENDING_SCANS = 'qr_bus_pending_scans';

export function getPendingScans(): ScanRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PENDING_SCANS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePendingScan(scan: ScanRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getPendingScans();
    // avoid duplicates
    const scanId = scan.scanId || scan.id;
    if (!list.some((s) => (s.scanId || s.id) === scanId)) {
      list.push(scan);
      localStorage.setItem(STORAGE_KEY_PENDING_SCANS, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Failed to save pending scan:', e);
  }
}

export function removePendingScan(scanId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getPendingScans().filter((s) => (s.scanId || s.id) !== scanId);
    localStorage.setItem(STORAGE_KEY_PENDING_SCANS, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to remove pending scan:', e);
  }
}

export function clearPendingScans(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_PENDING_SCANS);
  } catch {
    // ignore
  }
}

// Sync all pending scans that were saved while offline or before connecting
export async function syncPendingScans(): Promise<{ success: boolean; syncedCount: number; error?: string }> {
  if (!isSupabaseConnected()) {
    return { success: false, syncedCount: 0, error: 'Supabase ยังไม่ได้เชื่อมต่อ' };
  }

  const pending = getPendingScans();
  if (pending.length === 0) {
    return { success: true, syncedCount: 0 };
  }

  let successCount = 0;
  for (const scan of pending) {
    const res = await insertScanToSupabase(scan, { skipQueue: true });
    if (res.success) {
      removePendingScan(scan.scanId || scan.id);
      successCount++;
    }
  }

  return { success: true, syncedCount: successCount };
}

// INSERT: Insert real-time Scan directly to Supabase with auto-healing and fallback
export async function insertScanToSupabase(
  scan: ScanRecord,
  options?: { skipQueue?: boolean }
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    if (!options?.skipQueue) {
      savePendingScan(scan);
    }
    return { success: false, error: 'ยังไม่ได้ตั้งค่า Supabase URL และ Anon Key' };
  }

  try {
    // Calculate reliable ISO Date (YYYY-MM-DD) and 24-hour Time (HH:MM:SS)
    const ts = scan.timestamp || Date.now();
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, '0');
    const scanDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const scanTime = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

    const scanId = (scan.scanId || scan.id || `SCN${Date.now()}`).trim();
    const studentId = (scan.studentCode || scan.studentId || '').trim();
    const carId = (scan.carID || scan.busNumber || 'CAR01').trim();
    const studentName = (scan.name || 'นักเรียน').trim();
    const plateNumber = (scan.plate || '1กข 1234').trim();

    const payload: Record<string, unknown> = {
      scan_id: scanId,
      scan_date: scanDate,
      scan_time: scanTime,
      student_id: studentId || null,
      student_name: studentName,
      car_id: carId || null,
      plate_number: plateNumber,
      dorm: scan.dorm || scan.locationName || 'จุดรับส่ง',
      scan_type: scan.scanType || 'ขึ้นรถ',
      scanner_by: scan.scannerName || 'เจ้าหน้าที่',
      scanner_device: scan.device || 'MOBILE01',
      scan_result: 'สำเร็จ',
      note: scan.note || '',
      latitude: typeof scan.latitude === 'number' ? scan.latitude : 13.7548,
      longitude: typeof scan.longitude === 'number' ? scan.longitude : 100.4982,
    };

    // Use upsert on scan_id to prevent duplicate key crashes
    let { error } = await client.from('scans').upsert(payload, { onConflict: 'scan_id' });

    // Handle Foreign Key Constraint Violations (error code 23503)
    if (error && (error.code === '23503' || error.message?.includes('foreign key constraint'))) {
      console.warn('Foreign key violation encountered, applying self-healing:', error.message);

      // 1. If student_id caused the foreign key violation
      if (error.message?.includes('scans_student_id_fkey') || error.message?.includes('student_id')) {
        if (studentId) {
          // Attempt to auto-create stub student record
          await client.from('students').upsert(
            {
              student_id: studentId,
              qr_code: studentId,
              name: studentName,
              status: 'ใช้งาน',
            },
            { onConflict: 'student_id' }
          );
        }
      }

      // 2. If car_id caused the foreign key violation
      if (error.message?.includes('scans_car_id_fkey') || error.message?.includes('car_id')) {
        if (carId) {
          // Attempt to auto-create stub car record
          await client.from('cars').upsert(
            {
              car_id: carId,
              plate_number: plateNumber,
              name: carId,
              status: 'ใช้งาน',
            },
            { onConflict: 'car_id' }
          );
        }
      }

      // Retry upsert
      const retryResult = await client.from('scans').upsert(payload, { onConflict: 'scan_id' });
      error = retryResult.error;

      // If still failing foreign key, nullify foreign keys so the scan is NEVER discarded!
      if (error && (error.code === '23503' || error.message?.includes('foreign key'))) {
        payload.student_id = null;
        payload.car_id = null;
        const lastChance = await client.from('scans').upsert(payload, { onConflict: 'scan_id' });
        error = lastChance.error;
      }
    }

    if (error) {
      console.error('Failed to insert scan into Supabase:', error);
      if (!options?.skipQueue) {
        savePendingScan(scan);
      }

      let friendlyMsg = error.message;
      if (error.code === '42P01') {
        friendlyMsg = 'ไม่พบตาราง public.scans ในฐานข้อมูล Supabase! กรุณารันคำสั่ง SQL สร้างตาราง scans';
      } else if (error.code === '42501' || error.message?.includes('row-level security') || error.message?.includes('policy')) {
        friendlyMsg = 'ติดสิทธิ์ความปลอดภัย RLS ของตาราง scans ใน Supabase! กรุณาเพิ่มนโยบายอนุญาตบันทึก';
      }

      return { success: false, error: friendlyMsg };
    }

    // Success: remove from pending queue if was queued
    removePendingScan(scanId);
    return { success: true };
  } catch (err: unknown) {
    console.error('Error inserting scan to Supabase:', err);
    if (!options?.skipQueue) {
      savePendingScan(scan);
    }
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// DELETE: Delete a single Scan from Supabase
export async function deleteScanFromSupabase(scanId: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'ยังไม่ได้เชื่อมต่อ Supabase' };
  }

  try {
    const { error } = await client.from('scans').delete().eq('scan_id', scanId.trim());
    if (error) {
      console.error('Delete scan error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// CLEAR ALL: Clear all scans in Supabase
export async function clearAllScansInSupabase(): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'ยังไม่ได้เชื่อมต่อ Supabase' };
  }

  try {
    // Delete all rows where scan_id is not empty
    const { error } = await client.from('scans').delete().neq('scan_id', '');
    if (error) {
      console.error('Clear all scans error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// ==========================================
// 4. REALTIME SUBSCRIPTIONS
// ==========================================

export function subscribeToSupabaseRealtime(handlers: {
  onScanInsert?: (scan: ScanRecord) => void;
  onScanDelete?: (scanId: string) => void;
  onStudentChange?: () => void;
  onCarChange?: () => void;
}): (() => void) | null {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const channel = client
      .channel('supabase_realtime_all')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'scans' },
        (payload: { new: Record<string, unknown> }) => {
          if (handlers.onScanInsert && payload.new) {
            handlers.onScanInsert(mapScanRow(payload.new));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'scans' },
        (payload: { old: Record<string, unknown> }) => {
          if (handlers.onScanDelete && payload.old && payload.old.scan_id) {
            handlers.onScanDelete(String(payload.old.scan_id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
        () => {
          if (handlers.onStudentChange) handlers.onStudentChange();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cars' },
        () => {
          if (handlers.onCarChange) handlers.onCarChange();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime subscription error:', err);
    return null;
  }
}

export function subscribeToSupabaseScans(onNewScan: (scan: ScanRecord) => void): (() => void) | null {
  return subscribeToSupabaseRealtime({ onScanInsert: onNewScan });
}
