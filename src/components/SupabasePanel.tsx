import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Download,
  RefreshCw,
  ExternalLink,
  Layers,
  Key,
  Globe,
  Radio,
  FileCode,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  isSupabaseConnected,
} from '../services/supabaseClient';

interface SupabasePanelProps {
  onSyncFromSupabase?: () => Promise<void>;
  isSyncingSupabase?: boolean;
}

export const SupabasePanel: React.FC<SupabasePanelProps> = ({
  onSyncFromSupabase,
  isSyncingSupabase = false,
}) => {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [dbStats, setDbStats] = useState<{ students?: number; cars?: number; scans?: number } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlViewer, setShowSqlViewer] = useState(false);
  const [sqlContent, setSqlContent] = useState<string>('');
  const [isLoadingSql, setIsLoadingSql] = useState(false);

  useEffect(() => {
    const config = getStoredSupabaseConfig();
    setSupabaseUrl(config.url);
    setAnonKey(config.anonKey);
    setIsConnected(isSupabaseConnected());

    // Auto-test if config exists
    if (config.url && config.anonKey) {
      handleTest(config.url, config.anonKey);
    }
  }, []);

  const handleTest = async (urlToTest?: string, keyToTest?: string) => {
    setIsTesting(true);
    setStatusMessage(null);

    if (urlToTest && keyToTest) {
      saveSupabaseConfig(urlToTest, keyToTest);
    }

    const res = await testSupabaseConnection();
    setIsTesting(false);
    setIsConnected(res.success);
    setStatusMessage(res.message);

    if (res.success) {
      setDbStats({
        students: res.studentCount,
        cars: res.carCount,
        scans: res.scanCount,
      });
    } else {
      setDbStats(null);
    }
  };

  const handleSave = () => {
    saveSupabaseConfig(supabaseUrl, anonKey);
    handleTest(supabaseUrl, anonKey);
  };

  const handleDisconnect = () => {
    clearSupabaseConfig();
    setSupabaseUrl('');
    setAnonKey('');
    setIsConnected(false);
    setStatusMessage('ตัดการเชื่อมต่อ Supabase แล้ว');
    setDbStats(null);
  };

  const loadSqlContent = async () => {
    if (sqlContent) return;
    setIsLoadingSql(true);
    try {
      const res = await fetch('/supabase_schema.sql');
      if (res.ok) {
        const text = await res.text();
        setSqlContent(text);
      }
    } catch {
      // Fallback
      setSqlContent('-- ดูไฟล์ /supabase_schema.sql ในรากโปรเจกต์');
    } finally {
      setIsLoadingSql(false);
    }
  };

  const handleCopySql = async () => {
    if (!sqlContent) {
      await loadSqlContent();
    }
    try {
      const textToCopy = sqlContent || (await (await fetch('/supabase_schema.sql')).text());
      await navigator.clipboard.writeText(textToCopy);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-inner">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Supabase Database Hub
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-mono font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    PostgreSQL 100% Real-time
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  เชื่อมต่อตรงกับ Supabase ไร้ Mockup ข้อมูลจริง 300 นักเรียน, 5 รถรับส่ง, บันทึกการสแกน และการตั้งค่า
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>เชื่อมต่อ Supabase แล้ว</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>รอการเชื่อมต่อ</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Counters */}
        {dbStats && (
          <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-800">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
              <span className="text-slate-400 text-xs block">นักเรียนในฐานข้อมูล</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {dbStats.students ?? 300} คน
              </span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
              <span className="text-slate-400 text-xs block">รถรับส่งทั้งหมด</span>
              <span className="text-xl font-bold font-mono text-amber-400">
                {dbStats.cars ?? 5} คัน
              </span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
              <span className="text-slate-400 text-xs block">บันทึกการสแกนใน DB</span>
              <span className="text-xl font-bold font-mono text-cyan-400">
                {dbStats.scans ?? 0} รายการ
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Connection Settings Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">การเชื่อมต่อ Supabase API</h4>
          </div>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            <span>เปิด Supabase Console</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>Project URL (VITE_SUPABASE_URL)</span>
            </label>
            <input
              type="text"
              placeholder="https://xxxxxxxxxxxxxxxxxxxx.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Anon Public Key (VITE_SUPABASE_ANON_KEY)</span>
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
            />
          </div>
        </div>

        {statusMessage && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-start gap-2 border ${
              isConnected
                ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/50 border-rose-500/30 text-rose-300'
            }`}
          >
            {isConnected ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{statusMessage}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isTesting || !supabaseUrl || !anonKey}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-xs transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-900/30"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'กำลังตรวจสอบ...' : 'บันทึกและเชื่อมต่อ Supabase'}</span>
          </button>

          {onSyncFromSupabase && (
            <button
              type="button"
              onClick={() => onSyncFromSupabase()}
              disabled={isSyncingSupabase}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all flex items-center gap-2"
            >
              <Radio className={`w-3.5 h-3.5 text-teal-400 ${isSyncingSupabase ? 'animate-spin' : ''}`} />
              <span>{isSyncingSupabase ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูลสดจาก Supabase'}</span>
            </button>
          )}

          {isConnected && (
            <button
              type="button"
              onClick={handleDisconnect}
              className="px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 font-semibold text-xs border border-rose-800/40 transition-all ml-auto"
            >
              ตัดการเชื่อมต่อ
            </button>
          )}
        </div>
      </div>

      {/* SQL Script Generator & Viewer Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-white">
                SQL สร้างตาราง & ข้อมูลตัวอย่าง (supabase_schema.sql)
              </h4>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              คำสั่ง SQL พร้อมใช้งาน: สร้างตาราง 5 ตาราง, ตั้งค่า RLS, Realtime และ INSERT ข้อมูลครบถ้วนตามไฟล์แนบ
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopySql}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'คัดลอก SQL แล้ว!' : 'คัดลอก SQL ทั้งหมด'}</span>
            </button>

            <a
              href="/supabase_schema.sql"
              download="supabase_schema.sql"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด .sql</span>
            </a>
          </div>
        </div>

        {/* Structure breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-xs">
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
            <span className="font-mono text-emerald-400 font-bold block text-[11px]">public.cars</span>
            <span className="text-slate-300 text-[11px]">5 คัน (CAR01-05)</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
            <span className="font-mono text-blue-400 font-bold block text-[11px]">public.students</span>
            <span className="text-slate-300 text-[11px]">300 คน (STD0001-0300)</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
            <span className="font-mono text-amber-400 font-bold block text-[11px]">public.scans</span>
            <span className="text-slate-300 text-[11px]">บันทึกการสแกน GPS</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
            <span className="font-mono text-purple-400 font-bold block text-[11px]">public.users</span>
            <span className="text-slate-300 text-[11px]">3 บัญชีผู้ใช้ (Admin/Staff)</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
            <span className="font-mono text-rose-400 font-bold block text-[11px]">public.settings</span>
            <span className="text-slate-300 text-[11px]">10 รายการค่าระบบ</span>
          </div>
        </div>

        {/* Toggle Code Viewer */}
        <div className="pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => {
              if (!showSqlViewer && !sqlContent) {
                loadSqlContent();
              }
              setShowSqlViewer(!showSqlViewer);
            }}
            className="text-xs text-slate-400 hover:text-white flex items-center justify-between w-full py-1.5 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>แสดงตัวอย่างโค้ด SQL สร้างตาราง (DDL & INSERT)</span>
            </span>
            {showSqlViewer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showSqlViewer && (
            <div className="mt-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>SQL Script: supabase_schema.sql</span>
                <span className="font-mono text-slate-500">PostgreSQL syntax</span>
              </div>
              <pre className="font-mono text-[11px] text-emerald-300 bg-slate-900/90 p-3 rounded-xl border border-slate-800 max-h-80 overflow-y-auto whitespace-pre-wrap">
                {isLoadingSql ? 'กำลังโหลดคำสั่ง SQL...' : sqlContent || 'โหลดข้อมูลเรียบร้อย (คลิกคัดลอกด้านบน)'}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Guide step-by-step */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 text-xs text-slate-400 space-y-2">
        <h5 className="font-bold text-slate-200">🚀 ขั้นตอนนำไปใช้งานใน Supabase (30 วินาที):</h5>
        <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-300">
          <li>
            เข้าสู่ระบบที่ <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline">supabase.com</a> และสร้างโปรเจกต์ใหม่ (New Project)
          </li>
          <li>
            ไปที่เมนู <strong className="text-white">SQL Editor</strong> จากแถบด้านซ้าย
          </li>
          <li>
            กดปุ่ม <strong className="text-blue-400">"คัดลอก SQL ทั้งหมด"</strong> ด้านบน แล้ววางลงใน SQL Editor จากนั้นกด <strong className="text-emerald-400">Run</strong>
          </li>
          <li>
            ไปที่เมนู <strong className="text-white">Project Settings &gt; API</strong> เพื่อคัดลอก <strong>Project URL</strong> และ <strong>anon public key</strong>
          </li>
          <li>
            นำมากรอกในช่องด้านบน หรือใส่ในไฟล์ <code className="text-amber-300">.env</code> เป็น <code className="text-amber-300">VITE_SUPABASE_URL</code> และ <code className="text-amber-300">VITE_SUPABASE_ANON_KEY</code>
          </li>
        </ol>
      </div>
    </div>
  );
};
