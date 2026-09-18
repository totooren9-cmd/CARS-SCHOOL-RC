import React from 'react';
import { Bus, CheckCircle2, Volume2, VolumeX, Zap } from 'lucide-react';
import { ScanRecord } from '../types';

interface DynamicIslandProps {
  activeScan: ScanRecord | null;
  totalScans: number;
  torchOn: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isScanningActive: boolean;
}

export const DynamicIsland: React.FC<DynamicIslandProps> = ({
  activeScan,
  totalScans,
  torchOn,
  soundEnabled,
  onToggleSound,
  isScanningActive,
}) => {
  return (
    <div className="w-full flex justify-center pt-2 px-4 pointer-events-auto">
      <div
        id="ios-dynamic-island"
        className={`relative z-20 transition-all duration-300 ease-out bg-black/90 text-white backdrop-blur-xl border border-white/15 shadow-2xl rounded-full px-4 py-2 flex items-center justify-between gap-3 ${
          activeScan
            ? activeScan.scanType === 'ลงรถ'
              ? 'w-full max-w-sm border-sky-500/50 ring-2 ring-sky-500/30'
              : 'w-full max-w-sm border-emerald-500/50 ring-2 ring-emerald-500/30'
            : 'w-72'
        }`}
      >
        {activeScan ? (
          // Expanded dynamic island state after scan
          <div className="flex items-center justify-between w-full py-0.5 animate-fadeIn">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div
                className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 ${
                  activeScan.scanType === 'ลงรถ'
                    ? 'bg-sky-500/20 border-sky-400 text-sky-400'
                    : 'bg-emerald-500/20 border-emerald-400 text-emerald-400'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="truncate text-left">
                <div className="text-xs font-bold text-white truncate">
                  {activeScan.name}
                </div>
                <div
                  className={`text-[10px] font-medium ${
                    activeScan.scanType === 'ลงรถ' ? 'text-sky-300' : 'text-emerald-300'
                  }`}
                >
                  {activeScan.grade} • {activeScan.scanType === 'ลงรถ' ? 'ลงรถ แล้ว' : 'ขึ้นรถ สำเร็จ'}
                </div>
              </div>
            </div>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-mono text-slate-300 shrink-0">
              #{totalScans}
            </span>
          </div>
        ) : (
          // Compact idle state
          <>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bus className="w-3.5 h-3.5 text-amber-400" />
                {isScanningActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                )}
              </div>
              <span className="text-xs font-semibold text-slate-200">
                School Bus #1
              </span>
            </div>

            <div className="flex items-center gap-2">
              {torchOn && (
                <span className="text-amber-400 flex items-center" title="ไฟฉายเปิดอยู่">
                  <Zap className="w-3 h-3 fill-amber-400" />
                </span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSound();
                }}
                className="text-slate-300 hover:text-white transition-colors p-1"
                title={soundEnabled ? 'เปิดเสียงอยู่ (กดเพื่อปิด)' : 'ปิดเสียงอยู่ (กดเพื่อเปิด)'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>
              <div className="h-2.5 w-[1px] bg-slate-700"></div>
              <span className="text-[11px] font-mono text-emerald-400 font-medium">
                {totalScans} คน
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
