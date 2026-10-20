import React, { useState } from 'react';
import { X, UserPlus, Save, AlertCircle, PlusCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Member } from '../types';

interface MemberFormModalProps {
  initialMember?: Member | null;
  onOpenGroupModal?: () => void;
  onClose: () => void;
}

export const MemberFormModal: React.FC<MemberFormModalProps> = ({ initialMember, onOpenGroupModal, onClose }) => {
  const { members, groups, addMember, updateMember } = useData();

  const defaultMemberNumber = initialMember?.memberNumber || `UST-2026-${String(members.length + 1).padStart(3, '0')}`;

  const [formData, setFormData] = useState({
    memberNumber: defaultMemberNumber,
    firstName: initialMember?.firstName || '',
    lastName: initialMember?.lastName || '',
    photoUrl: initialMember?.photoUrl || '',
    birthDate: initialMember?.birthDate || '',
    phone: initialMember?.phone || '',
    parentPhone: initialMember?.parentPhone || '',
    address: initialMember?.address || 'تطاوين',
    registrationDate: initialMember?.registrationDate || new Date().toISOString().split('T')[0],
    sport: initialMember?.sport || 'كرة القدم - فرع الشبان',
    category: initialMember?.category || (groups[0]?.category || groups[0]?.name || ''),
    groupId: initialMember?.groupId || (groups[0]?.id || ''),
    status: initialMember?.status || 'active',
    emergencyContact: initialMember?.emergencyContact || '',
    adminNotes: initialMember?.adminNotes || '',
    qrCode: initialMember?.qrCode || defaultMemberNumber,
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGroupSelect = (grpId: string) => {
    const grp = groups.find((g) => g.id === grpId);
    if (grp) {
      setFormData((prev) => ({
        ...prev,
        groupId: grp.id,
        category: grp.category || grp.name,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        groupId: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('يرجى إدخال الاسم واللقب.');
      return;
    }
    if (!formData.category.trim()) {
      setError('يرجى تحديد أو إدخال الفئة / الصنف.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (initialMember) {
        await updateMember(initialMember.id, formData);
      } else {
        await addMember(formData);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ البيانات');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto no-print">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-auto text-slate-100">
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-bold text-white">
              {initialMember ? 'تعديل بطاقة لاعب' : 'تسجيل لاعب جديد في فرع الشبان'}
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
          {error && (
            <div className="p-3 rounded-lg bg-red-950/80 border border-red-700 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Member Number */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                معرف اللاعب (ينشأ تلقائياً) *
              </label>
              <input
                type="text"
                value={formData.memberNumber}
                onChange={(e) => setFormData({ ...formData, memberNumber: e.target.value, qrCode: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-red-400 font-mono font-bold focus:outline-hidden focus:border-red-500"
              />
            </div>

            {/* Registration Date */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                تاريخ التسجيل
              </label>
              <input
                type="date"
                value={formData.registrationDate}
                onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-red-500"
              />
            </div>

            {/* First Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                الاسم *
              </label>
              <input
                type="text"
                placeholder="اسم اللاعب"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-red-500"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                اللقب *
              </label>
              <input
                type="text"
                placeholder="لقب اللاعب"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-red-500"
              />
            </div>

            {/* Birth Date */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                تاريخ الميلاد
              </label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-red-500"
              />
            </div>

            {/* Category / Group (Custom created by Admin) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">
                  الفئة / الصنف (تحدد بواسطة المسؤول) *
                </label>
                {onOpenGroupModal && (
                  <button
                    type="button"
                    onClick={onOpenGroupModal}
                    className="text-[10px] text-red-400 hover:text-red-300 font-semibold inline-flex items-center gap-1"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>إضافة فئة جديدة</span>
                  </button>
                )}
              </div>

              {groups.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={formData.groupId}
                    onChange={(e) => handleGroupSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-red-500"
                  >
                    <option value="">-- اختر من الفئات التي أضافها المسؤول --</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.category || 'فئة'})
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="أو اكتب تسمية الصنف يدوياً..."
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-red-500"
                  />
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    placeholder="اكتب تسمية الفئة (مثال: أداني، براعم، مدارس...)"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-red-500"
                  />
                  <p className="text-[11px] text-amber-400 mt-1">
                    لم تقم بإضافة فئات في قسم المجموعات بعد. يمكنك كتابة اسم الفئة هنا مباشرة.
                  </p>
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                الحالة *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-red-500"
              >
                <option value="active">نشط وممارس</option>
                <option value="suspended">موقوف مؤقتاً</option>
                <option value="archived">مؤرشف</option>
              </select>
            </div>

            {/* Parent Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                هاتف الولي / الوصي (للقاصر)
              </label>
              <input
                type="tel"
                placeholder="رقم هاتف الولي"
                value={formData.parentPhone}
                onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-red-500"
              />
            </div>

            {/* Member Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                هاتف اللاعب (إن وُجد)
              </label>
              <input
                type="tel"
                placeholder="رقم هاتف اللاعب"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-red-500"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                العنوان
              </label>
              <input
                type="text"
                placeholder="تطاوين"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-red-500"
              />
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                شخص يُتصل به في الحالات الطارئة
              </label>
              <input
                type="text"
                placeholder="مثال: العم 98112233"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-red-500"
              />
            </div>
          </div>

          {/* Admin Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              ملاحظات إدارية / فنية
            </label>
            <textarea
              rows={2}
              placeholder="ملاحظات حول مستوى اللاعب، المركز المفضل، المتابعة الطبية..."
              value={formData.adminNotes}
              onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
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
              disabled={isSubmitting}
              className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-red-950 transition"
            >
              <Save className="w-4 h-4" />
              <span>{initialMember ? 'حفظ التعديلات' : 'تسجيل اللاعب وتوليد رمز QR'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
