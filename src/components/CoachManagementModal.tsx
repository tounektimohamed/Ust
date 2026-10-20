import React, { useState } from 'react';
import { X, UserPlus, Key, Mail, Phone, Building, AlertCircle, Save } from 'lucide-react';
import { useAuth, hashPassword } from '../context/AuthContext';
import { useData } from '../context/DataContext';

interface CoachManagementModalProps {
  onClose: () => void;
}

export const CoachManagementModal: React.FC<CoachManagementModalProps> = ({ onClose }) => {
  const { addCoach } = useAuth();
  const { groups } = useData();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGroupToggle = (grpId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(grpId) ? prev.filter((id) => id !== grpId) : [...prev, grpId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('يرجى ملء كافة الحقول الأساسية (الاسم، البريد، كلمة المرور).');
      return;
    }

    if (password.length < 6) {
      setError('كلمة المرور يجب ألا تقل عن 6 خانات.');
      return;
    }

    setIsSubmitting(true);
    try {
      const passHash = await hashPassword(password.trim());
      await addCoach({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash: passHash,
        phone: phone.trim(),
        assignedGroupIds: selectedGroups,
        active: true,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إنشاء حساب المدرب.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto no-print">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-auto text-slate-100">
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-bold text-white">
              إضافة حساب مدرب جديد (فرع الشبان)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
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
              اسم المدرب / اللقب *
            </label>
            <input
              type="text"
              placeholder="مثال: المدرب أحمد / كابتن فئة الأصاغر"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              البريد الإلكتروني لتسجيل الدخول (Adr) *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              <input
                type="email"
                placeholder="coach@ust-tataouine.tn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
                className="w-full pr-10 pl-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500 text-right"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              كلمة المرور الخاصة بالمدرب (Mdp) *
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              <input
                type="password"
                placeholder="6 خانات أو أكثر"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
                className="w-full pr-10 pl-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500 text-right"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              رقم الهاتف (اختياري)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              <input
                type="tel"
                placeholder="مثال: 98123456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
                className="w-full pr-10 pl-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500 text-right"
              />
            </div>
          </div>

          {/* Assigned categories */}
          {groups.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-red-400" />
                <span>إسناد الفئات التدريبية للمدرب:</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                {groups.map((grp) => {
                  const isChecked = selectedGroups.includes(grp.id);
                  return (
                    <label
                      key={grp.id}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition ${
                        isChecked
                          ? 'bg-red-950/60 border-red-700 text-white font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleGroupToggle(grp.id)}
                        className="rounded text-red-600 focus:ring-0"
                      />
                      <span>{grp.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/50 text-[11px] text-blue-300">
            صلاحيات المدرب: يمكن للمدرب فقط تسجيل حضور اللاعبين والاطلاع على نسب المواظبة، ولا يمكنه الاطلاع على البيانات المالية أو تعديل اللاعبين.
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-red-950 transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'جارِ الحفظ...' : 'إنشاء حساب المدرب'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
