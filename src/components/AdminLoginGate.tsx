import React, { useState } from 'react';
import { Lock, Mail, KeyRound, ShieldCheck, AlertCircle, ArrowLeft, LogIn, Key, UserCheck, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminLoginGate: React.FC = () => {
  const { loginWithEmail, registerWithEmail } = useAuth();

  const [roleType, setRoleType] = useState<'admin' | 'coach'>('admin');
  const [mode, setMode] = useState<'login' | 'reset' | 'coach_register'>('login');
  const [email, setEmail] = useState('tounekti2020@gmail.com');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleChange = (role: 'admin' | 'coach') => {
    setRoleType(role);
    setError(null);
    setSuccessMsg(null);
    setMode('login');
    if (role === 'admin') {
      setEmail('tounekti2020@gmail.com');
      setPassword('');
    } else {
      setEmail('');
      setPassword('');
      setDisplayName('مدرب فرع الشبان');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else if (mode === 'coach_register') {
        if (password.length < 6) {
          throw new Error('كلمة المرور يجب أن تتكون من 6 خانات أو أحرف على الأقل.');
        }
        await registerWithEmail(email, password, displayName || 'المدرب', 'coach');
        setSuccessMsg('تم إنشاء حساب المدرب بنجاح وتسجيل الدخول.');
      } else {
        // admin reset
        if (password.length < 6) {
          throw new Error('كلمة المرور يجب أن تتكون من 6 خانات أو أحرف على الأقل.');
        }
        if (password !== confirmPassword) {
          throw new Error('كلمتا المرور غير متطابقتين.');
        }
        await registerWithEmail(email, password, 'المسؤول الرئيسي', 'admin');
        setSuccessMsg('تم تعيين كلمة المرور بنجاح وتسجيل الدخول للمنظومة.');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في عملية الدخول. يرجى التثبت من البيانات.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Club Colors Glows */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-slate-900 border border-red-900/50 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden text-slate-100">
        {/* Tricolor Header */}
        <div className="h-2 w-full bg-gradient-to-r from-red-600 via-white to-blue-700" />

        <div className="p-6 sm:p-8">
          {/* Logo & Club Header */}
          <div className="text-center mb-5">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-white p-2 border-2 border-red-600 shadow-xl mb-3 flex items-center justify-center">
              <img
                src="/ust-logo.png"
                alt="الاتحاد الرياضي بتطاوين 1935"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/aistudio/IMG-20261019-WA0005_826b9955.jpg';
                }}
              />
            </div>
            <h1 className="text-xl font-black text-white">
              الاتحاد الرياضي بتطاوين
            </h1>
            <p className="text-xs font-bold text-red-500 tracking-wide mt-0.5">
              فرع الشبان • الموسم الرياضي 2026/2027
            </p>
          </div>

          {/* Role Toggle: المسؤول vs المدرب */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 mb-5">
            <button
              type="button"
              onClick={() => handleRoleChange('admin')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                roleType === 'admin'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>فضاء المسؤول</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('coach')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                roleType === 'coach'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>فضاء المدرب</span>
            </button>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-700 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'coach_register' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  اسم المدرب / اللقب:
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  placeholder="مثال: المدرب أحمد"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-hidden focus:border-blue-500 transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {roleType === 'admin' ? 'البريد الإلكتروني للمسؤول (Adr / Email):' : 'البريد الإلكتروني للمدرب (Adr / Email):'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                  placeholder={roleType === 'admin' ? 'tounekti2020@gmail.com' : 'coach@ust.tn'}
                  className="w-full pr-10 pl-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-hidden focus:border-red-500 transition text-right"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {mode === 'login' ? 'كلمة المرور (Mdp / Mot de passe):' : 'كلمة المرور الجديدة (Mdp):'}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  dir="ltr"
                  placeholder="أدخل كلمة المرور الخاصة بك"
                  className="w-full pr-10 pl-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-hidden focus:border-red-500 transition text-right"
                />
              </div>
            </div>

            {mode === 'reset' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  تأكيد كلمة المرور الجديدة:
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    dir="ltr"
                    placeholder="أعد إدخال كلمة المرور للتأكيد"
                    className="w-full pr-10 pl-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-hidden focus:border-red-500 transition text-right"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-xl text-white font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                roleType === 'admin'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-red-950'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-blue-950'
              }`}
            >
              {mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول ({roleType === 'admin' ? 'كمسؤول' : 'كمدرب'})</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 text-amber-300" />
                  <span>حفظ كلمة المرور والدخول</span>
                </>
              )}
            </button>
          </form>

          {/* Mode Switchers */}
          <div className="mt-5 pt-4 border-t border-slate-800 text-center text-xs">
            {roleType === 'admin' ? (
              mode === 'login' ? (
                <p className="text-slate-400">
                  تريد تعيين أو تحديث كلمة المرور الخاصة بك؟{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode('reset');
                    }}
                    className="text-red-400 hover:text-red-300 font-bold underline underline-offset-2 cursor-pointer"
                  >
                    اضغط هنا لتعيين كلمة مرور جديدة
                  </button>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('login');
                  }}
                  className="text-slate-400 hover:text-white inline-flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>العودة إلى تسجيل الدخول</span>
                </button>
              )
            ) : mode === 'login' ? (
              <p className="text-slate-400">
                مدرب جديد؟{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('coach_register');
                  }}
                  className="text-blue-400 hover:text-blue-300 font-bold underline underline-offset-2 cursor-pointer"
                >
                  اضغط هنا لإنشاء حساب مدرب جديد
                </button>
              </p>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('login');
                }}
                className="text-slate-400 hover:text-white inline-flex items-center gap-1 font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>العودة إلى تسجيل دخول المدرب</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-center text-[11px] text-slate-500">
          الاتحاد الرياضي بتطاوين • دوماً إلى الأمام 1935
        </div>
      </div>
    </div>
  );
};
