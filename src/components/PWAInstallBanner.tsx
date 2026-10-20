import React from 'react';
import { Download, Share, PlusSquare, X, Smartphone, WifiOff, QrCode } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, showAutoPrompt, install, dismissAutoPrompt, setShowAutoPrompt } = usePWAInstall();

  if (isInstalled || !showAutoPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200 no-print">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-slate-900 border border-red-800/60 shadow-2xl shadow-red-950/50 text-slate-100">
        {/* Top Header with club stripes */}
        <div className="h-2 w-full bg-gradient-to-r from-red-700 via-white to-blue-800" />
        
        {/* Close Button */}
        <button
          onClick={dismissAutoPrompt}
          aria-label="إغلاق"
          className="absolute top-4 left-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-5 sm:p-6 text-right">
          {/* Club Crest & Title */}
          <div className="flex items-center gap-3.5 mb-4">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white p-1 border-2 border-red-600 shadow-md shrink-0">
              <img
                src="/ust-logo.png"
                alt="شعار الاتحاد الرياضي بتطاوين"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-red-900/60 text-red-300 border border-red-700/50 mb-0.5">
                تطبيق الجمعية على الهاتف
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                الاتحاد الرياضي بتطاوين
              </h3>
              <p className="text-xs text-red-400 font-semibold">
                فرع الشبان • الموسم 2026/2027
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-300 mb-4 leading-relaxed">
            ثبّت التطبيق مباشرة على هاتفك أو حاسوبك لتجربة استخدام فائقة السرعة مع إمكانية العمل دون اتصال بالإنترنت.
          </p>

          {/* Key Advantages */}
          <div className="space-y-2 mb-5 bg-slate-950/60 rounded-xl p-3 border border-slate-800 text-xs">
            <div className="flex items-center gap-2.5 text-slate-200">
              <div className="w-6 h-6 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-800/40">
                <WifiOff className="w-3.5 h-3.5" />
              </div>
              <span>يعمل بالكامل دون إنترنت في الملعب مع مزامنة لاحقة تلقائياً</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-200">
              <div className="w-6 h-6 rounded-lg bg-blue-950 text-blue-400 flex items-center justify-center shrink-0 border border-blue-800/40">
                <QrCode className="w-3.5 h-3.5" />
              </div>
              <span>مسح فوري لبطاقات الحضور بتقنية QR بكاميرا الهاتف</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-200">
              <div className="w-6 h-6 rounded-lg bg-red-950 text-red-400 flex items-center justify-center shrink-0 border border-red-800/40">
                <Smartphone className="w-3.5 h-3.5" />
              </div>
              <span>تشغيل بنقرة واحدة كأي تطبيق أصلي دون الحاجة لمتجر التطبيقات</span>
            </div>
          </div>

          {/* Action according to platform */}
          {isIOS ? (
            <div className="bg-blue-950/50 border border-blue-700/50 rounded-xl p-3.5 text-xs text-blue-200 mb-4">
              <p className="font-bold text-white mb-2 flex items-center gap-1.5">
                <Share className="w-4 h-4 text-blue-400" /> طريقة التثبيت على آيفون / آيباد (Safari):
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 pr-1">
                <li>اضغط على زر <strong className="text-white">المشاركة (Share)</strong> في شريط Safari بالأسفل.</li>
                <li>مرر للأسفل واختر <strong className="text-white">إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.</li>
              </ol>
            </div>
          ) : isInstallable ? (
            <button
              onClick={async () => {
                await install();
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm shadow-lg shadow-red-900/40 flex items-center justify-center gap-2 transition active:scale-[0.98] mb-2 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              تثبيت التطبيق على الجهاز الآن
            </button>
          ) : (
            <button
              onClick={() => {
                alert('لتثبيت التطبيق: افتح قائمة المتصفح (⋮) واختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".');
                dismissAutoPrompt();
              }}
              className="w-full py-3 px-4 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition mb-2"
            >
              <Download className="w-5 h-5" />
              تثبيت التطبيق
            </button>
          )}

          <button
            onClick={dismissAutoPrompt}
            className="w-full py-2 text-center text-xs text-slate-400 hover:text-slate-200 transition"
          >
            المتابعة في المتصفح حالياً
          </button>
        </div>
      </div>
    </div>
  );
};
