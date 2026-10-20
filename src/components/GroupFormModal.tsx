import React, { useState } from 'react';
import { X, Building, Save, AlertCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { SportsGroup } from '../types';

interface GroupFormModalProps {
  initialGroup?: SportsGroup | null;
  onClose: () => void;
}

export const GroupFormModal: React.FC<GroupFormModalProps> = ({ initialGroup, onClose }) => {
  const { addGroup, updateGroup } = useData();

  const [name, setName] = useState(initialGroup?.name || '');
  const [category, setCategory] = useState(initialGroup?.category || '');
  const [scheduleDays, setScheduleDays] = useState(initialGroup?.scheduleDays || '');
  const [scheduleTime, setScheduleTime] = useState(initialGroup?.scheduleTime || '');
  const [location, setLocation] = useState(initialGroup?.location || 'ملعب المرحوم نجيب الخطاب بتطاوين');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى إدخال اسم الفئة أو الصنف.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (initialGroup) {
        await updateGroup(initialGroup.id, {
          name: name.trim(),
          category: (category.trim() || name.trim()),
          scheduleDays: scheduleDays.trim(),
          scheduleTime: scheduleTime.trim(),
          location: location.trim(),
        });
      } else {
        await addGroup({
          name: name.trim(),
          category: (category.trim() || name.trim()),
          scheduleDays: scheduleDays.trim(),
          scheduleTime: scheduleTime.trim(),
          location: location.trim(),
          active: true,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ الفئة');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto no-print">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-auto text-slate-100">
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-bold text-white">
              {initialGroup ? 'تعديل بيانات الفئة / الصنف' : 'إضافة فئة / صنف جديد بواسطة المسؤول'}
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

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              تسمية الفئة أو الصنف الرياضي *
            </label>
            <input
              type="text"
              placeholder="مثال: فئة الأداني (الفوج أ)، فئة البراعم، مدارس ب..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!category) setCategory(e.target.value);
              }}
              required
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              رمز أو اختصار الصنف
            </label>
            <input
              type="text"
              placeholder="مثال: أداني، براعم، أصاغر، U13، مدارس..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                أيام التمارين المعتادة
              </label>
              <input
                type="text"
                placeholder="مثال: الإثنين، الأربعاء، السبت"
                value={scheduleDays}
                onChange={(e) => setScheduleDays(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                توقيت الحصص
              </label>
              <input
                type="text"
                placeholder="مثال: 17:00 - 18:30"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              مكان التمارين / الملعب
            </label>
            <input
              type="text"
              placeholder="ملعب المرحوم نجيب الخطاب بتطاوين"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500"
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
              <span>{initialGroup ? 'حفظ التعديلات' : 'إضافة الفئة'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
