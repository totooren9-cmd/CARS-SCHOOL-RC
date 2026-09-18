import React, { useState } from 'react';
import { ScanRecord, Student } from '../types';

interface CardDetailModalProps {
  scan: ScanRecord | null;
  studentDetails?: Student;
  onClose: () => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  scan,
  studentDetails,
  onClose,
}) => {
  const [showMapModal, setShowMapModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  if (!scan) return null;

  const coordsString = `${scan.latitude.toFixed(6)}, ${scan.longitude.toFixed(6)}`;
  const googleMapsUrl = `https://www.google.com/maps?q=${scan.latitude},${scan.longitude}`;
  const embedMapsUrl = `https://maps.google.com/maps?q=${scan.latitude},${scan.longitude}&hl=th&z=16&output=embed`;

  const copyCoords = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(coordsString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {/* ============ RESULT DETAIL SHEET ============ */}
      <div
        className={`sheet-overlay ${scan && !showMapModal ? 'active' : ''}`}
        id="detailSheet"
        onClick={onClose}
      >
        <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="sheet-grabber"></div>
          <div className="sheet-content w-full text-left" id="detailContent">
            {/* Header */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div>
                <span className="text-[11px] font-mono text-amber-400">
                  {scan.scanId}
                </span>
                <h3 className="text-base font-bold text-white">
                  ข้อมูลการสแกนขึ้นรถ
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Student Profile Card */}
            <div className="w-full flex items-center gap-3 bg-slate-800/80 p-3 rounded-2xl border border-white/10 mb-3">
              <img
                src={scan.avatar}
                alt={scan.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-amber-400"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-base font-bold text-white truncate">
                  {scan.name}
                </h4>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                    {scan.grade}
                  </span>
                  <span>รหัสนักเรียน: {scan.studentCode}</span>
                </div>
              </div>
            </div>

            {/* Info Rows */}
            <div className="w-full space-y-2 text-xs text-slate-300 mb-4">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-white/5">
                <span className="text-slate-400">🚌 สายรถประจำทาง:</span>
                <span className="font-semibold text-white">{scan.busNumber}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-white/5">
                <span className="text-slate-400">📅 วันที่สแกน:</span>
                <span className="font-semibold text-white">{scan.dateThai}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-white/5">
                <span className="text-slate-400">⏰ เวลาที่สแกน:</span>
                <span className="font-semibold text-emerald-400">{scan.timeThai}</span>
              </div>
              {studentDetails?.parentPhone && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-white/5">
                  <span className="text-slate-400">📞 ผู้ปกครอง:</span>
                  <a href={`tel:${studentDetails.parentPhone}`} className="font-semibold text-blue-400 underline">
                    {studentDetails.parentPhone}
                  </a>
                </div>
              )}
              <div className="p-3 rounded-2xl bg-slate-800/60 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">📍 จุดที่สแกน:</span>
                  <span className="font-semibold text-amber-300">{scan.locationName}</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px] bg-slate-900/80 p-2 rounded-xl">
                  <span className="text-slate-400 truncate">{coordsString}</span>
                  <button
                    type="button"
                    onClick={copyCoords}
                    className="px-2 py-1 rounded bg-slate-700 text-slate-200 hover:text-white text-[10px]"
                  >
                    {copied ? '✓ คัดลอกแล้ว' : 'คัดลอกพิกัด'}
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="w-full flex gap-2">
              <button
                type="button"
                className="btn-ios-primary flex-1 text-xs"
                onClick={() => setShowMapModal(true)}
              >
                🗺️ ดูแผนที่ในแอป
              </button>
              <button
                type="button"
                className="btn-ios-plain flex-1 text-xs bg-slate-800/80 text-white rounded-full"
                onClick={onClose}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============ MAP MODAL ============ */}
      <div
        className={`sheet-overlay ${showMapModal ? 'active' : ''}`}
        id="mapModal"
        onClick={() => setShowMapModal(false)}
      >
        <div className="bottom-sheet full" onClick={(e) => e.stopPropagation()}>
          <div className="sheet-grabber"></div>
          <div className="map-container">
            <iframe
              id="mapIframe"
              src={embedMapsUrl}
              allowFullScreen
              loading="lazy"
              title="ตำแหน่งสแกนขึ้นรถ"
            ></iframe>
          </div>
          <div className="map-foot">
            <div id="mapInfo" className="text-xs text-slate-300 flex justify-between">
              <span>📍 {scan.locationName} ({scan.name})</span>
              <span className="font-mono text-emerald-400">{scan.timeThai}</span>
            </div>
            <div className="flex gap-2">
              <a
                id="mapOpenBtn"
                className="btn-ios-primary flex-1"
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                🗺️ เปิดใน Google Maps
              </a>
              <button
                type="button"
                className="btn-ios-plain px-4 bg-slate-800 text-slate-300 rounded-full text-xs"
                onClick={() => setShowMapModal(false)}
              >
                กลับ
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
