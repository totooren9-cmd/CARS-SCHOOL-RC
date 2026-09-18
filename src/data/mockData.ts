import { Student, ScanRecord, Car } from '../types';
import { SUPABASE_STUDENTS, SUPABASE_CARS, SUPABASE_SCANS } from './supabaseSeed';

// 300 Real Students directly from Supabase Seed (STD0001 - STD0300)
export const INITIAL_STUDENTS: Student[] = SUPABASE_STUDENTS;

// 5 Real School Cars (CAR01 - CAR05)
export const INITIAL_CARS: Car[] = SUPABASE_CARS;

// Real historical scans directly from database
export const INITIAL_SCANS: ScanRecord[] = SUPABASE_SCANS;

// Bus stops align with student routes and dorms from Google Sheet
export const MOCK_BUS_STOPS = [
  { name: 'หอ A • จุดรับ 1', lat: 13.7548, lng: 100.4982 },
  { name: 'หอ B • จุดรับ 2', lat: 13.7582, lng: 100.5054 },
  { name: 'หอ C • จุดรับ 3', lat: 13.7259, lng: 100.4935 },
  { name: 'หอ D • จุดรับ 4', lat: 13.7208, lng: 100.4578 },
  { name: 'หอ E • จุดรับ 5', lat: 13.7745, lng: 100.4782 },
  { name: 'ประตู 1 หน้าโรงเรียน', lat: 13.7431, lng: 100.4990 },
];

export function formatThaiDateTime(date = new Date()) {
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return {
    dateThai: `${day} ${month} ${year}`,
    timeThai: `${hours}:${minutes}:${seconds} น.`
  };
}

