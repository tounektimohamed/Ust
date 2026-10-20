import React, { useEffect, useState } from 'react';
import { X, Printer, QrCode, Download, ShieldCheck } from 'lucide-react';
import QRCode from 'qrcode';
import { Member } from '../types';

interface MemberCardModalProps {
  member: Member;
  onClose: () => void;
}

export const MemberCardModal: React.FC<MemberCardModalProps> = ({ member, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    // Generate QR code for technical ID
    QRCode.toDataURL(member.qrCode || member.memberNumber, {
      width: 240,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, [member]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto no-print">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-red-400" />
            <h3 className="text-sm sm:text-base font-bold text-white">
              بطاقة العضوية الذكية ورمز QR
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-semibold transition"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة البطاقة</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 bg-slate-950 flex flex-col items-center justify-center">
          {/* Physical Membership Card Preview */}
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-red-600/60 shadow-2xl text-white relative p-5 select-none print:shadow-none print:border-black"
            style={{ direction: 'rtl' }}
          >
            {/* Top Club Stripes */}
            <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-red-600 via-white to-blue-700" />

            <div className="flex items-start justify-between mb-4 mt-1">
              <div className="flex items-center gap-2.5">
                <img
                  src="/ust-logo.png"
                  alt="UST"
                  className="w-12 h-12 object-contain rounded-lg bg-white p-1 border border-slate-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/aistudio/IMG-20261019-WA0005_826b9955.jpg';
                  }}
                />
                <div>
                  <h4 className="text-sm font-black text-red-400 leading-tight">
                    الاتحاد الرياضي بتطاوين
                  </h4>
                  <p className="text-[10px] text-blue-300 font-bold">فرع الشبان • 1935</p>
                  <p className="text-[9px] text-slate-400">بطاقة لاعب موسم 2026/2027</p>
                </div>
              </div>

              <div className="text-left">
                <span className="text-[11px] font-mono font-bold bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded-md">
                  {member.memberNumber}
                </span>
              </div>
            </div>

            {/* Middle Section: Player Photo & Details & QR */}
            <div className="flex items-center gap-4 my-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              {/* Photo or placeholder */}
              <div className="w-20 h-24 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                {member.photoUrl ? (
                  <img src={member.photoUrl} alt={member.firstName} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-2">
                    <span className="text-2xl">⚽</span>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold">صورة اللاعب</p>
                  </div>
                )}
              </div>

              {/* Player details */}
              <div className="flex-1 space-y-1 text-xs">
                <p className="text-base font-extrabold text-white leading-tight">
                  {member.firstName} {member.lastName}
                </p>
                <p className="text-slate-300">
                  <span className="text-slate-400">الصنف:</span> <strong className="text-red-400">{member.category}</strong>
                </p>
                <p className="text-slate-300">
                  <span className="text-slate-400">تاريخ الميلاد:</span> {member.birthDate || '—'}
                </p>
                <p className="text-slate-300">
                  <span className="text-slate-400">هاتف الولي:</span> {member.parentPhone || member.phone || '—'}
                </p>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="flex items-center justify-between bg-white text-slate-950 rounded-xl p-3 shadow-inner">
              <div className="flex items-center gap-2">
                {qrDataUrl && (
                  <img src={qrDataUrl} alt="QR Code" className="w-18 h-18 rounded border border-slate-300" />
                )}
                <div className="text-right">
                  <p className="text-[11px] font-black text-red-700">رمز المرور والحضور</p>
                  <p className="text-[9px] text-slate-600 max-w-[130px] leading-tight mt-0.5">
                    يُمسح هذا الرمز عبر هاتف المدرب لتسجيل الحضور الفوري والتحقق من الاشتراك.
                  </p>
                </div>
              </div>

              <div className="text-left shrink-0 border-r border-slate-200 pr-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  مُصادق
                </span>
                <p className="text-[8px] text-slate-500 mt-1">UST TATAOUINE</p>
              </div>
            </div>

            {/* Bottom club stripe */}
            <div className="mt-3 text-center">
              <p className="text-[9px] text-slate-400 font-medium">
                ملعب المرحوم نجيب الخطاب • الاتحاد الرياضي بتطاوين «دوماً إلى الأمام»
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-800 border-t border-slate-700 flex justify-between items-center text-xs text-slate-400">
          <span>المعرّف التقني المشفر: {member.qrCode || member.memberNumber}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
