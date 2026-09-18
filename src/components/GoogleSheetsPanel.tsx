import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Link2,
  LogOut,
  AlertCircle,
  Send,
  Zap,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  googleSignOut,
  getAccessToken,
} from '../services/googleAuth';
import {
  createNewSpreadsheet,
  appendScansToSheet,
  checkSpreadsheetAccess,
  syncToAppsScriptWebhook,
  DEFAULT_APPS_SCRIPT_URL,
  RECOMMENDED_APPS_SCRIPT_CODE,
} from '../services/googleSheets';
import { ScanRecord } from '../types';

interface GoogleSheetsPanelProps {
  scans: ScanRecord[];
  appsScriptUrl: string;
  onUpdateAppsScriptUrl: (url: string) => void;
  connectedSheetId: string;
  onUpdateConnectedSheetId: (id: string, url: string, title?: string) => void;
  connectedSheetTitle: string;
  connectedSheetUrl: string;
  autoSyncEnabled: boolean;
  onToggleAutoSync: () => void;
  onRefreshFromGoogleSheets?: () => Promise<void>;
  isSyncingSheets?: boolean;
}

export const GoogleSheetsPanel: React.FC<GoogleSheetsPanelProps> = ({
  scans,
  appsScriptUrl,
  onUpdateAppsScriptUrl,
  connectedSheetId,
  onUpdateConnectedSheetId,
  connectedSheetTitle,
  connectedSheetUrl,
  autoSyncEnabled,
  onToggleAutoSync,
  onRefreshFromGoogleSheets,
  isSyncingSheets = false,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sheet creation / linking state
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [inputSheetId, setInputSheetId] = useState(connectedSheetId || '');
  const [isLinkingSheet, setIsLinkingSheet] = useState(false);
  const [sheetSuccessMessage, setSheetSuccessMessage] = useState<string | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState<string | null>(null);
  const [showConfirmSync, setShowConfirmSync] = useState(false);

  // Apps script test state
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<string | null>(null);
  const [showScriptHelper, setShowScriptHelper] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyAppsScriptCode = () => {
    navigator.clipboard.writeText(RECOMMENDED_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  useEffect(() => {
    initAuth(
      (user) => {
        setCurrentUser(user);
        setAuthError(null);
      },
      () => {
        setCurrentUser(null);
      }
    );
  }, []);

  // Handle Google Sign in
  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setCurrentUser(res.user);
      }
    } catch (err: unknown) {
      console.error('Google Sign In Error:', err);
      setAuthError(
        err instanceof Error ? err.message : 'ไม่สามารถเข้าสู่ระบบ Google ได้'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle Google Sign out
  const handleGoogleLogout = async () => {
    await googleSignOut();
    setCurrentUser(null);
  };

  // Create new Google Sheet
  const handleCreateNewSheet = async () => {
    setAuthError(null);
    setSheetSuccessMessage(null);
    setIsCreatingSheet(true);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('กรุณาลงชื่อเข้าใช้ด้วย Google ก่อนดำเนินการ');
      }

      const res = await createNewSpreadsheet(
        'บันทึกสแกนขึ้นรถโรงเรียน (School Bus Attendance)',
        token
      );

      onUpdateConnectedSheetId(
        res.spreadsheetId,
        res.spreadsheetUrl,
        'บันทึกสแกนขึ้นรถโรงเรียน (School Bus Attendance)'
      );

      // Auto-append existing scans if any
      if (scans.length > 0) {
        await appendScansToSheet(res.spreadsheetId, scans, token);
      }

      setSheetSuccessMessage(
        `สร้าง Google Sheet สำเร็จแล้ว และซิงค์ข้อมูล ${scans.length} รายการเรียบร้อย!`
      );
    } catch (err: unknown) {
      setAuthError(
        err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้าง Google Sheet'
      );
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Link existing Google Sheet ID or URL
  const handleLinkExistingSheet = async () => {
    if (!inputSheetId.trim()) return;
    setAuthError(null);
    setIsLinkingSheet(true);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('กรุณาลงชื่อเข้าใช้ด้วย Google ก่อนเชื่อมต่อสเปรดชีต');
      }

      // Extract ID from full URL if pasted
      let extractedId = inputSheetId.trim();
      const match = extractedId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        extractedId = match[1];
      }

      const details = await checkSpreadsheetAccess(extractedId, token);
      const url = `https://docs.google.com/spreadsheets/d/${extractedId}`;

      onUpdateConnectedSheetId(extractedId, url, details.title);
      setSheetSuccessMessage(`เชื่อมต่อกับ "${details.title}" เรียบร้อยแล้ว`);
    } catch (err: unknown) {
      setAuthError(
        err instanceof Error ? err.message : 'ไม่สามารถเชื่อมต่อ Google Sheet นี้ได้'
      );
    } finally {
      setIsLinkingSheet(false);
    }
  };

  // Confirm and sync all scans to Google Sheet & Webhook
  const handleExecuteSync = async () => {
    setShowConfirmSync(false);
    setIsSyncing(true);
    setSyncStatusText(null);

    let gasCount = 0;
    let sheetCount = 0;

    try {
      // 1. Send all scans to Apps Script Webhook
      for (const scan of scans) {
        const gasRes = await syncToAppsScriptWebhook(appsScriptUrl, scan);
        if (gasRes.success) gasCount++;
      }

      // 2. If connected to Google Sheet via OAuth token, append
      if (connectedSheetId) {
        const token = await getAccessToken();
        if (token) {
          await appendScansToSheet(connectedSheetId, scans, token);
          sheetCount = scans.length;
        }
      }

      setSyncStatusText(
        `ซิงค์สำเร็จ! ส่งเข้า Apps Script ${gasCount} รายการ ${
          sheetCount > 0 ? `และเพิ่มลง Google Sheet ${sheetCount} รายการ` : ''
        }`
      );
    } catch (err: unknown) {
      setSyncStatusText(
        err instanceof Error ? `ข้อผิดพลาด: ${err.message}` : 'การซิงค์ล้มเหลว'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // Test Apps Script Webhook URL
  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    setWebhookTestResult(null);

    const testScan: ScanRecord = {
      id: `test-${Date.now()}`,
      scanId: 'TEST-CONNECTION',
      timestamp: Date.now(),
      dateThai: '18 ก.ย. 2569',
      timeThai: '07:00:00 น.',
      studentId: 'test-std',
      studentCode: '99999',
      name: 'ทดสอบเชื่อมต่อระบบ (Connection Test)',
      grade: 'ม.1/1',
      busNumber: 'สาย 1 (สีส้ม)',
      locationName: 'จุดทดสอบระบบสแกน',
      latitude: 13.7548,
      longitude: 100.4982,
      scanSource: 'simulated',
      status: 'success',
    };

    const res = await syncToAppsScriptWebhook(appsScriptUrl, testScan);
    setIsTestingWebhook(false);
    setWebhookTestResult(
      res.success
        ? 'เชื่อมต่อ Google Apps Script สำเร็จ! ส่งข้อมูลทดสอบเรียบร้อย'
        : 'เชื่อมต่อไม่สำเร็จ กรุณาตรวจสอบ URL หรือการ Publish Web App'
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  ระบบเชื่อมต่อ Google Sheets & Apps Script
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  READY
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                บันทึกประวัติการสแกนนักเรียนขึ้นรถโดยอัตโนมัติลงใน Google Spreadsheet
                และ Google Apps Script Web App แบบเรียลไทม์
              </p>
            </div>
          </div>

          {/* Quick Auto-Sync Toggle */}
          <div className="flex items-center gap-2.5 bg-slate-950/70 px-3.5 py-2 rounded-2xl border border-slate-800 shrink-0">
            <div className="text-right">
              <div className="text-xs font-semibold text-white">Auto-Sync</div>
              <div className="text-[10px] text-slate-400">ซิงค์ทันทีเมื่อสแกน</div>
            </div>
            <button
              type="button"
              onClick={onToggleAutoSync}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                autoSyncEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  autoSyncEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: Google Apps Script Web App Integration (Provided URL) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">
                Google Apps Script Web App (Webhook)
              </h4>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              Active Endpoint
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300 block">
              Web App URL (ส่งข้อมูลสแกนแบบอัตโนมัติ):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={appsScriptUrl}
                onChange={(e) => onUpdateAppsScriptUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleTestWebhook}
                disabled={isTestingWebhook}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 border border-slate-700 transition-colors shrink-0 disabled:opacity-50"
              >
                {isTestingWebhook ? 'กำลังทดสอบ...' : 'ทดสอบส่ง'}
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
              <span>URL เริ่มต้นที่ระบุไว้ในระบบ</span>
              <button
                type="button"
                onClick={() => onUpdateAppsScriptUrl(DEFAULT_APPS_SCRIPT_URL)}
                className="text-emerald-400 hover:underline"
              >
                รีเซ็ตเป็นค่าเดิม
              </button>
            </div>

            {webhookTestResult && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  webhookTestResult.includes('สำเร็จ')
                    ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-950/50 text-rose-300 border border-rose-500/30'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{webhookTestResult}</span>
              </div>
            )}
          </div>

          {/* Sync action button */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              ข้อมูลปัจจุบัน: <strong className="text-white">{scans.length}</strong> รายการ
            </div>
            <button
              type="button"
              onClick={() => setShowConfirmSync(true)}
              disabled={isSyncing || scans.length === 0}
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>ซิงค์ข้อมูลสแกนทั้งหมดเดี๋ยวนี้</span>
            </button>
          </div>

          {syncStatusText && (
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncStatusText}</span>
            </div>
          )}
        </div>

        {/* SECTION 2: Direct Google Account & Google Drive/Sheets API */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-400" />
              <h4 className="text-sm font-bold text-white">
                Google Sheets API (Google Account)
              </h4>
            </div>
            {currentUser && (
              <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                Connected
              </span>
            )}
          </div>

          {/* Sign in with Google Button (GSI Style compliant with SKILL.md) */}
          {!currentUser ? (
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 text-center space-y-3">
              <p className="text-xs text-slate-300">
                ลงชื่อเข้าใช้ด้วยบัญชี Google เพื่อสร้างหรือเข้าถึง Google Sheets
                ใน Google Drive ของคุณโดยตรง
              </p>

              {/* Official Google Sign-In button specification */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSigningIn}
                className="w-full max-w-xs mx-auto py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs flex items-center justify-center gap-3 shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className="w-4 h-4"
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span>{isSigningIn ? 'กำลังเข้าสู่ระบบ...' : 'Sign in with Google'}</span>
              </button>
            </div>
          ) : (
            // Logged in Profile
            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google User'}
                    className="w-10 h-10 rounded-full border border-slate-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                    {currentUser.displayName?.charAt(0) || 'G'}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-xs text-white">
                    {currentUser.displayName || 'Google Account'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {currentUser.email}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGoogleLogout}
                className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors"
                title="ออกจากระบบ Google"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Connected Sheet Details */}
          {connectedSheetId ? (
            <div className="p-4 rounded-2xl bg-gradient-to-b from-blue-950/40 to-slate-900 border border-blue-500/30 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[10px] text-blue-300 font-mono uppercase">
                    Connected Spreadsheet
                  </div>
                  <div className="font-bold text-xs text-white mt-0.5">
                    {connectedSheetTitle || 'สเปรดชีตบันทึกการขึ้นรถ'}
                  </div>
                </div>
                <a
                  href={connectedSheetUrl || `https://docs.google.com/spreadsheets/d/${connectedSheetId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span>เปิดดูใน Google Sheets</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="text-[11px] font-mono text-slate-400 bg-slate-950/80 p-2 rounded-xl truncate border border-slate-800">
                ID: {connectedSheetId}
              </div>
            </div>
          ) : (
            // Options to Create or Link
            currentUser && (
              <div className="space-y-3 pt-1">
                {/* 1-Click Create Button */}
                <button
                  type="button"
                  onClick={handleCreateNewSheet}
                  disabled={isCreatingSheet}
                  className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    {isCreatingSheet
                      ? 'กำลังสร้าง Google Sheet...'
                      : 'สร้าง Google Sheet ใหม่ใน Drive ทันที (1-Click)'}
                  </span>
                </button>

                <div className="text-center text-[11px] text-slate-500">หรือ</div>

                {/* Link existing */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputSheetId}
                    onChange={(e) => setInputSheetId(e.target.value)}
                    placeholder="วางลิงก์ หรือ ID ของ Google Sheet ที่มีอยู่..."
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleLinkExistingSheet}
                    disabled={isLinkingSheet || !inputSheetId.trim()}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-blue-400 border border-slate-700 transition-colors shrink-0 disabled:opacity-50"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          )}

          {sheetSuccessMessage && (
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{sheetSuccessMessage}</span>
            </div>
          )}

          {authError && (
            <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: Live Sheet Structure & Data Fetching */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-white">
                โครงสร้าง 7 แผ่นงานใน Google Sheet (ตรงกับระบบขนส่ง)
              </h4>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              ระบบเชื่อมต่อตรงกับแผ่นงาน Google Sheet เพื่อดึงและบันทึกข้อมูลแบบ 2-Way
            </p>
          </div>

          {onRefreshFromGoogleSheets && (
            <button
              type="button"
              onClick={() => onRefreshFromGoogleSheets()}
              disabled={isSyncingSheets}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
              <span>{isSyncingSheets ? 'กำลังดึงข้อมูลชีต...' : 'ดึงข้อมูลนักเรียนและรถจาก Sheet'}</span>
            </button>
          )}
        </div>

        {/* 7 Sheets badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
            <span className="font-mono text-emerald-400 font-bold block text-[11px]">01_นักเรียน</span>
            <span className="text-slate-300 text-[11px]">StudentID, ชื่อ, ชั้น, หอ, สายรถ</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
            <span className="font-mono text-amber-400 font-bold block text-[11px]">02_รถ</span>
            <span className="text-slate-300 text-[11px]">CarID, ทะเบียน, คนขับ, พี่เลี้ยง</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
            <span className="font-mono text-blue-400 font-bold block text-[11px]">03_บันทึกการสแกน</span>
            <span className="text-slate-300 text-[11px]">เวลา, StudentID, พิกัด GPS, สถานะ</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
            <span className="font-mono text-purple-400 font-bold block text-[11px]">04_ผู้ใช้งาน</span>
            <span className="text-slate-300 text-[11px]">UserID, สิทธิ์ Admin/Driver</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
            <span className="font-mono text-cyan-400 font-bold block text-[11px]">05_ตั้งค่า</span>
            <span className="text-slate-300 text-[11px]">รอบเวลา, การแจ้งเตือน</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
            <span className="font-mono text-rose-400 font-bold block text-[11px]">06_สรุปประจำวัน</span>
            <span className="text-slate-300 text-[11px]">ยอดขึ้นรถแต่ละสาย, รายงาน</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl col-span-2">
            <span className="font-mono text-yellow-400 font-bold block text-[11px]">07_QR_Code</span>
            <span className="text-slate-300 text-[11px]">รหัส QR สำหรับสแกนขึ้นรถของนักเรียนทุกคน</span>
          </div>
        </div>

        {/* Apps Script Code Helper */}
        <div className="pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setShowScriptHelper(!showScriptHelper)}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center justify-between w-full py-1"
          >
            <span>
              💡 ดูโค้ด Google Apps Script (Code.gs) ที่รองรับทั้งหน้าเว็บและ API (doGet / doPost)
            </span>
            <span>{showScriptHelper ? '▲ ซ่อน' : '▼ แสดงโค้ด'}</span>
          </button>

          {showScriptHelper && (
            <div className="mt-3 space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">
                  Google Apps Script (Code.gs) - แนะนำวางทับหรือเพิ่มส่วน API
                </span>
                <button
                  type="button"
                  onClick={handleCopyAppsScriptCode}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{copiedCode ? '✓ คัดลอกแล้ว!' : 'คัดลอกโค้ดทั้งหมด'}</span>
                </button>
              </div>
              <pre className="text-[11px] font-mono text-slate-300 max-h-56 overflow-y-auto p-3 bg-slate-900 rounded-xl border border-slate-800 whitespace-pre-wrap">
                {RECOMMENDED_APPS_SCRIPT_CODE}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Bulk Sync (SKILL.md Destructive / Mutation requirement) */}
      {showConfirmSync && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">
                ยืนยันการซิงค์ข้อมูลลง Google Sheets?
              </h4>
              <p className="text-xs text-slate-300">
                ระบบจะส่งข้อมูลการสแกนขึ้นรถจำนวน <strong>{scans.length} รายการ</strong>{' '}
                ไปยัง Google Apps Script Web App และ Google Sheet ที่เชื่อมต่อไว้
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmSync(false)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleExecuteSync}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30"
              >
                ยืนยันการซิงค์
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
