import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { SplashScreen } from './components/SplashScreen';
import { CameraHalf } from './components/CameraHalf';
import { ScanListHalf } from './components/ScanListHalf';
import { CardDetailModal } from './components/CardDetailModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { SUPABASE_STUDENTS, SUPABASE_CARS, SUPABASE_SCANS } from './data/supabaseSeed';
import { formatThaiDateTime } from './data/mockData';
import { speakFastSuccess, triggerVibration } from './utils/audio';
import { getCurrentCoordinates } from './utils/geo';
import { Student, ScanRecord, Car } from './types';
import {
  DEFAULT_APPS_SCRIPT_URL,
  syncToAppsScriptWebhook,
  appendScansToSheet,
  fetchStudentsFromAppsScript,
  fetchCarsFromAppsScript,
  fetchScansFromAppsScript,
} from './services/googleSheets';
import { getAccessToken } from './services/googleAuth';
import {
  fetchStudentsFromSupabase,
  fetchCarsFromSupabase,
  fetchScansFromSupabase,
  insertStudentToSupabase,
  updateStudentInSupabase,
  deleteStudentFromSupabase,
  insertCarToSupabase,
  updateCarInSupabase,
  deleteCarFromSupabase,
  insertScanToSupabase,
  deleteScanFromSupabase,
  clearAllScansInSupabase,
  subscribeToSupabaseRealtime,
  isSupabaseConnected,
} from './services/supabaseClient';

function deduplicateAndFixScanIds(records: ScanRecord[]): ScanRecord[] {
  const seenIds = new Set<string>();
  return records.map((scan, index) => {
    let id = scan.id;
    if (!id || seenIds.has(id)) {
      const typeSuffix = scan.scanType === 'ลงรถ' ? 'drop' : 'pickup';
      id = `${scan.id || 'SC'}-${typeSuffix}-${index + 1}`;
      if (seenIds.has(id)) {
        id = `${id}-${index + 1}`;
      }
    }
    seenIds.add(id);
    return {
      ...scan,
      id,
      scanId: scan.scanId && scan.scanId !== scan.id && !seenIds.has(scan.scanId) ? scan.scanId : id,
    };
  });
}

export default function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>('09:41');
  const [toastMsg, setToastMsg] = useState<string>('');

  // Primary Data States (Initialized from Supabase Seed / LocalStorage)
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('bus_students');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        return SUPABASE_STUDENTS;
      }
    }
    return SUPABASE_STUDENTS;
  });

  const [cars, setCars] = useState<Car[]>(() => {
    const saved = localStorage.getItem('bus_cars');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        return SUPABASE_CARS;
      }
    }
    return SUPABASE_CARS;
  });

  const [scans, setScans] = useState<ScanRecord[]>(() => {
    const saved = localStorage.getItem('bus_scans');
    if (saved) {
      if (saved.includes('SC20260914000') || saved.includes('SC20260914001')) {
        try {
          localStorage.removeItem('bus_scans');
        } catch {
          // ignore
        }
        return SUPABASE_SCANS;
      }
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return deduplicateAndFixScanIds(parsed);
        }
      } catch {
        return SUPABASE_SCANS;
      }
    }
    return SUPABASE_SCANS;
  });

  const [activeScan, setActiveScan] = useState<ScanRecord | null>(null);
  const [selectedScanDetail, setSelectedScanDetail] = useState<ScanRecord | null>(null);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isSyncingSheets, setIsSyncingSheets] = useState<boolean>(false);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState<boolean>(false);

  // Google Sheets & Apps Script State
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => {
    return localStorage.getItem('gas_webhook_url') || DEFAULT_APPS_SCRIPT_URL;
  });
  const [connectedSheetId, setConnectedSheetId] = useState<string>(() => {
    return localStorage.getItem('gsheet_id') || '';
  });
  const [connectedSheetTitle, setConnectedSheetTitle] = useState<string>(() => {
    return localStorage.getItem('gsheet_title') || '';
  });
  const [connectedSheetUrl, setConnectedSheetUrl] = useState<string>(() => {
    return localStorage.getItem('gsheet_url') || '';
  });
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    return localStorage.getItem('gsheet_autosync') !== 'false';
  });

  // Clock in status bar
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      setCurrentTime(`${h}:${m}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Toast helper
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? '' : curr));
    }, 3000);
  }, []);

  // Persist Sheets settings
  useEffect(() => {
    localStorage.setItem('gas_webhook_url', appsScriptUrl);
  }, [appsScriptUrl]);

  useEffect(() => {
    localStorage.setItem('gsheet_id', connectedSheetId);
  }, [connectedSheetId]);

  useEffect(() => {
    localStorage.setItem('gsheet_title', connectedSheetTitle);
  }, [connectedSheetTitle]);

  useEffect(() => {
    localStorage.setItem('gsheet_url', connectedSheetUrl);
  }, [connectedSheetUrl]);

  useEffect(() => {
    localStorage.setItem('gsheet_autosync', String(autoSyncEnabled));
  }, [autoSyncEnabled]);

  const handleUpdateConnectedSheetId = (id: string, url: string, title?: string) => {
    setConnectedSheetId(id);
    setConnectedSheetUrl(url);
    if (title) setConnectedSheetTitle(title);
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('bus_cars', JSON.stringify(cars));
  }, [cars]);

  useEffect(() => {
    localStorage.setItem('bus_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('bus_scans', JSON.stringify(scans));
  }, [scans]);

  // ==========================================
  // SUPABASE 100% GETDATA / FETCH FROM CLOUD
  // ==========================================
  const refreshFromSupabase = useCallback(
    async (silent = false) => {
      if (!isSupabaseConnected()) return;
      setIsSyncingSupabase(true);
      try {
        const [stuRes, carRes, scanRes] = await Promise.all([
          fetchStudentsFromSupabase(),
          fetchCarsFromSupabase(),
          fetchScansFromSupabase(),
        ]);

        const successItems: string[] = [];

        if (stuRes.success && stuRes.data) {
          if (stuRes.data.length > 0) {
            setStudents(stuRes.data);
            localStorage.setItem('bus_students', JSON.stringify(stuRes.data));
            successItems.push(`นักเรียน ${stuRes.data.length} คน`);
          }
        }

        if (carRes.success && carRes.data) {
          if (carRes.data.length > 0) {
            setCars(carRes.data);
            localStorage.setItem('bus_cars', JSON.stringify(carRes.data));
            successItems.push(`รถ ${carRes.data.length} คัน`);
          }
        }

        if (scanRes.success && scanRes.data) {
          const uniqueScans = deduplicateAndFixScanIds(scanRes.data);
          setScans(uniqueScans);
          localStorage.setItem('bus_scans', JSON.stringify(uniqueScans));
          successItems.push(`สแกน ${uniqueScans.length} รายการ`);
        }

        if (successItems.length > 0) {
          showToast(`⚡ ดึงข้อมูล Supabase 100%: ${successItems.join(' • ')}`);
        } else if (!silent) {
          showToast('⚡ เชื่อมต่อ Supabase สำเร็จ (ข้อมูลเป็นปัจจุบัน 100%)');
        }
      } catch (err) {
        console.warn('Failed to fetch from Supabase:', err);
        if (!silent) {
          showToast('ไม่สามารถดึงข้อมูลจาก Supabase ได้ในขณะนี้');
        }
      } finally {
        setIsSyncingSupabase(false);
      }
    },
    [showToast]
  );

  // Background fetch from Supabase on mount and listen for Realtime PostgreSQL changes
  useEffect(() => {
    if (isSupabaseConnected()) {
      refreshFromSupabase(true);

      const unsubscribe = subscribeToSupabaseRealtime({
        onScanInsert: (newScan) => {
          setScans((prev) => {
            if (prev.some((s) => s.id === newScan.id || s.scanId === newScan.scanId)) {
              return prev;
            }
            return [newScan, ...prev];
          });
        },
        onScanDelete: (deletedScanId) => {
          setScans((prev) => prev.filter((s) => s.id !== deletedScanId && s.scanId !== deletedScanId));
        },
        onStudentChange: () => {
          fetchStudentsFromSupabase().then((res) => {
            if (res.success && res.data && res.data.length > 0) {
              setStudents(res.data);
            }
          });
        },
        onCarChange: () => {
          fetchCarsFromSupabase().then((res) => {
            if (res.success && res.data && res.data.length > 0) {
              setCars(res.data);
            }
          });
        },
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [refreshFromSupabase]);

  // Google Sheets Fetch
  const refreshFromGoogleSheets = useCallback(
    async (silent = false) => {
      if (!appsScriptUrl) return;
      setIsSyncingSheets(true);
      try {
        const [stuRes, carRes, scanRes] = await Promise.all([
          fetchStudentsFromAppsScript(appsScriptUrl),
          fetchCarsFromAppsScript(appsScriptUrl),
          fetchScansFromAppsScript(appsScriptUrl),
        ]);

        const successItems: string[] = [];

        if (stuRes.success && stuRes.data && stuRes.data.length > 0) {
          setStudents(stuRes.data);
          localStorage.setItem('bus_students', JSON.stringify(stuRes.data));
          successItems.push(`นักเรียน ${stuRes.data.length} คน`);
        }

        if (carRes.success && carRes.data && carRes.data.length > 0) {
          setCars(carRes.data);
          localStorage.setItem('bus_cars', JSON.stringify(carRes.data));
          successItems.push(`รถ ${carRes.data.length} คัน`);
        }

        if (scanRes.success && scanRes.data && scanRes.data.length > 0) {
          const uniqueScans = deduplicateAndFixScanIds(scanRes.data);
          setScans(uniqueScans);
          localStorage.setItem('bus_scans', JSON.stringify(uniqueScans));
          successItems.push(`สแกน ${uniqueScans.length} รายการ`);
        }

        if (successItems.length > 0) {
          showToast(`✓ ซิงค์ Google Sheet: ${successItems.join(' • ')}`);
        } else if (!silent) {
          showToast('✓ เชื่อมต่อ Google Sheet สำเร็จ (ข้อมูลเป็นปัจจุบัน)');
        }
      } catch (err) {
        console.warn('Failed to fetch from Google Sheets:', err);
        if (!silent) {
          showToast('ไม่สามารถดึงข้อมูลจาก Google Apps Script ได้ในขณะนี้');
        }
      } finally {
        setIsSyncingSheets(false);
      }
    },
    [appsScriptUrl, showToast]
  );

  // ==========================================
  // SCAN ACTION (INSERT SCAN TO SUPABASE 100%)
  // ==========================================
  const registerScan = useCallback(
    async (student: Student, source: 'camera' | 'upload' | 'simulated') => {
      const geo = await getCurrentCoordinates();
      const { dateThai, timeThai } = formatThaiDateTime();

      const studentCar = cars.find((c) => c.carID === student.carID);

      // ตรวจสอบประวัติการสแกนของนักเรียนในวันนี้: สแกนครั้งแรกคือขึ้นรถ สแกนครั้งที่ 2 คือลงรถ แล้ว
      const studentScansToday = scans.filter(
        (s) =>
          (s.studentCode === student.studentCode || s.studentId === student.id) &&
          (s.dateThai === dateThai || !s.dateThai)
      );

      const isDropOff =
        studentScansToday.length > 0 &&
        (studentScansToday[0].scanType === 'ขึ้นรถ' || studentScansToday.length % 2 === 1);

      const scanType = isDropOff ? 'ลงรถ' : 'ขึ้นรถ';

      const newScan: ScanRecord = {
        id: `scan-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        scanId: `SCN-${Date.now().toString().slice(-6)}`,
        timestamp: Date.now(),
        dateThai,
        timeThai,
        time: timeThai,
        studentId: student.id,
        studentCode: student.studentCode,
        name: student.name,
        grade: student.className || student.classroom || student.grade,
        dorm: student.dorm || '',
        carID: student.carID || student.busNumber || 'CAR01',
        plate: student.plate || studentCar?.plate || '1กข 1234',
        scanType,
        scannerName: 'MOBILE01',
        busNumber: student.busNumber || student.carID || 'CAR01',
        locationName: student.dormOrStop || student.busStopName || geo.locationName,
        latitude: geo.latitude,
        longitude: geo.longitude,
        scanSource: source,
        status: 'success',
        avatar:
          student.avatar ||
          student.avatarUrl ||
          `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(student.studentCode)}`,
      };

      setScans((prev) => [newScan, ...prev]);
      setActiveScan(newScan);
      showToast(
        isDropOff
          ? `⚡ สแกนลงรถสำเร็จ (ครั้งที่ 2): ${student.name}`
          : `⚡ สแกนขึ้นรถสำเร็จ: ${student.name}`
      );

      // Play Thai announcement & vibration
      if (soundEnabled) {
        speakFastSuccess(isDropOff ? 'สแกนลงรถเรียบร้อย' : 'สแกนขึ้นรถเรียบร้อย');
      }
      triggerVibration();

      // Confetti burst
      try {
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.5 },
          colors: ['#38bdf8', '#34d399', '#fbbf24', '#f43f5e'],
        });
      } catch {
        // Ignore if blocked
      }

      // 1. Auto-Sync to Supabase Real-time PostgreSQL 100%
      if (isSupabaseConnected()) {
        insertScanToSupabase(newScan)
          .then((res) => {
            if (res.success) {
              console.log('✓ Inserted scan into Supabase database successfully');
            } else {
              console.warn('Supabase insert scan error:', res.error);
            }
          })
          .catch((err) => {
            console.warn('Background Supabase scan insert failed:', err);
          });
      }

      // 2. Auto-Sync to Google Sheets & Apps Script
      if (autoSyncEnabled) {
        syncToAppsScriptWebhook(appsScriptUrl, newScan).catch((err) => {
          console.warn('Background Apps Script sync failed:', err);
        });

        if (connectedSheetId) {
          getAccessToken()
            .then((token) => {
              if (token) {
                appendScansToSheet(connectedSheetId, [newScan], token).catch((err) => {
                  console.warn('Background Google Sheet append failed:', err);
                });
              }
            })
            .catch(() => {});
        }
      }

      setTimeout(() => {
        setActiveScan((curr) => (curr?.id === newScan.id ? null : curr));
      }, 3500);
    },
    [soundEnabled, autoSyncEnabled, appsScriptUrl, connectedSheetId, cars, showToast, scans]
  );

  // Handle Real Camera / Upload QR code parsing
  const handleScanSuccess = useCallback(
    (data: { studentCode?: string; rawText: string; source: 'camera' | 'upload' | 'simulated' }) => {
      let rawClean = data.rawText.trim();

      if (rawClean.includes('text=')) {
        try {
          const url = new URL(rawClean);
          rawClean = url.searchParams.get('text') || rawClean;
        } catch {
          const m = rawClean.match(/text=([^&]+)/);
          if (m) rawClean = decodeURIComponent(m[1]);
        }
      }

      let matchedStudent: Student | undefined;

      try {
        const parsed = JSON.parse(rawClean);
        if (parsed && (parsed.code || parsed.studentCode || parsed.studentID)) {
          const targetCode = (parsed.code || parsed.studentCode || parsed.studentID).trim().toUpperCase();
          matchedStudent = students.find(
            (s) => s.studentCode.trim().toUpperCase() === targetCode || s.id.trim().toUpperCase() === targetCode
          );
          if (!matchedStudent) {
            matchedStudent = {
              id: targetCode,
              studentCode: targetCode,
              name: parsed.name || 'นักเรียนทั่วไป',
              grade: parsed.grade || 'ม.1',
              className: parsed.classroom || parsed.grade || 'ม.1/1',
              dorm: parsed.dorm || 'หอ A',
              carID: parsed.carID || 'CAR01',
              busNumber: parsed.bus || parsed.carID || 'CAR01',
              dormOrStop: parsed.dorm || 'จุดรับส่งนักเรียน',
              parentPhone: parsed.parentPhone || '081-000-0000',
              avatarColor: 'bg-indigo-500',
            };
          }
        }
      } catch {
        const textUpper = rawClean.toUpperCase();
        matchedStudent = students.find(
          (s) =>
            s.studentCode.trim().toUpperCase() === textUpper ||
            s.id.trim().toUpperCase() === textUpper ||
            s.name.includes(rawClean) ||
            (s.nickname && s.nickname.toLowerCase() === rawClean.toLowerCase())
        );

        if (!matchedStudent && /^\d+$/.test(rawClean)) {
          const padded = 'STD' + String(parseInt(rawClean, 10)).padStart(4, '0');
          matchedStudent = students.find((s) => s.studentCode.toUpperCase() === padded);
        }
      }

      if (!matchedStudent) {
        const fallbackCode =
          rawClean.replace(/[^A-Za-z0-9]/g, '').slice(0, 7) ||
          `STD${Math.floor(1000 + Math.random() * 9000)}`;
        matchedStudent = {
          id: fallbackCode,
          studentCode: fallbackCode,
          name:
            rawClean.length > 2 && !rawClean.startsWith('http')
              ? rawClean
              : `นักเรียนรหัส ${fallbackCode}`,
          grade: 'ม.1',
          dorm: 'หอ A',
          carID: 'CAR01',
          busNumber: 'CAR01 (หอ A)',
          dormOrStop: 'จุดรับส่งหน้าโรงเรียน',
          parentPhone: '089-111-2233',
          avatarColor: 'bg-emerald-500',
        };
      }

      registerScan(matchedStudent, data.source);
    },
    [students, registerScan]
  );

  // Handle Simulate Scan
  const handleSimulateScan = useCallback(() => {
    const fallbackStudent: Student = students[0] || SUPABASE_STUDENTS[0];
    const picked = students.length > 0
      ? students[Math.floor(Math.random() * students.length)]
      : fallbackStudent;
    const targetStudent: Student = picked || fallbackStudent;

    registerScan(targetStudent, 'simulated');
  }, [students, registerScan]);

  // ==========================================
  // SUPABASE CRUD HANDLERS: STUDENTS
  // ==========================================
  const handleAddStudent = async (newStudent: Student) => {
    setStudents((prev) => [newStudent, ...prev.filter((s) => s.id !== newStudent.id)]);

    if (isSupabaseConnected()) {
      const res = await insertStudentToSupabase(newStudent);
      if (res.success) {
        showToast(`⚡ บันทึก ${newStudent.name} ลง Supabase สำเร็จ`);
      } else {
        showToast(`บันทึกในแอปแล้ว (Supabase: ${res.error})`);
      }
    } else {
      showToast(`เพิ่มนักเรียน ${newStudent.name} แล้ว (Local)`);
    }
  };

  const handleEditStudent = async (updatedStudent: Student) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === updatedStudent.id || s.studentCode === updatedStudent.studentCode ? updatedStudent : s))
    );

    if (isSupabaseConnected()) {
      const res = await updateStudentInSupabase(updatedStudent);
      if (res.success) {
        showToast(`⚡ อัปเดต ${updatedStudent.name} ใน Supabase สำเร็จ`);
      } else {
        showToast(`อัปเดตในแอปแล้ว (Supabase: ${res.error})`);
      }
    } else {
      showToast(`แก้ไขข้อมูล ${updatedStudent.name} เรียบร้อย`);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id && s.studentCode !== id));

    if (isSupabaseConnected()) {
      const res = await deleteStudentFromSupabase(id);
      if (res.success) {
        showToast('⚡ ลบนักเรียนออกจาก Supabase สำเร็จ');
      } else {
        showToast(`ลบในแอปแล้ว (Supabase: ${res.error})`);
      }
    } else {
      showToast('ลบนักเรียนเรียบร้อย');
    }
  };

  // ==========================================
  // SUPABASE CRUD HANDLERS: CARS
  // ==========================================
  const handleAddCar = async (newCar: Car) => {
    setCars((prev) => [...prev.filter((c) => c.carID !== newCar.carID), newCar]);

    if (isSupabaseConnected()) {
      const res = await insertCarToSupabase(newCar);
      if (res.success) {
        showToast(`⚡ บันทึกรถ ${newCar.name} ลง Supabase สำเร็จ`);
      } else {
        showToast(`บันทึกในแอปแล้ว (Supabase: ${res.error})`);
      }
    } else {
      showToast(`เพิ่มรถ ${newCar.name} เรียบร้อย`);
    }
  };

  const handleEditCar = async (updatedCar: Car) => {
    setCars((prev) =>
      prev.map((c) => (c.carID === updatedCar.carID ? updatedCar : c))
    );

    if (isSupabaseConnected()) {
      const res = await updateCarInSupabase(updatedCar);
      if (res.success) {
        showToast(`⚡ อัปเดตรถ ${updatedCar.name} ใน Supabase สำเร็จ`);
      } else {
        showToast(`อัปเดตรถแล้ว (Supabase: ${res.error})`);
      }
    } else {
      showToast(`แก้ไขรถ ${updatedCar.name} เรียบร้อย`);
    }
  };

  const handleDeleteCar = async (carId: string) => {
    setCars((prev) => prev.filter((c) => c.carID !== carId));

    if (isSupabaseConnected()) {
      const res = await deleteCarFromSupabase(carId);
      if (res.success) {
        showToast('⚡ ลบรถออกจาก Supabase สำเร็จ');
      } else {
        showToast(`ลบในแอปแล้ว (Supabase: ${res.error})`);
      }
    } else {
      showToast('ลบรถเรียบร้อย');
    }
  };

  // ==========================================
  // SUPABASE CRUD HANDLERS: SCANS
  // ==========================================
  const handleDeleteScan = async (scanId: string) => {
    setScans((prev) => prev.filter((s) => s.id !== scanId && s.scanId !== scanId));

    if (isSupabaseConnected()) {
      const res = await deleteScanFromSupabase(scanId);
      if (res.success) {
        showToast('⚡ ลบรายการสแกนจาก Supabase แล้ว');
      } else {
        showToast(`ลบในแอปแล้ว (Supabase: ${res.error})`);
      }
    } else {
      showToast('ลบรายการสแกนแล้ว');
    }
  };

  const handleClearAllScans = async () => {
    setScans([]);
    setActiveScan(null);

    if (isSupabaseConnected()) {
      const res = await clearAllScansInSupabase();
      if (res.success) {
        showToast('⚡ ล้างประวัติสแกนใน Supabase ทั้งหมดแล้ว');
      } else {
        showToast('ล้างประวัติการสแกนแล้ว');
      }
    } else {
      showToast('ล้างประวัติการสแกนแล้ว');
    }
  };

  return (
    <>
      {/* ============ SPLASH ============ */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* ============ MAIN APP ============ */}
      <div id="app" className={`app ${showSplash ? 'hidden' : ''}`}>
        {/* iOS Status Bar Mock */}
        <div className="statusbar-mock">
          <span id="statusTime">{currentTime}</span>
          <div className="status-right">
            <span>📶</span>
            <span>📶</span>
            <span>🔋</span>
          </div>
        </div>

        {/* ============ SCAN SCREEN (HOME) ============ */}
        <section
          id="screen-scan"
          className={`screen ${!isAdminDashboardOpen ? 'active' : ''}`}
        >
          {/* Top : Camera */}
          <CameraHalf
            onScanSuccess={handleScanSuccess}
            onSimulateScan={handleSimulateScan}
            activeScan={activeScan}
            totalScans={scans.length}
          />

          {/* Bottom : Scan List (Bottom Sheet) */}
          <ScanListHalf
            scans={scans}
            onSelectScan={(scan) => setSelectedScanDetail(scan)}
            onClearAll={handleClearAllScans}
            onOpenAdmin={() => setIsAdminLoginOpen(true)}
            soundEnabled={soundEnabled}
            onToggleSound={() => {
              setSoundEnabled((prev) => {
                const next = !prev;
                showToast(next ? 'เปิดเสียงประกาศภาษาไทย' : 'ปิดเสียงประกาศ');
                return next;
              });
            }}
          />
        </section>

        {/* ============ ADMIN SCREEN (FULL CRUD SUPABASE) ============ */}
        {isAdminDashboardOpen && (
          <AdminDashboard
            students={students}
            cars={cars}
            scans={scans}
            onAddStudent={handleAddStudent}
            onEditStudent={handleEditStudent}
            onDeleteStudent={handleDeleteStudent}
            onAddCar={handleAddCar}
            onEditCar={handleEditCar}
            onDeleteCar={handleDeleteCar}
            onDeleteScan={handleDeleteScan}
            onClearAllScans={handleClearAllScans}
            onCloseAdmin={() => setIsAdminDashboardOpen(false)}
            appsScriptUrl={appsScriptUrl}
            onUpdateAppsScriptUrl={setAppsScriptUrl}
            connectedSheetId={connectedSheetId}
            onUpdateConnectedSheetId={handleUpdateConnectedSheetId}
            connectedSheetTitle={connectedSheetTitle}
            connectedSheetUrl={connectedSheetUrl}
            autoSyncEnabled={autoSyncEnabled}
            onToggleAutoSync={() => setAutoSyncEnabled((prev) => !prev)}
            onSyncFromGoogleSheets={() => refreshFromGoogleSheets(false)}
            isSyncingSheets={isSyncingSheets}
            onSyncFromSupabase={() => refreshFromSupabase(false)}
            isSyncingSupabase={isSyncingSupabase}
          />
        )}
      </div>

      {/* ============ LOGIN SHEET ============ */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={() => {
          setIsAdminLoginOpen(false);
          setIsAdminDashboardOpen(true);
          showToast('เข้าสู่ระบบแอดมินสำเร็จ');
        }}
      />

      {/* ============ RESULT DETAIL SHEET & MAP MODAL ============ */}
      <CardDetailModal
        scan={selectedScanDetail}
        studentDetails={
          selectedScanDetail
            ? students.find((s) => s.studentCode === selectedScanDetail.studentCode || s.id === selectedScanDetail.studentId)
            : undefined
        }
        onClose={() => setSelectedScanDetail(null)}
      />

      {/* ============ TOAST / NOTIFICATION ============ */}
      <div id="toast" className={`toast ${toastMsg ? 'show' : ''}`}>
        {toastMsg}
      </div>

      <iframe id="printFrame" style={{ display: 'none' }} title="Print Frame" />
    </>
  );
}
