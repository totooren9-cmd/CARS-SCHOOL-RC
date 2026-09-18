import fs from 'fs';

// Patterns from prompt
const baseStudents = [
  { name: 'ด.ช.อนุชา พฤกษ์ชาติ', nick: 'โอ๊ต', grade: 'ป.4', room: '2', dorm: 'หอ A', car: 'CAR01', pickup: 'ประตูหลัง', parent: 'ผู้ปกครอง พฤกษ์ชาติ' },
  { name: 'ด.ญ.สุนีย์ วงศ์ไทย', nick: 'มิ้นท์', grade: 'ม.1', room: '3', dorm: 'หอ B', car: 'CAR02', pickup: 'หน้าโรงอาหาร', parent: 'ผู้ปกครอง วงศ์ไทย' },
  { name: 'ด.ช.ศิริพร อรุณรัตน์', nick: 'แบม', grade: 'ม.4', room: '1', dorm: 'หอ C', car: 'CAR03', pickup: 'ลานจอดรถ', parent: 'ผู้ปกครอง อรุณรัตน์' },
  { name: 'ด.ญ.ชลธิชา ชัยชนะ', nick: 'พีช', grade: 'ป.1', room: '2', dorm: 'หอ D', car: 'CAR04', pickup: 'ประตูหน้า', parent: 'ผู้ปกครอง ชัยชนะ' },
  { name: 'ด.ช.กิตติ ทองคำ', nick: 'แตงโม', grade: 'ป.4', room: '3', dorm: 'หอ E', car: 'CAR05', pickup: 'ประตูหลัง', parent: 'ผู้ปกครอง ทองคำ' },
  { name: 'ด.ญ.อารีย์ เรืองศรี', nick: 'ชาย', grade: 'ม.1', room: '1', dorm: 'หอ A', car: 'CAR01', pickup: 'หน้าโรงอาหาร', parent: 'ผู้ปกครอง เรืองศรี' },
  { name: 'ด.ช.ณัฐริกา อินทรีย์', nick: 'โอ๊ต', grade: 'ม.4', room: '2', dorm: 'หอ B', car: 'CAR02', pickup: 'ลานจอดรถ', parent: 'ผู้ปกครอง อินทรีย์' },
  { name: 'ด.ญ.กัลยา แสงทอง', nick: 'มิ้นท์', grade: 'ป.1', room: '3', dorm: 'หอ C', car: 'CAR03', pickup: 'ประตูหน้า', parent: 'ผู้ปกครอง แสงทอง' },
  { name: 'ด.ช.ปิยะ สมบูรณ์', nick: 'แบม', grade: 'ป.4', room: '1', dorm: 'หอ D', car: 'CAR04', pickup: 'ประตูหลัง', parent: 'ผู้ปกครอง สมบูรณ์' },
  { name: 'ด.ญ.ปรีชา เกษมศรี', nick: 'พีช', grade: 'ม.1', room: '2', dorm: 'หอ E', car: 'CAR05', pickup: 'หน้าโรงอาหาร', parent: 'ผู้ปกครอง เกษมศรี' },
  { name: 'ด.ช.ปาริชาติ บุญมี', nick: 'แตงโม', grade: 'ม.4', room: '3', dorm: 'หอ A', car: 'CAR01', pickup: 'ลานจอดรถ', parent: 'ผู้ปกครอง บุญมี' },
  { name: 'ด.ญ.ธิดารัตน์ เพชรรัตน์', nick: 'ชาย', grade: 'ป.1', room: '1', dorm: 'หอ B', car: 'CAR02', pickup: 'ประตูหน้า', parent: 'ผู้ปกครอง เพชรรัตน์' },
  { name: 'ด.ช.มานะ มั่นคง', nick: 'โอ๊ต', grade: 'ป.4', room: '2', dorm: 'หอ C', car: 'CAR03', pickup: 'ประตูหลัง', parent: 'ผู้ปกครอง มั่นคง' },
  { name: 'ด.ญ.ชัยวัฒน์ ศรีสุข', nick: 'มิ้นท์', grade: 'ม.1', room: '3', dorm: 'หอ D', car: 'CAR04', pickup: 'หน้าโรงอาหาร', parent: 'ผู้ปกครอง ศรีสุข' },
  { name: 'ด.ช.จันทร์เพ็ญ ดวงแก้ว', nick: 'แบม', grade: 'ม.4', room: '1', dorm: 'หอ E', car: 'CAR05', pickup: 'ลานจอดรถ', parent: 'ผู้ปกครอง ดวงแก้ว' },
  { name: 'ด.ญ.อรทัย เจริญสุข', nick: 'พีช', grade: 'ป.1', room: '2', dorm: 'หอ A', car: 'CAR01', pickup: 'ประตูหน้า', parent: 'ผู้ปกครอง เจริญสุข' },
  { name: 'ด.ช.พิมพ์ใจ รักเรียน', nick: 'แตงโม', grade: 'ป.4', room: '3', dorm: 'หอ B', car: 'CAR02', pickup: 'ประตูหลัง', parent: 'ผู้ปกครอง รักเรียน' },
  { name: 'ด.ญ.วีระ สายสมร', nick: 'ชาย', grade: 'ม.1', room: '1', dorm: 'หอ C', car: 'CAR03', pickup: 'หน้าโรงอาหาร', parent: 'ผู้ปกครอง สายสมร' },
  { name: 'ด.ช.มาลี พูลสวัสดิ์', nick: 'โอ๊ต', grade: 'ม.4', room: '2', dorm: 'หอ D', car: 'CAR04', pickup: 'ลานจอดรถ', parent: 'ผู้ปกครอง พูลสวัสดิ์' },
  { name: 'ด.ญ.พิมพ์ชนก ใจดี', nick: 'มิ้นท์', grade: 'ป.1', room: '3', dorm: 'หอ E', car: 'CAR05', pickup: 'ประตูหน้า', parent: 'ผู้ปกครอง ใจดี' }
];

console.log('Base student template verified');
