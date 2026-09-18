import React, { useRef, useState, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { ScanRecord } from '../types';

interface CameraHalfProps {
  onScanSuccess: (studentData: { studentCode?: string; rawText: string; source: 'camera' | 'upload' | 'simulated' }) => void;
  onSimulateScan: () => void;
  activeScan: ScanRecord | null;
  totalScans: number;
  isSupabaseReady?: boolean;
  onOpenSupabaseConfig?: () => void;
}

export const CameraHalf: React.FC<CameraHalfProps> = ({
  onScanSuccess,
  onSimulateScan,
  activeScan,
  totalScans,
  isSupabaseReady = false,
  onOpenSupabaseConfig,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [torchError, setTorchError] = useState<boolean>(false);
  const [isScanningCooldown, setIsScanningCooldown] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Stop camera tracks
  const stopScanner = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setTorchOn(false);
  }, []);

  // Frame processing loop with jsQR
  const scanLoop = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) return;

    const video = videoRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data && !isScanningCooldown) {
          setIsScanningCooldown(true);
          onScanSuccess({
            rawText: code.data,
            source: 'camera',
          });
          // 2.2s cooldown before next scan
          setTimeout(() => {
            setIsScanningCooldown(false);
          }, 2200);
        }
      }
    }

    animationFrameId.current = requestAnimationFrame(scanLoop);
  }, [isCameraActive, isScanningCooldown, onScanSuccess]);

  // Start real camera
  const startScanner = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('กล้องไม่รองรับในอุปกรณ์นี้');
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      setIsCameraActive(true);
    } catch (err) {
      console.warn('Camera start error:', err);
      // Fallback: If hardware camera fails or is blocked in iframe, notify and stay on cover
      alert('ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตสิทธิ์กล้อง หรือใช้ปุ่ม "คลังรูป" / "จำลองสแกน"');
    }
  };

  useEffect(() => {
    if (isCameraActive) {
      animationFrameId.current = requestAnimationFrame(scanLoop);
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isCameraActive, scanLoop]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  // Toggle Torch / Flashlight
  const toggleFlash = async () => {
    if (!streamRef.current) {
      setTorchError(true);
      setTimeout(() => setTorchError(false), 2000);
      return;
    }
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as { torch?: boolean };
      if (capabilities.torch) {
        try {
          const nextTorch = !torchOn;
          await track.applyConstraints({
            // @ts-expect-error torch is valid in modern mobile browsers
            advanced: [{ torch: nextTorch }],
          });
          setTorchOn(nextTorch);
        } catch {
          setTorchError(true);
          setTimeout(() => setTorchError(false), 2000);
        }
      } else {
        setTorchError(true);
        setTimeout(() => setTorchError(false), 2000);
      }
    }
  };

  // Open photo gallery
  const openGallery = () => {
    fileInputRef.current?.click();
  };

  // Upload image file to scan QR
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code && code.data) {
          onScanSuccess({
            rawText: code.data,
            source: 'upload',
          });
        } else {
          alert('ไม่พบ QR Code ในรูปภาพที่เลือก กรุณาลองรูปใหม่อีกครั้ง');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="camera-half">
      {/* Dynamic Island & Cloud Status */}
      <div className="flex flex-col items-center gap-1.5 z-20 pointer-events-auto">
        <div className="dynamic-island">
          <span className="di-dot"></span>
          <span className="di-text">
            {activeScan ? `✓ ${activeScan.name} (${activeScan.grade})` : `QR SCAN • ${totalScans} คน`}
          </span>
        </div>

        {onOpenSupabaseConfig && (
          <button
            type="button"
            onClick={onOpenSupabaseConfig}
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1.5 backdrop-blur-md transition-all shadow-sm ${
              isSupabaseReady
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/80'
                : 'bg-amber-950/80 text-amber-300 border border-amber-500/40 hover:bg-amber-900/80 animate-pulse'
            }`}
            title={isSupabaseReady ? 'Supabase เชื่อมต่อพร้อมบันทึกอัตโนมัติ' : 'คลิกเพื่อตั้งค่า Supabase'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSupabaseReady ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span>{isSupabaseReady ? 'Supabase Cloud: บันทึกอัตโนมัติ' : 'Supabase: ยังไม่เชื่อมต่อ (แตะตั้งค่า)'}</span>
          </button>
        )}
      </div>

      <div id="cameraStage" className="camera-stage">
        {/* Hidden Canvas for QR frame processing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Video stream when camera active */}
        <div id="qr-reader" className="qr-reader">
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className="w-full h-full object-cover"
            style={{ display: isCameraActive ? 'block' : 'none' }}
          />
        </div>

        {/* QR Overlay Frame */}
        {isCameraActive && (
          <div className="qr-overlay" id="qrOverlay">
            <div className="qr-frame">
              <span className="corner tl"></span>
              <span className="corner tr"></span>
              <span className="corner bl"></span>
              <span className="corner br"></span>
              <div className="scan-line"></div>
            </div>
            <div className="qr-hint" id="qrHint">วาง QR Code ในกรอบ</div>
          </div>
        )}

        {/* Start Cover (When camera is not active) */}
        {!isCameraActive && (
          <div className="camera-cover" id="cameraCover">
            <div className="cover-icon">📷</div>
            <h2>พร้อมสแกน?</h2>
            <p>กดปุ่มด้านล่างเพื่อเปิดกล้องหลัง</p>
            <button
              className="btn-ios-primary"
              id="btnStartScan"
              onClick={startScanner}
              type="button"
            >
              <span>เริ่มสแกน QR Code</span>
            </button>
          </div>
        )}

        {/* Top Controls */}
        <div className="cam-controls">
          <button
            className={`cam-btn ${torchOn ? 'active' : ''}`}
            id="btnFlash"
            onClick={toggleFlash}
            type="button"
            title="ไฟฉาย"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
            </svg>
          </button>

          <button
            className="cam-btn"
            onClick={openGallery}
            type="button"
            title="คลังรูป"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </button>

          <button
            className="cam-btn"
            onClick={onSimulateScan}
            type="button"
            title="จำลอง"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </button>

          {isCameraActive && (
            <button
              className="cam-btn"
              onClick={() => {
                const nextMode = facingMode === 'environment' ? 'user' : 'environment';
                setFacingMode(nextMode);
                stopScanner();
                setTimeout(() => startScanner(), 100);
              }}
              type="button"
              title="สลับกล้อง"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 10c0-4.418-3.582-8-8-8s-8 3.582-8 8c0 2.21 1.006 4.21 2.607 5.568L4 20l4.432-2.607C9.79 17.794 10.79 18 12 18c4.418 0 8-3.582 8-8z" />
              </svg>
            </button>
          )}
        </div>

        <input
          type="file"
          id="galleryInput"
          ref={fileInputRef}
          accept="image/*"
          onChange={handlePhotoUpload}
          style={{ display: 'none' }}
        />

        <div id="torchNote" className={`torch-note ${torchError ? '' : 'hidden'}`}>
          ไฟฉายไม่พร้อมใช้งาน
        </div>
      </div>
    </div>
  );
};
