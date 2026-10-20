import React, { useRef } from 'react';
import { X, Printer, Download, Share2, CheckCircle2 } from 'lucide-react';
import { PaymentReceipt } from '../types';

interface OfficialReceiptModalProps {
  receipt: PaymentReceipt;
  onClose: () => void;
}

export const OfficialReceiptModal: React.FC<OfficialReceiptModalProps> = ({ receipt, onClose }) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  const getReceiptTitle = () => {
    if (receipt.receiptType === 'subscription') return 'وصل اشتراك';
    if (receipt.receiptType === 'donation') return 'وصل تبرع';
    return 'وصل تبرع / اشتراك';
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto no-print">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Modal Toolbar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm sm:text-base font-bold text-white">
              معاينة الوصل الرسمي (الموسم الرياضي 2026/2027)
            </h3>
            <span className="text-xs bg-red-900/60 text-red-300 border border-red-700 px-2 py-0.5 rounded">
              وصل عدد {receipt.receiptNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-semibold shadow transition"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الوصل</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Section (Replicating exact layout of attached voucher image) */}
        <div className="p-4 sm:p-6 bg-slate-950/90 overflow-x-auto flex justify-center">
          <div
            ref={printAreaRef}
            className="w-[850px] min-w-[750px] bg-white text-slate-900 border-2 border-slate-300 rounded-lg shadow-xl relative overflow-hidden select-none print:shadow-none print:border-none print:w-full"
            style={{ direction: 'rtl' }}
          >
            <div className="flex relative min-h-[380px]">
              {/* STUB (كعب الوصل - Left section) */}
              <div className="w-[30%] p-4 border-l-2 border-dashed border-slate-400 flex flex-col justify-between relative bg-white">
                <div>
                  {/* Top Club Crest & Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src="/ust-logo.png"
                      alt="UST Crest"
                      className="w-12 h-12 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/aistudio/IMG-20261019-WA0005_826b9955.jpg';
                      }}
                    />
                    <div>
                      <div className="text-[11px] font-black text-red-700 leading-tight">
                        الاتحاد الرياضي بتطاوين
                      </div>
                      <div className="text-[8px] font-bold text-blue-900 uppercase">
                        UNION SPORTIVE DE TATAOUINE
                      </div>
                      <div className="text-[9px] font-bold text-red-600">
                        1935 • دوماً إلى الأمام
                      </div>
                    </div>
                  </div>

                  <div className="text-center font-bold text-xs text-blue-950 mb-2">
                    الموسم الرياضي <span className="font-extrabold text-blue-800">2026/2027</span>
                  </div>

                  {/* Red badge */}
                  <div className="bg-red-600 text-white text-center font-black py-1 px-3 rounded-xl text-xs shadow-sm mb-2">
                    {getReceiptTitle()}
                  </div>

                  {/* Receipt Number Box */}
                  <div className="border border-red-500 rounded-lg p-1 text-center mb-3 bg-red-50/50">
                    <span className="text-[11px] font-bold text-slate-700">وصل عدد: </span>
                    <span className="text-xs font-black text-red-700 tracking-wider">
                      {receipt.receiptNumber}
                    </span>
                  </div>

                  {/* Member info fields */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-1 border-b border-dotted border-slate-400 pb-0.5">
                      <span className="font-bold text-slate-700 shrink-0">الاسم:</span>
                      <span className="font-extrabold text-blue-900 pr-1">{receipt.memberName.split(' ')[0] || ''}</span>
                    </div>
                    <div className="flex items-center gap-1 border-b border-dotted border-slate-400 pb-0.5">
                      <span className="font-bold text-slate-700 shrink-0">اللقب:</span>
                      <span className="font-extrabold text-blue-900 pr-1">{receipt.memberName.split(' ').slice(1).join(' ') || ''}</span>
                    </div>
                    <div className="flex items-center gap-1 border-b border-dotted border-slate-400 pb-0.5">
                      <span className="font-bold text-slate-700 shrink-0">التاريخ:</span>
                      <span className="font-semibold text-slate-800 pr-1">{receipt.paymentDate}</span>
                    </div>
                    <div className="flex items-center gap-1 border-b border-dotted border-slate-400 pb-0.5">
                      <span className="font-bold text-slate-700 shrink-0">المبلغ:</span>
                      <span className="font-black text-red-700 text-sm pr-1">{receipt.amount}</span>
                      <span className="text-xs font-bold text-slate-700">دينار</span>
                    </div>
                  </div>
                </div>

                {/* Bottom decorative wave */}
                <div className="mt-4 pt-2">
                  <div className="h-3 w-full bg-gradient-to-r from-red-600 to-blue-700 rounded-sm" />
                </div>
              </div>

              {/* MAIN RECEIPT (الوصل الرئيسي - Right section) */}
              <div className="w-[70%] p-5 flex flex-col justify-between relative bg-white">
                <div>
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <img
                        src="/ust-logo.png"
                        alt="UST Crest"
                        className="w-16 h-16 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/aistudio/IMG-20261019-WA0005_826b9955.jpg';
                        }}
                      />
                      <div>
                        <h2 className="text-base font-black text-red-700 leading-tight">
                          الاتحاد الرياضي بتطاوين
                        </h2>
                        <p className="text-[10px] font-bold text-blue-900 tracking-wider">
                          UNION SPORTIVE DE TATAOUINE
                        </p>
                        <p className="text-xs font-bold text-red-600">
                          1935 • UST • دوماً إلى الأمام
                        </p>
                      </div>
                    </div>

                    <div className="text-left">
                      <div className="text-xl font-black text-blue-900 tracking-wide">
                        الموسم الرياضي
                      </div>
                      <div className="text-2xl font-black text-blue-800 tracking-wider">
                        2026/2027
                      </div>
                    </div>
                  </div>

                  {/* Title Badge & Receipt No Box */}
                  <div className="flex items-center justify-between gap-4 my-3">
                    <div className="bg-red-600 text-white font-black text-base px-8 py-1.5 rounded-2xl shadow-md">
                      {getReceiptTitle()}
                    </div>

                    <div className="flex items-center gap-2 border-2 border-red-500 rounded-xl px-4 py-1 bg-red-50/50">
                      <span className="text-sm font-bold text-slate-700">وصل عدد:</span>
                      <span className="text-base font-black text-red-700 tracking-wider">
                        {receipt.receiptNumber}
                      </span>
                    </div>
                  </div>

                  {/* Fields with Dotted Lines */}
                  <div className="space-y-3 mt-4 text-sm">
                    <div className="flex items-baseline gap-2 border-b-2 border-dotted border-slate-400 pb-1">
                      <span className="font-bold text-slate-800 text-sm shrink-0">الاسم :</span>
                      <span className="font-extrabold text-blue-950 text-base pr-2">
                        {receipt.memberName.split(' ')[0] || ''}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 border-b-2 border-dotted border-slate-400 pb-1">
                      <span className="font-bold text-slate-800 text-sm shrink-0">اللقب :</span>
                      <span className="font-extrabold text-blue-950 text-base pr-2">
                        {receipt.memberName.split(' ').slice(1).join(' ') || ''}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 border-b-2 border-dotted border-slate-400 pb-1">
                      <span className="font-bold text-slate-800 text-sm shrink-0">التاريخ :</span>
                      <span className="font-bold text-slate-900 pr-2">
                        {receipt.paymentDate}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 border-b-2 border-dotted border-slate-400 pb-1">
                      <span className="font-bold text-slate-800 text-sm shrink-0">المبلغ :</span>
                      <span className="font-black text-red-700 text-xl pr-2">
                        {receipt.amount}
                      </span>
                      <span className="font-black text-slate-900 text-sm">دينار</span>
                      {receipt.notes && (
                        <span className="text-xs text-slate-500 pr-4">({receipt.notes})</span>
                      )}
                    </div>
                  </div>

                  {/* Official Acknowledgement Text */}
                  <div className="mt-5 text-center">
                    <p className="text-base sm:text-lg font-black text-blue-950">
                      أشهد أنني تسلمت المبلغ المذكور لفائدة <span className="text-red-700 font-extrabold underline decoration-red-600 decoration-2">فرع الشبان</span>
                    </p>
                  </div>
                </div>

                {/* Footer and Signatures */}
                <div className="mt-6 pt-2 flex items-end justify-between">
                  <div className="text-[11px] text-slate-600">
                    <p className="font-semibold">المستلم: {receipt.receiverName || 'أمين المال'}</p>
                    <p className="text-[10px] text-slate-400">طريقة الدفع: {receipt.paymentMethod === 'cash' ? 'نقداً' : 'تحويل'}</p>
                  </div>

                  <div className="text-center pl-8">
                    <p className="text-xs font-bold text-slate-700 mb-6">إمضاء وختم أمين المال</p>
                    <div className="w-24 border-b border-slate-400 mx-auto" />
                  </div>
                </div>

                {/* Bottom Red and Blue Wave Stripes */}
                <div className="absolute bottom-0 right-0 left-0 h-4 bg-gradient-to-r from-red-600 via-white to-blue-800" />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-800 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>مطابق للمطبوعة الرسمية المعتمدة لفرع الشبان 2026/2027</span>
          </div>
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
