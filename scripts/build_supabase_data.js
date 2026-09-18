import fs from 'fs';

// 1. CARS
const cars = [
  { car_id: 'CAR01', plate_number: '1กข 1234', name: 'รถคันที่ 1', route: 'หอ A', driver_name: 'นายสมชาย ใจดี', driver_phone: '081-111-1111', attendant_name: 'นางสาวเอ  รักเรียน', capacity: 60, status: 'ใช้งาน' },
  { car_id: 'CAR02', plate_number: '2กข 2345', name: 'รถคันที่ 2', route: 'หอ B', driver_name: 'นายวิชัย มั่นคง', driver_phone: '082-222-2222', attendant_name: 'นางสาวบี  ศรีสุข', capacity: 60, status: 'ใช้งาน' },
  { car_id: 'CAR03', plate_number: '3กข 3456', name: 'รถคันที่ 3', route: 'หอ C', driver_name: 'นายประเสริฐ ทองคำ', driver_phone: '083-333-3333', attendant_name: 'นางสาวซี  บุญมี', capacity: 60, status: 'ใช้งาน' },
  { car_id: 'CAR04', plate_number: '4กข 4567', name: 'รถคันที่ 4', route: 'หอ D', driver_name: 'นายอนุชา แสงทอง', driver_phone: '084-444-4444', attendant_name: 'นางสาวดี  พูลสุข', capacity: 60, status: 'ใช้งาน' },
  { car_id: 'CAR05', plate_number: '5กข 5678', name: 'รถคันที่ 5', route: 'หอ E', driver_name: 'นายธนกร วงศ์ไทย', driver_phone: '085-555-5555', attendant_name: 'นางสาวอี  จันทร์เพ็ญ', capacity: 60, status: 'ใช้งาน' }
];

// 2. USERS
const users = [
  { user_id: 'U001', name: 'ผู้ดูแลระบบ', email: 'admin@example.com', role: 'Admin', car_id: 'ALL', status: 'ใช้งาน' },
  { user_id: 'U002', name: 'เจ้าหน้าที่รถ 1', email: 'staff1@example.com', role: 'Staff', car_id: 'CAR01', status: 'ใช้งาน' },
  { user_id: 'U003', name: 'ผู้บริหาร (ดูรายงาน)', email: 'viewer@example.com', role: 'Viewer', car_id: 'ALL', status: 'ใช้งาน' }
];

// 3. SETTINGS
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

console.log('Seed config initialized');
