import { ScanRecord, Student, Car } from '../types';

export const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyFh062PR93yPuROKuutF5bOmFXZapivSo-qZT1liP6_YPUrWt1jyUAOJ2yYcQAM7pM/exec';

export const SHEET_HEADERS = [
  'ScanID',
  'วันที่',
  'เวลา',
  'StudentID',
  'ชื่อ-นามสกุล',
  'ชั้น',
  'หอพัก',
  'CarID',
  'ทะเบียนรถ',
  'ประเภท',
  'ผู้สแกน',
  'เครื่องสแกน',
  'ผลการสแกน',
  'หมายเหตุ',
];

/**
 * Generate 30 student records matching Google Sheet's 01_นักเรียน from createSampleData_()
 */
export function generateDefaultGoogleSheetStudents(): Student[] {
  const students: Student[] = [];
  const avatars = [
    'bg-blue-500',
    'bg-indigo-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-purple-500',
    'bg-teal-500',
    'bg-cyan-500',
  ];

  for (let i = 1; i <= 30; i++) {
    const studentID = 'STD' + String(i).padStart(4, '0');
    const carNo = ((i - 1) % 5) + 1;
    const carID = 'CAR' + String(carNo).padStart(2, '0');
    const dormLetter = String.fromCharCode(64 + carNo);
    const grade = i % 3 === 0 ? 'ม.1' : 'ป.6';
    const room = String(((i - 1) % 3) + 1);

    students.push({
      id: studentID,
      studentCode: studentID,
      name: `นักเรียนตัวอย่าง ${i}`,
      nickname: `น้อง${i}`,
      grade,
      room,
      classroom: `${grade}/${room}`,
      className: `${grade}/${room}`,
      number: i,
      dorm: `หอ ${dormLetter}`,
      carID,
      busNumber: `${carID} (รถคันที่ ${carNo})`,
      dormOrStop: `หอ ${dormLetter} • จุดรับ ${carNo}`,
      pickup: `จุดรับ ${carNo}`,
      parent: `ผู้ปกครองตัวอย่าง ${i}`,
      parentPhone: `08${10000000 + i}`,
      status: 'ใช้งาน',
      avatarColor: avatars[(i - 1) % avatars.length],
      qrUrl: `https://quickchart.io/qr?text=${encodeURIComponent(studentID)}&size=300`,
    });
  }
  return students;
}

/**
 * Generate 5 cars matching Google Sheet's 02_รถ from createSampleData_()
 */
export function generateDefaultGoogleSheetCars(): Car[] {
  return [
    {
      carID: 'CAR01',
      plate: '1กข 1001',
      name: 'รถคันที่ 1',
      route: 'หอ A',
      driver: 'สมชาย ใจดี',
      driverPhone: '0811111111',
      attendant: 'พี่เอ',
      capacity: 60,
      status: 'ใช้งาน',
    },
    {
      carID: 'CAR02',
      plate: '1กข 1002',
      name: 'รถคันที่ 2',
      route: 'หอ B',
      driver: 'สมศักดิ์ ดีมาก',
      driverPhone: '0822222222',
      attendant: 'พี่บี',
      capacity: 60,
      status: 'ใช้งาน',
    },
    {
      carID: 'CAR03',
      plate: '1กข 1003',
      name: 'รถคันที่ 3',
      route: 'หอ C',
      driver: 'สมพงษ์ รักดี',
      driverPhone: '0833333333',
      attendant: 'พี่ซี',
      capacity: 60,
      status: 'ใช้งาน',
    },
    {
      carID: 'CAR04',
      plate: '1กข 1004',
      name: 'รถคันที่ 4',
      route: 'หอ D',
      driver: 'สมหมาย มีสุข',
      driverPhone: '0844444444',
      attendant: 'พี่ดี',
      capacity: 60,
      status: 'ใช้งาน',
    },
    {
      carID: 'CAR05',
      plate: '1กข 1005',
      name: 'รถคันที่ 5',
      route: 'หอ E',
      driver: 'สมปอง ตั้งใจ',
      driverPhone: '0855555555',
      attendant: 'พี่อี',
      capacity: 60,
      status: 'ใช้งาน',
    },
  ];
}

/**
 * Creates a brand new Google Sheet in the user's Google Drive with formatted columns
 */
export async function createNewSpreadsheet(
  title = 'QR Student Transport System',
  accessToken: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: '03_บันทึกการสแกน',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: SHEET_HEADERS.map((header) => ({
                    userEnteredValue: { stringValue: header },
                    userEnteredFormat: {
                      textFormat: { bold: true },
                      backgroundColor: { red: 0.1, green: 0.15, blue: 0.2 },
                    },
                  })),
                },
              ],
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || 'ไม่สามารถสร้าง Google Sheet ได้ กรุณาตรวจสอบสิทธิ์'
    );
  }

  const data = await response.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl,
  };
}

/**
 * Append one or more scan records to a Google Sheet via Google Sheets API v4
 */
export async function appendScansToSheet(
  spreadsheetId: string,
  scans: ScanRecord[],
  accessToken: string,
  sheetName = '03_บันทึกการสแกน'
): Promise<boolean> {
  if (scans.length === 0) return true;

  const rows = scans.map((s) => [
    s.scanId,
    s.dateThai,
    s.timeThai,
    s.studentCode,
    s.name,
    s.grade,
    s.dorm || '',
    s.carID || s.busNumber || '',
    s.plate || '',
    s.scanType || 'ขึ้นรถ',
    s.scannerName || 'ผู้ดูแลระบบ',
    s.device || 'MOBILE01',
    s.status === 'success' ? 'สำเร็จ' : s.status,
    s.note || '',
  ]);

  const range = `${encodeURIComponent(sheetName)}!A:N`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: rows,
    }),
  });

  if (!response.ok) {
    // If the specific sheet name failed, retry with fallback
    const fallbackUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:N:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    const fallbackRes = await fetch(fallbackUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: rows,
      }),
    });

    if (!fallbackRes.ok) {
      const err = await fallbackRes.json().catch(() => ({}));
      throw new Error(
        err.error?.message || 'ไม่สามารถเพิ่มข้อมูลลงใน Google Sheet ได้'
      );
    }
  }

  return true;
}

/**
 * Fetch spreadsheet metadata to check if spreadsheet exists and is accessible
 */
export async function checkSpreadsheetAccess(
  spreadsheetId: string,
  accessToken: string
): Promise<{ title: string; sheetNames: string[] }> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties.title`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('ไม่พบ Google Sheet หรือไม่มีสิทธิ์เข้าถึง');
  }

  const data = await response.json();
  const sheetNames = (data.sheets || []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s: any) => s.properties?.title || 'Sheet1'
  );

  return {
    title: data.properties?.title || 'Google Sheet',
    sheetNames,
  };
}

/**
 * Fetch students from Apps Script API (action=getStudents)
 */
export async function fetchStudentsFromAppsScript(
  webhookUrl: string
): Promise<{ success: boolean; data?: Student[]; error?: string }> {
  const targetUrl = (webhookUrl || DEFAULT_APPS_SCRIPT_URL).trim();
  const endpoint = `${targetUrl}?action=getStudents`;

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}` };
    }

    const text = await res.text();
    // Verify if output is JSON or HTML
    if (text.startsWith('<') || text.includes('<!DOCTYPE html>')) {
      return {
        success: false,
        error:
          'Google Apps Script ส่งกลับเป็นหน้า HTML Web App กรุณาอัปเดต doGet(e) ใน Apps Script ให้รองรับ API ตามคำแนะนำในแท็บ Google Sheets',
      };
    }

    const json = JSON.parse(text);
    const rows: unknown[] = Array.isArray(json) ? json : json.data || [];

    const students: Student[] = rows.map((r, idx) => {
      if (Array.isArray(r)) {
        // [studentID, qrCode, name, nickname, grade, room, number, dorm, carID, pickup, parent, phone, status, createdDate]
        const studentID = String(r[0] || `STD${String(idx + 1).padStart(4, '0')}`);
        const grade = String(r[4] || 'ป.6');
        const room = String(r[5] || '1');
        const dorm = String(r[7] || '');
        const carID = String(r[8] || '');
        return {
          id: studentID,
          studentCode: studentID,
          name: String(r[2] || studentID),
          nickname: String(r[3] || ''),
          grade,
          room,
          classroom: `${grade}/${room}`,
          className: `${grade}/${room}`,
          number: r[6] ? String(r[6]) : idx + 1,
          dorm,
          carID,
          busNumber: carID ? `${carID} (${dorm})` : 'สายรถ',
          dormOrStop: `${dorm} ${r[9] ? `• ${r[9]}` : ''}`.trim(),
          pickup: String(r[9] || ''),
          parent: String(r[10] || ''),
          parentPhone: String(r[11] || ''),
          status: String(r[12] || 'ใช้งาน'),
          qrUrl: `https://quickchart.io/qr?text=${encodeURIComponent(studentID)}&size=300`,
        };
      } else if (typeof r === 'object' && r !== null) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj = r as any;
        const studentID = String(obj.studentID || obj.id || obj.studentCode || `STD${idx + 1}`);
        return {
          id: studentID,
          studentCode: studentID,
          name: obj.name || obj['ชื่อ-นามสกุล'] || studentID,
          nickname: obj.nickname || obj['ชื่อเล่น'] || '',
          grade: obj.grade || obj.className || 'ป.6',
          classroom: obj.classroom || obj.className || 'ป.6/1',
          dorm: obj.dorm || obj['หอพัก'] || '',
          carID: obj.carID || obj['CarID'] || '',
          busNumber: obj.carID || obj.busNumber || 'สายรถ',
          parentPhone: obj.phone || obj.parentPhone || '',
          status: obj.status || 'ใช้งาน',
        };
      }
      return {
        id: `STD${idx + 1}`,
        studentCode: `STD${idx + 1}`,
        name: `นักเรียน ${idx + 1}`,
        grade: 'ป.6',
        busNumber: 'สาย 1',
        parentPhone: '',
      };
    });

    return { success: true, data: students };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'ไม่สามารถเชื่อมต่อได้',
    };
  }
}

/**
 * Fetch cars from Apps Script API (action=getCars)
 */
export async function fetchCarsFromAppsScript(
  webhookUrl: string
): Promise<{ success: boolean; data?: Car[]; error?: string }> {
  const targetUrl = (webhookUrl || DEFAULT_APPS_SCRIPT_URL).trim();
  const endpoint = `${targetUrl}?action=getCars`;

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
    const text = await res.text();
    if (text.startsWith('<')) return { success: false, error: 'HTML returned' };

    const json = JSON.parse(text);
    const rows: unknown[] = Array.isArray(json) ? json : json.data || [];

    const cars: Car[] = rows.map((r) => {
      if (Array.isArray(r)) {
        // [carID, plate, name, route, driver, driverPhone, attendant, capacity, status]
        return {
          carID: String(r[0] || ''),
          plate: String(r[1] || ''),
          name: String(r[2] || ''),
          route: String(r[3] || ''),
          driver: String(r[4] || ''),
          driverPhone: String(r[5] || ''),
          attendant: String(r[6] || ''),
          capacity: Number(r[7] || 60),
          status: String(r[8] || 'ใช้งาน'),
        };
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj = r as any;
      return {
        carID: obj.carID || '',
        plate: obj.plate || '',
        name: obj.name || '',
        route: obj.route || '',
        driver: obj.driver || '',
        driverPhone: obj.driverPhone || '',
        attendant: obj.attendant || '',
        capacity: Number(obj.capacity || 60),
        status: obj.status || 'ใช้งาน',
      };
    });

    return { success: true, data: cars };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error fetching cars',
    };
  }
}

/**
 * Fetch scans from Apps Script API (action=getAllScans)
 */
export async function fetchScansFromAppsScript(
  webhookUrl: string
): Promise<{ success: boolean; data?: ScanRecord[]; error?: string }> {
  const targetUrl = (webhookUrl || DEFAULT_APPS_SCRIPT_URL).trim();
  const endpoint = `${targetUrl}?action=getAllScans&limit=200`;

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
    const text = await res.text();
    if (text.startsWith('<')) return { success: false, error: 'HTML returned' };

    const json = JSON.parse(text);
    const rows: unknown[] = Array.isArray(json) ? json : json.data || [];

    const scans: ScanRecord[] = rows.map((r, idx) => {
      if (Array.isArray(r)) {
        // [scanID, date, time, studentID, name, grade, dorm, carID, plate, type, scanner, device, status, note]
        return {
          id: String(r[0] || `scan-${idx}`),
          scanId: String(r[0] || `SCN-${idx}`),
          timestamp: Date.now() - idx * 60000,
          dateThai: String(r[1] || ''),
          timeThai: String(r[2] || ''),
          time: String(r[2] || ''),
          studentId: String(r[3] || ''),
          studentCode: String(r[3] || ''),
          name: String(r[4] || ''),
          grade: String(r[5] || ''),
          dorm: String(r[6] || ''),
          carID: String(r[7] || ''),
          plate: String(r[8] || ''),
          busNumber: String(r[7] || 'สายรถ'),
          locationName: String(r[6] || 'จุดรับส่ง'),
          latitude: 13.7563,
          longitude: 100.5018,
          scanSource: 'camera',
          status: 'success',
          scanType: String(r[9] || 'ขึ้นรถ'),
          scannerName: String(r[10] || ''),
          device: String(r[11] || 'MOBILE01'),
          note: String(r[13] || ''),
        };
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj = r as any;
      return {
        id: obj.scanID || `scan-${idx}`,
        scanId: obj.scanID || `SCN-${idx}`,
        timestamp: Date.now(),
        dateThai: obj.date || '',
        timeThai: obj.time || '',
        studentId: obj.studentID || '',
        studentCode: obj.studentID || '',
        name: obj.name || '',
        grade: obj.grade || '',
        busNumber: obj.carID || '',
        locationName: obj.dorm || '',
        latitude: 13.7563,
        longitude: 100.5018,
        scanSource: 'camera',
        status: 'success',
      };
    });

    return { success: true, data: scans };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error fetching scans',
    };
  }
}

/**
 * Sync scan record directly to the user's Google Apps Script Web App URL
 * Supports recordScan function with 03_บันทึกการสแกน format
 */
export async function syncToAppsScriptWebhook(
  webhookUrl: string,
  scan: ScanRecord
): Promise<{ success: boolean; message: string }> {
  const targetUrl = webhookUrl.trim() || DEFAULT_APPS_SCRIPT_URL;

  const payload = {
    action: 'recordScan',
    studentID: scan.studentCode || scan.studentId,
    studentCode: scan.studentCode || scan.studentId,
    scanType: scan.scanType || 'ขึ้นรถ',
    scannerName: scan.scannerName || 'MOBILE01',
    name: scan.name,
    grade: scan.grade,
    carID: scan.carID || scan.busNumber,
    busNumber: scan.busNumber,
    locationName: scan.locationName,
    latitude: scan.latitude,
    longitude: scan.longitude,
    date: scan.dateThai,
    time: scan.timeThai,
    timestamp: scan.timestamp,
    status: scan.status,
    scanSource: scan.scanSource,
  };

  try {
    // 1. Send via POST (mode: no-cors prevents CORS cross-origin blocks with GAS)
    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      message: 'ส่งข้อมูลไปยัง Google Apps Script (03_บันทึกการสแกน) สำเร็จ',
    };
  } catch (error) {
    console.warn('Apps Script webhook POST error:', error);
    // 2. Fallback: try GET with query params
    try {
      const params = new URLSearchParams({
        action: 'recordScan',
        studentID: scan.studentCode || scan.studentId,
        scanType: scan.scanType || 'ขึ้นรถ',
        scannerName: scan.scannerName || 'MOBILE01',
        name: scan.name,
        grade: scan.grade,
        carID: scan.carID || scan.busNumber,
        time: scan.timeThai,
      });
      await fetch(`${targetUrl}?${params.toString()}`, {
        method: 'GET',
        mode: 'no-cors',
      });
      return {
        success: true,
        message: 'ส่งข้อมูลแบบ GET สำเร็จ',
      };
    } catch {
      return {
        success: false,
        message: 'ไม่สามารถเชื่อมต่อไปยัง Apps Script ได้',
      };
    }
  }
}

/**
 * Recommended Google Apps Script API Wrapper code
 * To paste into the user's Code.gs to handle both Web App and API JSON calls
 */
export const RECOMMENDED_APPS_SCRIPT_CODE = `/****************************************************
 * QR STUDENT TRANSPORT SYSTEM - API & WEB APP
 * วางส่วนนี้ใน Code.gs ของ Google Apps Script
 ****************************************************/

function doGet(e) {
  // 1. ถ้าเรียกผ่าน API (มีพารามิเตอร์ action)
  if (e && e.parameter && e.parameter.action) {
    return handleApiRequest_(e.parameter.action, e.parameter);
  }

  // 2. ถ้าเปิดผ่านเบราว์เซอร์ปกติ แสดงหน้า Web App เดิม
  return HtmlService
    .createTemplateFromFile('index')
    .evaluate()
    .setTitle('QR Student Transport System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  let data = {};
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    data = (e && e.parameter) ? e.parameter : {};
  }
  const action = data.action || (e && e.parameter && e.parameter.action) || 'recordScan';
  return handleApiRequest_(action, data);
}

function handleApiRequest_(action, params) {
  let result = { success: false, message: 'Unknown action' };
  try {
    if (action === 'getStudents') {
      result = { success: true, data: getStudents(params.keyword || '') };
    } else if (action === 'getCars') {
      result = { success: true, data: getCars() };
    } else if (action === 'getAllScans') {
      result = { success: true, data: getAllScans(Number(params.limit || 500)) };
    } else if (action === 'getDashboard') {
      result = { success: true, data: getDashboard() };
    } else if (action === 'getStudent') {
      result = getStudent(params.studentID || params.id);
    } else if (action === 'recordScan' || action === 'scan') {
      result = recordScan(
        params.studentID || params.studentCode || params.code,
        params.scanType || params.type || 'ขึ้นรถ',
        params.scannerName || params.scanner || 'MOBILE01'
      );
    } else if (action === 'saveStudent') {
      result = saveStudent(params.data || params);
    } else if (action === 'saveCar') {
      result = saveCar(params.data || params);
    } else if (action === 'getQRStudents') {
      result = { success: true, data: getQRStudents() };
    }
  } catch (err) {
    result = { success: false, error: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

