import React, { useState, useMemo } from 'react';
import { Calendar, Clock, MapPin, LogIn, LogOut } from 'lucide-react';
import { ScanRecord } from '../types';

interface ScanListHalfProps {
  scans: ScanRecord[];
  onSelectScan: (scan: ScanRecord) => void;
  onClearAll: () => void;
  onOpenAdmin: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const ScanListHalf: React.FC<ScanListHalfProps> = ({
  scans,
  onSelectScan,
  onClearAll,
  onOpenAdmin,
  soundEnabled,
  onToggleSound,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Filtered scans
  const filteredScans = useMemo(() => {
    if (!searchQuery.trim()) return scans;
    const q = searchQuery.toLowerCase().trim();
    return scans.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.studentCode.toLowerCase().includes(q) ||
        s.grade.toLowerCase().includes(q) ||
        s.locationName.toLowerCase().includes(q) ||
        s.busNumber.toLowerCase().includes(q) ||
        (s.scanType && s.scanType.toLowerCase().includes(q))
    );
  }, [scans, searchQuery]);

  const handleClearClick = () => {
    if (scans.length === 0) return;
    setShowConfirmClear(true);
  };

  const confirmClear = () => {
    onClearAll();
    setShowConfirmClear(false);
  };

  return (
    <div className="list-half">
      {/* iOS Sheet Grabber */}
      <div className="sheet-grabber"></div>

      {/* List Header */}
      <div className="list-header">
        <div className="lh-left">
          <h3>รายการสแกนวันนี้</h3>
          <span className="lh-count" id="scanCount">
            {scans.length} รายการ
          </span>
        </div>
        <div className="lh-right">
          <button
            className={`icon-circle ${searchOpen ? 'border-amber-500/50 text-amber-400' : ''}`}
            id="btnSearch"
            type="button"
            onClick={() => setSearchOpen((prev) => !prev)}
            title="ค้นหา"
          >
            🔎
          </button>
          <button
            className="icon-circle"
            id="btnClear"
            type="button"
            onClick={handleClearClick}
            title="ล้างรายการ"
          >
            🗑️
          </button>
          <button
            className="icon-circle admin"
            type="button"
            onClick={onOpenAdmin}
            title="จัดการระบบ"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Collapsible Search Bar */}
      <div className={`search-bar ${searchOpen ? '' : 'hidden'}`} id="searchBar">
        <input
          id="scanSearch"
          className="search-input"
          placeholder="ค้นหา ชื่อ / รหัส / ชั้น / สายรถ / สถานะ"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus={searchOpen}
        />
      </div>

      {/* Scan List */}
      <div className="scan-list" id="scanList">
        {filteredScans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center text-2xl border border-white/5">
              🚌
            </div>
            <p className="text-sm font-medium text-slate-300">
              {searchQuery ? 'ไม่พบข้อมูลที่ตรงกับคำค้นหา' : 'ยังไม่มีประวัติการสแกนในวันนี้'}
            </p>
            <p className="text-xs text-slate-500">
              {searchQuery ? 'ลองพิมพ์คำค้นอื่น' : 'กดเริ่มสแกน QR Code หรือปุ่มจำลองเพื่อทดสอบ'}
            </p>
          </div>
        ) : (
          filteredScans.map((scan, index) => {
            const isDropOff =
              scan.scanType === 'ลงรถ' || (scan.scanType && scan.scanType.includes('ลง'));
            const statusLabel = isDropOff ? 'ลงรถ แล้ว' : 'ขึ้นรถ';

            return (
              <div
                key={`scan-${scan.id || scan.scanId || 'item'}-${index}`}
                onClick={() => onSelectScan(scan)}
                className="bg-slate-800/80 hover:bg-slate-800 border border-white/5 hover:border-amber-500/30 rounded-2xl p-3.5 flex flex-col gap-2.5 cursor-pointer transition-all active:scale-[0.98] shadow-sm group"
              >
                {/* Row 1: Header - Student Name, Code, Grade & Status Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Status Icon Box (No Photo/Avatar) */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isDropOff
                          ? 'bg-sky-500/15 border-sky-500/30 text-sky-400'
                          : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      }`}
                      title={statusLabel}
                    >
                      {isDropOff ? (
                        <LogOut className="w-4 h-4" />
                      ) : (
                        <LogIn className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-white truncate">
                          {scan.name}
                        </h4>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                          {scan.grade}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="font-mono">รหัส {scan.studentCode}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-medium">
                          {scan.busNumber || scan.carID}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge: 'ขึ้นรถ' or 'ลงรถ แล้ว' */}
                  <div className="shrink-0 flex items-center gap-2">
                    {isDropOff ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1.5 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                        ลงรถ แล้ว
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        ขึ้นรถ
                      </span>
                    )}
                    <span className="text-slate-500 text-xs group-hover:text-amber-400 transition-colors">➔</span>
                  </div>
                </div>

                {/* Row 2: วันที่ และ เวลา */}
                <div className="flex items-center justify-between text-xs bg-slate-900/60 px-3 py-1.5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-400">วันที่:</span>
                    <span className="font-medium text-slate-200">{scan.dateThai || '18 ก.ย. 2569'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-slate-400">เวลา:</span>
                    <span className="font-mono font-bold text-amber-300">{scan.timeThai || scan.time || '-'}</span>
                  </div>
                </div>

                {/* Row 3: พิกัด ละติจูด ลองติจูด และสถานที่ */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-slate-400 pt-0.5">
                  <div className="flex items-center gap-1 truncate text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate">{scan.locationName || 'จุดรับส่งนักเรียน'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono shrink-0 flex-wrap">
                    <span className="bg-slate-900/90 px-2 py-0.5 rounded-md border border-white/5 inline-flex items-center gap-1">
                      <span className="text-slate-400">ละติจูด:</span>
                      <span className="text-emerald-400 font-semibold">
                        {scan.latitude != null ? Number(scan.latitude).toFixed(5) : '-'}
                      </span>
                    </span>
                    <span className="bg-slate-900/90 px-2 py-0.5 rounded-md border border-white/5 inline-flex items-center gap-1">
                      <span className="text-slate-400">ลองติจูด:</span>
                      <span className="text-emerald-400 font-semibold">
                        {scan.longitude != null ? Number(scan.longitude).toFixed(5) : '-'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Voice Toggle (Bottom-Right FAB) */}
      <button
        className={`voice-fab ${soundEnabled ? 'active' : ''}`}
        id="btnVoice"
        type="button"
        onClick={onToggleSound}
        title={soundEnabled ? 'เสียงประกาศภาษาไทย: เปิดอยู่ (กดเพื่อปิด)' : 'เสียงประกาศภาษาไทย: ปิดอยู่ (กดเพื่อเปิด)'}
      >
        <span id="voiceIcon">{soundEnabled ? '🔊' : '🔇'}</span>
      </button>

      {/* Clear Confirmation Modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 max-w-xs w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-xl mx-auto">
              🗑️
            </div>
            <div>
              <h3 className="text-base font-bold text-white">ล้างรายการสแกนทั้งหมด?</h3>
              <p className="text-xs text-slate-400 mt-1">
                การกระทำนี้จะลบประวัติการสแกนเฉพาะในเครื่องนี้
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmClear}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500 shadow-md shadow-rose-600/30"
              >
                ลบข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
