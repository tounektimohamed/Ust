import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  QrCode,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  RotateCcw,
  Volume2,
  Calendar,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Member, SportsGroup, Subscription } from '../types';

interface AttendanceScannerModalProps {
  selectedGroup: SportsGroup;
  sessionDate: string;
  onClose: () => void;
}

export const AttendanceScannerModal: React.FC<AttendanceScannerModalProps> = ({
  selectedGroup,
  sessionDate,
  onClose,
}) => {
  const { members, subscriptions, attendance, recordAttendance } = useData();
  const { profile } = useAuth();

  const [scannedCode, setScannedCode] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{
    status: 'success' | 'duplicate' | 'expired' | 'not_found';
    member?: Member;
    subscription?: Subscription;
    message: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Group members
  const groupMembers = members.filter(
    (m) => (m.groupId === selectedGroup.id || m.category === selectedGroup.category) && m.status !== 'archived'
  );

  // Existing attendance in this session
  const sessionAttendance = attendance.filter(
    (a) => a.groupId === selectedGroup.id && a.sessionDate === sessionDate
  );

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsScanning(true);
      } else {
        setCameraError('الكاميرا غير متوفرة في هذا المتصفح، يمكنك استخدام المسح اليدوي السريع أدناه.');
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('تعذر فتح الكاميرا (يرجى منح صلاحية الكاميرا). يمكنك اختيار اللاعب مباشرة أو كتابة المعرف.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const processScannedCode = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    // Find member by QR code or memberNumber or ID
    const member = members.find(
      (m) =>
        m.qrCode === trimmed ||
        m.memberNumber.toLowerCase() === trimmed.toLowerCase() ||
        m.id === trimmed
    );

    if (!member) {
      setScanResult({
        status: 'not_found',
        message: `رمز QR غير معروف: "${trimmed}". لا يوجد لاعب مسجل بهذا المعرف.`,
      });
      return;
    }

    // Check if already registered in this session (Duplicate check as per specs 8.1 & 8.2)
    const alreadyPresent = sessionAttendance.some((a) => a.memberId === member.id);
    if (alreadyPresent) {
      setScanResult({
        status: 'duplicate',
        member,
        message: `اللاعب ${member.firstName} ${member.lastName} مسجل حضوره بالفعل في هذه الحصة اليوم!`,
      });
      return;
    }

    // Check subscription status
    const sub = subscriptions.find((s) => s.memberId === member.id && s.status !== 'suspended');
    const isExpired = !sub || sub.status === 'expired' || new Date(sub.endDate) < new Date(sessionDate);

    // Record attendance
    await recordAttendance([
      {
        groupId: selectedGroup.id,
        groupName: selectedGroup.name,
        sessionDate,
        sessionTime: new Date().toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit' }),
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`,
        memberNumber: member.memberNumber,
        status: 'present',
        method: 'qr',
        recordedBy: profile?.displayName || 'المدرب',
        notes: isExpired ? 'تنبيه: الاشتراك منتهٍ' : 'حضور مؤكد عبر رمز QR',
      },
    ]);

    if (isExpired) {
      setScanResult({
        status: 'expired',
        member,
        subscription: sub,
        message: `تم تسجيل الحضور، ولكن اشتراك اللاعب ${member.firstName} منتهٍ! يرجى تسوية الوضعية مع أمين المال.`,
      });
    } else {
      setScanResult({
        status: 'success',
        member,
        subscription: sub,
        message: `تم تسجيل حضور اللاعب ${member.firstName} ${member.lastName} بنجاح!`,
      });
    }

    setManualCode('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto no-print">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-auto text-slate-100">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-900/60 border border-red-700 text-red-400 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                مسح حضور اللاعبين بتقنية QR
              </h3>
              <p className="text-xs text-slate-400">
                {selectedGroup.name} • {sessionDate}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {/* Active Session Stats Banner */}
          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-4 h-4 text-red-400" />
              <span>تاريخ الحصة: <strong className="text-white">{sessionDate}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>الحاضرون اليوم: <strong className="text-emerald-400 text-sm">{sessionAttendance.length}</strong> / {groupMembers.length}</span>
            </div>
          </div>

          {/* Camera Viewport or Fallback */}
          <div className="relative w-full h-56 sm:h-64 bg-black rounded-xl overflow-hidden border-2 border-slate-700 flex items-center justify-center">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${!isScanning ? 'hidden' : ''}`}
              playsInline
              muted
            />

            {/* Target Reticle overlay */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-44 h-44 border-2 border-red-500 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-red-400" />
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-red-400" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-red-400" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-red-400" />
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500/80 animate-pulse" />
                </div>
              </div>
            )}

            {!isScanning && (
              <div className="text-center p-4">
                <Camera className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">
                  {cameraError || 'الكاميرا غير نشطة حالياً'}
                </p>
                <button
                  onClick={startCamera}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
                >
                  إعادة تشغيل الكاميرا
                </button>
              </div>
            )}
          </div>

          {/* Scan Feedback Result Card */}
          {scanResult && (
            <div
              className={`p-4 rounded-xl border text-sm transition animate-in fade-in slide-in-from-top-2 ${
                scanResult.status === 'success'
                  ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200'
                  : scanResult.status === 'expired'
                  ? 'bg-amber-950/60 border-amber-600 text-amber-200'
                  : scanResult.status === 'duplicate'
                  ? 'bg-blue-950/60 border-blue-600 text-blue-200'
                  : 'bg-red-950/60 border-red-600 text-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {scanResult.status === 'success' ? (
                  <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                ) : scanResult.status === 'expired' ? (
                  <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                ) : scanResult.status === 'duplicate' ? (
                  <UserCheck className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                )}

                <div className="flex-1">
                  <p className="font-bold text-white text-base mb-1">{scanResult.message}</p>
                  {scanResult.member && (
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-700/60 text-xs text-slate-300">
                      <span>الرقم: <strong className="text-white">{scanResult.member.memberNumber}</strong></span>
                      <span>الصنف: <strong className="text-white">{scanResult.member.category}</strong></span>
                      {scanResult.subscription && (
                        <span>
                          نهاية الاشتراك: <strong className={scanResult.status === 'expired' ? 'text-red-400' : 'text-emerald-400'}>
                            {scanResult.subscription.endDate}
                          </strong>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Manual Code Input / Fast Click for Pitch Test */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-slate-300">
              إدخال رمز QR أو اختيار سريع للاعب من المجموعة:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="أدخل معرّف اللاعب (مثل: UST-2026-001)"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    processScannedCode(manualCode);
                  }
                }}
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500"
              />
              <button
                onClick={() => processScannedCode(manualCode)}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition"
              >
                تسجيل
              </button>
            </div>

            {/* Quick Player Badges to tap for testing */}
            <div className="pt-2 border-t border-slate-800">
              <p className="text-[11px] text-slate-400 mb-2">لاعبو المجموعة (اضغط للمحاكاة الفورية لمسح QR):</p>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {groupMembers.map((m) => {
                  const isPresent = sessionAttendance.some((a) => a.memberId === m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => processScannedCode(m.qrCode || m.memberNumber)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 ${
                        isPresent
                          ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-red-600 hover:text-white'
                      }`}
                    >
                      <span>{isPresent ? '✓' : '•'}</span>
                      <span>{m.firstName} {m.lastName}</span>
                      <span className="text-[10px] text-slate-500">({m.memberNumber})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-800 border-t border-slate-700 flex justify-between items-center text-xs text-slate-400">
          <span>يتم حفظ وتوثيق الحضور فورياً سواء أكنت متصلاً أو في وضع عدم الاتصال</span>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition"
          >
            إتمام المسح
          </button>
        </div>
      </div>
    </div>
  );
};
