export interface Student {
  id: string;
  studentCode: string;
  name: string;
  nickname?: string;
  grade: string;
  classroom?: string;
  className?: string;
  room?: string;
  number?: string | number;
  dorm?: string;
  carID?: string;
  plate?: string;
  busNumber: string;
  dormOrStop?: string;
  busStopName?: string;
  pickup?: string;
  parent?: string;
  parentPhone: string;
  avatarColor?: string;
  avatar?: string;
  avatarUrl?: string;
  status?: string;
  qrUrl?: string;
  createdDate?: string;
}

export interface Car {
  carID: string;
  plate: string;
  name: string;
  route: string;
  driver: string;
  driverPhone: string;
  attendant: string;
  capacity: number;
  status: string;
}

export interface ScanRecord {
  id: string;
  scanId: string;
  timestamp: number;
  dateThai: string;
  timeThai: string;
  time?: string;
  studentId: string;
  studentCode: string;
  name: string;
  grade: string;
  dorm?: string;
  carID?: string;
  plate?: string;
  busNumber: string;
  locationName: string;
  latitude: number;
  longitude: number;
  scanSource: 'camera' | 'upload' | 'simulated';
  status: 'success' | 'warn' | 'error';
  scanType?: string;
  scannerName?: string;
  device?: string;
  note?: string;
  avatar?: string;
}

export type AdminTab =
  | 'dashboard'
  | 'students'
  | 'cars'
  | 'qrcode'
  | 'qr-generator'
  | 'reports'
  | 'sheets'
  | 'supabase';

