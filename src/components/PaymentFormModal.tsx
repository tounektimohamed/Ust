import React, { useState } from 'react';
import { X, Receipt, CheckCircle, Calculator } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Member, PaymentReceipt, SubscriptionType } from '../types';

interface PaymentFormModalProps {
  preselectedMember?: Member | null;
  onSuccess: (receipt: PaymentReceipt) => void;
  onClose: () => void;
}

export const PaymentFormModal: React.FC<PaymentFormModalProps> = ({
  preselectedMember,
  onSuccess,
  onClose,
}) => {
  const { members, subscriptions, payments, addPayment, addSubscription } = useData();
  const { profile } = useAuth();

  const [selectedMemberId, setSelectedMemberId] = useState(preselectedMember?.id || (members[0]?.id || ''));
  const [subscriptionType, setSubscriptionType] = useState<SubscriptionType>('quarterly');
  
  // Standard prices
  const basePrices: Record<SubscriptionType, number> = {
    monthly: 50,
    quarterly: 140,
    semiannual: 260,
    annual: 500,
    trial: 0,
  };

  const [baseAmount, setBaseAmount] = useState<number>(140);
  const [receiptType, setReceiptType] = useState<'subscription' | 'donation' | 'both'>('both');
  const [discountType, setDiscountType] = useState<'none' | 'percentage' | 'fixed'>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(140);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'check' | 'other'>('cash');
  const [notes, setNotes] = useState('معلوم انخراط واشتراك لفائدة فرع الشبان');

  // Next receipt number
  const nextReceiptNumber = String(payments.length + 15).padStart(4, '0');

  // Calculate final fee
  const calculateFinal = () => {
    let final = baseAmount;
    if (discountType === 'percentage' && discountValue > 0) {
      final = baseAmount - (baseAmount * discountValue) / 100;
    } else if (discountType === 'fixed' && discountValue > 0) {
      final = Math.max(0, baseAmount - discountValue);
    }
    return Math.round(final);
  };

  const finalAmount = calculateFinal();

  const handleTypeChange = (type: SubscriptionType) => {
    setSubscriptionType(type);
    const p = basePrices[type];
    setBaseAmount(p);
    setPaidAmount(p);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const member = members.find((m) => m.id === selectedMemberId);
    if (!member) return;

    const startDate = new Date().toISOString().split('T')[0];
    const end = new Date();
    if (subscriptionType === 'monthly') end.setMonth(end.getMonth() + 1);
    else if (subscriptionType === 'quarterly') end.setMonth(end.getMonth() + 3);
    else if (subscriptionType === 'semiannual') end.setMonth(end.getMonth() + 6);
    else if (subscriptionType === 'annual') end.setFullYear(end.getFullYear() + 1);
    else end.setDate(end.getDate() + 14); // trial

    const endDate = end.toISOString().split('T')[0];

    const remaining = Math.max(0, finalAmount - paidAmount);
    const paymentStatus = remaining === 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';

    // Create Subscription record
    const subId = await addSubscription({
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`,
      type: subscriptionType,
      amount: baseAmount,
      discountType,
      discountValue,
      finalAmount,
      paidAmount,
      remainingAmount: remaining,
      startDate,
      endDate,
      status: 'active',
      paymentStatus,
      notes,
    });

    // Create Official Receipt record (matching the physical voucher)
    const paymentId = await addPayment({
      receiptNumber: nextReceiptNumber,
      season: '2026/2027',
      subscriptionId: subId,
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`,
      amount: paidAmount,
      paymentMethod,
      paymentDate: startDate,
      receiverName: profile?.displayName || 'أمين المال - فرع الشبان',
      status: 'valid',
      receiptType,
      notes,
    });

    const receiptObj: PaymentReceipt = {
      id: paymentId,
      receiptNumber: nextReceiptNumber,
      season: '2026/2027',
      subscriptionId: subId,
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`,
      amount: paidAmount,
      paymentMethod,
      paymentDate: startDate,
      receiverName: profile?.displayName || 'أمين المال - فرع الشبان',
      status: 'valid',
      receiptType,
      notes,
    };

    onSuccess(receiptObj);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto no-print">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-auto text-slate-100">
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-bold text-white">
              تسجيل استخلاص وإصدار وصل رسمي
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Header Banner with receipt number */}
          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div>
              <p className="text-xs text-slate-400">رقم الوصل الرسمي القادم</p>
              <p className="text-base font-mono font-bold text-red-400">وصل عدد: {nextReceiptNumber}</p>
            </div>
            <div className="text-left text-xs text-slate-400">
              <p>الموسم: <strong className="text-white">2026/2027</strong></p>
              <p className="text-emerald-400 font-bold">لفائدة فرع الشبان (UST)</p>
            </div>
          </div>

          {/* Member Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              اختر اللاعب / المنتسب *
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-red-500"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName} ({m.memberNumber}) - {m.category}
                </option>
              ))}
            </select>
          </div>

          {/* Receipt Type (وصل تبرع / وصل اشتراك / وصل تبرع واشتراك) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              تسمية وطبيعة الوصل:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setReceiptType('subscription');
                  setNotes('معلوم اشتراك وانخراط لفائدة فرع الشبان');
                }}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  receiptType === 'subscription'
                    ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-950'
                    : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
              >
                وصل اشتراك
              </button>
              <button
                type="button"
                onClick={() => {
                  setReceiptType('both');
                  setNotes('معلوم تبرع / اشتراك لفائدة فرع الشبان');
                }}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  receiptType === 'both'
                    ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-950'
                    : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
              >
                وصل تبرع / اشتراك
              </button>
              <button
                type="button"
                onClick={() => {
                  setReceiptType('donation');
                  setNotes('تبرع لفائدة فرع الشبان للاتحاد الرياضي بتطاوين');
                }}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  receiptType === 'donation'
                    ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-950'
                    : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
              >
                وصل تبرع
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Subscription Type */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                المدة / الصنف
              </label>
              <select
                value={subscriptionType}
                onChange={(e) => handleTypeChange(e.target.value as SubscriptionType)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-red-500"
              >
                <option value="monthly">شهري (50 د.ت)</option>
                <option value="quarterly">ثلاثي (140 د.ت)</option>
                <option value="semiannual">سداسي / نصف سنوي (260 د.ت)</option>
                <option value="annual">سنوي كامل (500 د.ت)</option>
                <option value="trial">فترة تجريبية (مجاني)</option>
              </select>
            </div>

            {/* Base Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                المبلغ الأساسي (دينار تونسي)
              </label>
              <input
                type="number"
                min="0"
                value={baseAmount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setBaseAmount(val);
                  setPaidAmount(val);
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-red-500"
              />
            </div>

            {/* Discount Type */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                التخفيض (إخوة / عائلي / قدماء النادي)
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-red-500"
              >
                <option value="none">بدون تخفيض</option>
                <option value="percentage">نسبة مئوية (%)</option>
                <option value="fixed">مبلغ ثابت (د.ت)</option>
              </select>
            </div>

            {/* Discount Value */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                قيمة التخفيض
              </label>
              <input
                type="number"
                min="0"
                disabled={discountType === 'none'}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white disabled:opacity-50 focus:outline-hidden focus:border-red-500"
              />
            </div>
          </div>

          {/* Amount Paid & Summary Box */}
          <div className="bg-gradient-to-r from-red-950/60 to-slate-950 p-4 rounded-xl border border-red-800/50">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="text-slate-300">المبلغ الإجمالي بعد التخفيض:</span>
              <span className="text-base font-extrabold text-white">{finalAmount} د.ت</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-amber-300 mb-1">
                  المبلغ المستخلص الآن نقداً (دينار) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={finalAmount}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-amber-600/80 rounded-lg text-base font-black text-amber-300 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  طريقة الاستخلاص
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden"
                >
                  <option value="cash">نقداً (Espèces)</option>
                  <option value="transfer">تحويل بريدي / بنكي</option>
                  <option value="check">صك بنكي (Chèque)</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
            </div>

            {finalAmount - paidAmount > 0 && (
              <div className="mt-2 text-xs text-amber-400 font-semibold flex items-center justify-between border-t border-red-900/60 pt-2">
                <span>المبلغ المتبقي كسلفة/قسط قادم:</span>
                <span className="font-bold">{finalAmount - paidAmount} د.ت</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              ملاحظات أو سبب الاستخلاص
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-red-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-lg shadow-red-950 transition"
            >
              <CheckCircle className="w-4 h-4" />
              <span>تسجيل وإصدار الوصل المطبوع</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
