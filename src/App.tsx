import React, { useState } from 'react';
import {
  Users,
  QrCode,
  Receipt,
  Calendar,
  LayoutDashboard,
  Wallet,
  RefreshCw,
  Wifi,
  WifiOff,
  Download,
  Plus,
  Search,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building,
  UserPlus,
  Trash2,
  Edit,
  LogOut,
  User as UserIcon,
  FolderPlus
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { usePWAInstall } from './hooks/usePWAInstall';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { AdminLoginGate } from './components/AdminLoginGate';
import { OfficialReceiptModal } from './components/OfficialReceiptModal';
import { MemberCardModal } from './components/MemberCardModal';
import { MemberFormModal } from './components/MemberFormModal';
import { PaymentFormModal } from './components/PaymentFormModal';
import { AttendanceScannerModal } from './components/AttendanceScannerModal';
import { ManualAttendanceModal } from './components/ManualAttendanceModal';
import { GroupFormModal } from './components/GroupFormModal';
import { CoachManagementModal } from './components/CoachManagementModal';
import { AttendanceStatsView } from './components/AttendanceStatsView';
import { Member, SportsGroup, PaymentReceipt, Subscription } from './types';
import { exportToCSV } from './utils/exportUtils';
import { TrendingUp, UserCheck, Shield } from 'lucide-react';

type ActiveTab = 'dashboard' | 'members' | 'attendance' | 'attendanceStats' | 'subscriptions' | 'groups' | 'coaches' | 'sync';

function MainApp() {
  const { currentUser, profile, loading, signOut, isCoach, isAdmin, coaches, deleteCoach } = useAuth();
  const {
    members,
    groups,
    subscriptions,
    payments,
    attendance,
    auditLogs,
    isOnline,
    syncQueue,
    isSyncing,
    syncNow,
    archiveMember,
    deleteGroup
  } = useData();

  const { isInstallable, isInstalled, install, setShowAutoPrompt } = usePWAInstall();

  const [activeTab, setActiveTab] = useState<ActiveTab>(isCoach ? 'attendance' : 'dashboard');
  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);

  // Modals state
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [selectedCardMember, setSelectedCardMember] = useState<Member | null>(null);
  const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SportsGroup | null>(null);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [preselectedPayMember, setPreselectedPayMember] = useState<Member | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isManualAttendanceOpen, setIsManualAttendanceOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<SportsGroup | null>(null);
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Filters
  const [memberSearch, setMemberSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Dynamic unique categories created by admin or entered for members
  const availableCategories = Array.from(
    new Set([
      ...groups.map((g) => g.category || g.name),
      ...members.map((m) => m.category).filter(Boolean),
    ])
  );

  // Sync selectedGroup when groups change
  const currentActiveGroup = selectedGroup || groups[0] || null;

  // If auth is loading, show loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <div className="w-16 h-16 rounded-2xl bg-white p-2 border-2 border-red-600 shadow-xl mb-4 animate-bounce flex items-center justify-center">
          <img src="/ust-logo.png" alt="UST" className="w-full h-full object-contain" />
        </div>
        <p className="font-bold text-sm text-red-400">الاتحاد الرياضي بتطاوين (فرع الشبان)</p>
        <p className="text-xs text-slate-500 mt-1">جارِ التحقق من الحساب...</p>
      </div>
    );
  }

  // If not authenticated, require Admin Login (Email + Password)
  if (!currentUser) {
    return <AdminLoginGate />;
  }

  // Real Metrics
  const activeMembersCount = members.filter((m) => m.status === 'active').length;
  const todayAttendanceCount = attendance.filter((a) => a.sessionDate === sessionDate && a.status === 'present').length;
  const totalRevenue = payments.filter((p) => p.status === 'valid').reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalAttendanceEntries = attendance.length;
  const attendancePercentage = totalAttendanceEntries > 0
    ? Math.round((attendance.filter((a) => a.status === 'present').length / totalAttendanceEntries) * 100)
    : 0;

  // Filtered members
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.firstName.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.lastName.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.memberNumber.toLowerCase().includes(memberSearch.toLowerCase()) ||
      (m.phone && m.phone.includes(memberSearch));
    const matchesCat = categoryFilter === 'all' || m.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const handleExportMembers = () => {
    const data = filteredMembers.map((m) => ({
      'المعرف': m.memberNumber,
      'الاسم': m.firstName,
      'اللقب': m.lastName,
      'الصنف': m.category,
      'تاريخ الميلاد': m.birthDate,
      'هاتف الولي': m.parentPhone || '',
      'هاتف اللاعب': m.phone || '',
      'الحالة': m.status === 'active' ? 'نشط' : m.status === 'suspended' ? 'موقوف' : 'مؤرشف',
      'تاريخ التسجيل': m.registrationDate,
    }));
    exportToCSV(`اعضاء_فرع_الشبان_تطاوين_${new Date().toISOString().split('T')[0]}`, data);
  };

  const handleExportReceipts = () => {
    const data = payments.map((p) => ({
      'وصل عدد': p.receiptNumber,
      'الموسم': p.season,
      'اللاعب': p.memberName,
      'المبلغ (د.ت)': p.amount,
      'التاريخ': p.paymentDate,
      'طريقة الدفع': p.paymentMethod === 'cash' ? 'نقداً' : p.paymentMethod,
      'الحالة': p.status === 'valid' ? 'صحيح' : 'ملغى',
      'المستلم': p.receiverName,
      'ملاحظات': p.notes || '',
    }));
    exportToCSV(`وصولات_استخلاص_فرع_الشبان_${new Date().toISOString().split('T')[0]}`, data);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-700 selection:text-white">
      {/* Top Brand Banner & Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-red-800/40 shadow-xl no-print">
        {/* Tricolor Club Ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-white to-blue-700" />

        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          {/* Logo & Club Name */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white p-1 border-2 border-red-600 shadow-md shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src="/ust-logo.png"
                alt="UST"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/aistudio/IMG-20261019-WA0005_826b9955.jpg';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-white leading-tight tracking-tight">
                  الاتحاد الرياضي بتطاوين
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-black bg-red-900/80 text-red-300 border border-red-700">
                  فرع الشبان
                </span>
                <span className="hidden md:inline-block text-[11px] font-bold text-blue-400">
                  الموسم 2026/2027
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-red-400 font-bold flex items-center gap-1.5">
                <span>UST 1935</span>
                <span>•</span>
                <span className="text-slate-300">دوماً إلى الأمام</span>
                <span>•</span>
                <span className="text-emerald-400">المنظومة الرسمية المعتمدة</span>
              </p>
            </div>
          </div>

          {/* Right Controls: Network status, PWA Install, Logged In Admin Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sync Queue / Network Badge */}
            <div className="flex items-center gap-1.5">
              {isOnline ? (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs">
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden md:inline">متصل</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950 border border-amber-600 text-amber-300 text-xs animate-pulse">
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>دون اتصال</span>
                </div>
              )}

              {syncQueue.length > 0 && (
                <button
                  onClick={syncNow}
                  disabled={isSyncing || !isOnline}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-900/80 border border-blue-600 text-blue-200 text-xs hover:bg-blue-800 transition"
                  title="العمليات المعلقة دون إنترنت"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="font-bold">{syncQueue.length}</span>
                </button>
              )}
            </div>

            {/* PWA Install Button */}
            {!isInstalled && (
              <button
                onClick={() => {
                  if (isInstallable) {
                    install();
                  } else {
                    setShowAutoPrompt(true);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold shadow-md shadow-red-950 transition active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">تثبيت التطبيق</span>
              </button>
            )}

            {/* Logged in User Profile Badge */}
            <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                isCoach ? 'bg-blue-900 text-blue-200' : 'bg-red-900 text-red-200'
              }`}>
                {isCoach ? <UserCheck className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
              </div>
              <div className="hidden lg:block text-right">
                <p className="text-[11px] font-bold text-white leading-tight">
                  {profile?.displayName || currentUser.email?.split('@')[0]}
                </p>
                <p className={`text-[9px] font-semibold ${isCoach ? 'text-blue-400' : 'text-red-400'}`}>
                  {isCoach ? 'مدرب رياضي' : 'المسؤول الرئيسي'}
                </p>
              </div>
              <button
                onClick={signOut}
                title="تسجيل الخروج"
                className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900 transition mr-1 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation Bar (Role-Based for Coach & Admin) */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 overflow-x-auto border-t border-slate-800 scrollbar-none">
          <nav className="flex items-center gap-1 py-1.5 min-w-max">
            {isCoach ? (
              /* Coach-Only Navigation Tabs: ONLY Attendance, Attendance Stats, and Read-Only Players */
              <>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                    activeTab === 'attendance'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>تسجيل الحضور ورمز QR</span>
                </button>

                <button
                  onClick={() => setActiveTab('attendanceStats')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                    activeTab === 'attendanceStats'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>نسب وإحصائيات الحضور</span>
                </button>

                <button
                  onClick={() => setActiveTab('members')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                    activeTab === 'members'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>قائمة لاعبي الفئة</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                    {members.length}
                  </span>
                </button>
              </>
            ) : (
              /* Administrator Navigation Tabs: Full Administration */
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-red-600 text-white shadow-md shadow-red-950'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>لوحة القيادة</span>
                </button>

                <button
                  onClick={() => setActiveTab('members')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                    activeTab === 'members'
                      ? 'bg-red-600 text-white shadow-md shadow-red-950'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>المنتسبون واللاعبون</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                    {members.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('groups')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                    activeTab === 'groups'
                      ? 'bg-red-600 text-white shadow-md shadow-red-950'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>الفئات والأصناف</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                    {groups.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('attendance')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                    activeTab === 'attendance'
                      ? 'bg-red-600 text-white shadow-md shadow-red-950'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>تسجيل الحضور ورمز QR</span>
                </button>

                <button
                  onClick={() => setActiveTab('attendanceStats')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                    activeTab === 'attendanceStats'
                      ? 'bg-red-600 text-white shadow-md shadow-red-950'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>نسب وإحصائيات الحضور</span>
                </button>

                <button
                  onClick={() => setActiveTab('subscriptions')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                    activeTab === 'subscriptions'
                      ? 'bg-red-600 text-white shadow-md shadow-red-950'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>الاشتراكات والوصولات</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                    {payments.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('coaches')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                    activeTab === 'coaches'
                      ? 'bg-red-600 text-white shadow-md shadow-red-950'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>حسابات المدربين</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                    {coaches.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('sync')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                    activeTab === 'sync'
                      ? 'bg-red-600 text-white shadow-md shadow-red-950'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>المزامنة وسجل العمليات</span>
                  {syncQueue.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-6">
        {/* ======================= TAB: DASHBOARD ======================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Quick Action Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-red-950/70 via-slate-900 to-slate-900 p-4 rounded-2xl border border-red-800/40">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  فضاء فرع الشبان - الاتحاد الرياضي بتطاوين
                </h2>
                <p className="text-xs sm:text-sm text-slate-300">
                  الموسم الرياضي 2026/2027 • الفئات والأصناف يحددها المسؤول • تسجيل اللاعبين والوصولات الرسمية
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setEditingGroup(null);
                    setIsGroupFormOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition"
                >
                  <FolderPlus className="w-4 h-4 text-red-400" />
                  <span>تحديد فئة جديدة</span>
                </button>

                <button
                  onClick={() => {
                    setEditingMember(null);
                    setIsMemberFormOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-red-950 transition"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>تسجيل لاعب جديد</span>
                </button>

                {groups.length > 0 && (
                  <button
                    onClick={() => setIsScannerOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-blue-950 transition"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>مسح QR للحضور</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setPreselectedPayMember(null);
                    setIsPaymentFormOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition"
                >
                  <Receipt className="w-4 h-4" />
                  <span>إصدار وصل رسمي</span>
                </button>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400">اللاعبون النشطون</span>
                  <div className="w-8 h-8 rounded-xl bg-red-950 text-red-400 flex items-center justify-center border border-red-800/40">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">{activeMembersCount}</div>
                <p className="text-[11px] text-slate-500 mt-1">مسجلين في فرع الشبان</p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400">الفئات المحددة</span>
                  <div className="w-8 h-8 rounded-xl bg-red-950 text-red-400 flex items-center justify-center border border-red-800/40">
                    <Building className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">{groups.length}</div>
                <p className="text-[11px] text-slate-500 mt-1">أصناف محددة من المسؤول</p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400">حضور اليوم ({sessionDate})</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-800/40">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">{todayAttendanceCount}</div>
                <p className="text-[11px] text-slate-500 mt-1">حضور حصة اليوم</p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400">مداخيل الموسم 2026/2027</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-950 text-blue-400 flex items-center justify-center border border-blue-800/40">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-blue-400">{totalRevenue} <span className="text-xs font-normal">د.ت</span></div>
                <p className="text-[11px] text-slate-500 mt-1">إجمالي وصولات الاستخلاص الصادرة</p>
              </div>
            </div>

            {/* Zero Fake Data State & Guidance */}
            {groups.length === 0 ? (
              <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl p-8 sm:p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-800/50 text-red-400 flex items-center justify-center mx-auto mb-4">
                  <FolderPlus className="w-8 h-8" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2">
                  الخطوة الأولى: تحديد الفئات والأصناف الرياضية
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
                  بناءً على طلبك، تم حذف أي أصناف افتراضية مسبقة. يمكنك الآن كمسؤول تحديد أسماء الفئات والأفواج التي يديرها فرع الشبان بحرية تامة.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => {
                      setEditingGroup(null);
                      setIsGroupFormOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-red-950 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة فئة / صنف جديد الآن</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingMember(null);
                      setIsMemberFormOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-2 transition"
                  >
                    <UserPlus className="w-4 h-4 text-red-400" />
                    <span>تسجيل لاعب مباشرة</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Groups Overview */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <Building className="w-4 h-4 text-red-500" />
                      <span>فئات وأصناف فرع الشبان المحددة</span>
                    </h3>
                    <button
                      onClick={() => {
                        setEditingGroup(null);
                        setIsGroupFormOpen(true);
                      }}
                      className="text-xs text-red-400 hover:text-red-300 font-bold inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة فئة</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {groups.map((grp) => {
                      const count = members.filter((m) => m.groupId === grp.id || m.category === grp.category).length;
                      return (
                        <div
                          key={grp.id}
                          onClick={() => {
                            setSelectedGroup(grp);
                            setActiveTab('attendance');
                          }}
                          className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-red-600/70 cursor-pointer transition"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <h4 className="text-sm font-bold text-white">{grp.name}</h4>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-800 font-mono font-bold">
                              {count} لاعب
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mb-1">{grp.scheduleDays || '—'} • {grp.scheduleTime || '—'}</p>
                          <p className="text-[11px] text-slate-500 truncate">{grp.location}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 mb-4">
                      <Receipt className="w-4 h-4 text-emerald-400" />
                      <span>آخر الوصولات المسجلة</span>
                    </h3>

                    {payments.length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center">لا توجد وصولات بعد.</p>
                    ) : (
                      <div className="space-y-2">
                        {payments.slice(0, 4).map((pay) => (
                          <div
                            key={pay.id}
                            onClick={() => setSelectedReceipt(pay)}
                            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition flex items-center justify-between"
                          >
                            <div>
                              <p className="text-xs font-bold text-white">{pay.memberName}</p>
                              <p className="text-[10px] text-slate-400">
                                وصل عدد <span className="font-mono text-red-400 font-bold">{pay.receiptNumber}</span>
                              </p>
                            </div>
                            <span className="text-xs font-black text-emerald-400">{pay.amount} د.ت</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB: MEMBERS ======================= */}
        {activeTab === 'members' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  سجل اللاعبين والمنتسبين (فرع الشبان)
                </h2>
                <p className="text-xs text-slate-400">
                  إدارة البطاقات الرسمية، الفئات العمرية، رمز QR الذكي
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {members.length > 0 && (
                  <button
                    onClick={handleExportMembers}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>تصدير Excel</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setEditingMember(null);
                    setIsMemberFormOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-red-950 transition"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>إضافة لاعب جديد</span>
                </button>
              </div>
            </div>

            {/* Filter and Search */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم، اللقب، رقم العضوية..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-red-500"
                >
                  <option value="all">كل الأصناف والفئات ({availableCategories.length})</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-red-500"
                >
                  <option value="all">كل الحالات</option>
                  <option value="active">نشط</option>
                  <option value="suspended">موقوف</option>
                  <option value="archived">مؤرشف</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs sm:text-sm">
                  <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">اللاعب / المعرف</th>
                      <th className="p-3.5">الصنف</th>
                      <th className="p-3.5">تاريخ الميلاد</th>
                      <th className="p-3.5">هاتف الولي</th>
                      <th className="p-3.5">الاشتراك</th>
                      <th className="p-3.5">الحالة</th>
                      <th className="p-3.5 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center p-8 text-slate-400">
                          {members.length === 0
                            ? 'سجل اللاعبين فارغ. انقر على «إضافة لاعب جديد» للبدء بتسجيل اللاعبين الفعليين.'
                            : 'لا توجد نتائج مطابقة للبحث.'}
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map((member) => {
                        const sub = subscriptions.find((s) => s.memberId === member.id);
                        const isExpired = !sub || sub.status === 'expired' || new Date(sub.endDate) < new Date();
                        return (
                          <tr key={member.id} className="hover:bg-slate-800/50 transition">
                            <td className="p-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-red-400 shrink-0 overflow-hidden">
                                  {member.photoUrl ? (
                                    <img src={member.photoUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{member.firstName[0]}</span>
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-white text-sm">
                                    {member.firstName} {member.lastName}
                                  </div>
                                  <div className="font-mono text-[11px] text-red-400 font-semibold">
                                    {member.memberNumber}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="p-3.5 font-semibold text-slate-200">{member.category}</td>
                            <td className="p-3.5 text-slate-300">{member.birthDate || '—'}</td>
                            <td className="p-3.5 text-slate-300">{member.parentPhone || '—'}</td>

                            <td className="p-3.5">
                              {sub ? (
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                    isExpired
                                      ? 'bg-red-950 text-red-400 border border-red-800'
                                      : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  }`}
                                >
                                  {isExpired ? 'منتهٍ' : 'ساري'}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-500">بدون اشتراك</span>
                              )}
                            </td>

                            <td className="p-3.5">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                  member.status === 'active'
                                    ? 'bg-emerald-950 text-emerald-400'
                                    : member.status === 'suspended'
                                    ? 'bg-amber-950 text-amber-400'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {member.status === 'active' ? 'نشط' : member.status === 'suspended' ? 'موقوف' : 'مؤرشف'}
                              </span>
                            </td>

                            <td className="p-3.5">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setSelectedCardMember(member)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-700 text-slate-200 hover:text-white transition"
                                  title="بطاقة العضوية بـ QR"
                                >
                                  <QrCode className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => {
                                    setPreselectedPayMember(member);
                                    setIsPaymentFormOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-700 text-slate-200 hover:text-white transition"
                                  title="إصدار وصل دفع"
                                >
                                  <Receipt className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => {
                                    setEditingMember(member);
                                    setIsMemberFormOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-700 text-slate-200 hover:text-white transition"
                                  title="تعديل البيانات"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>

                                {member.status !== 'archived' && (
                                  <button
                                    onClick={() => archiveMember(member.id)}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-700 text-slate-400 hover:text-white transition"
                                    title="أرشفة اللاعب"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB: GROUPS & CATEGORIES ======================= */}
        {activeTab === 'groups' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  الفئات والأصناف الرياضية لفرع الشبان
                </h2>
                <p className="text-xs text-slate-400">
                  تحديد وتسمية الفئات والأفواج بحرية تامة بواسطة المسؤول ومواعيد حصص التمارين
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingGroup(null);
                  setIsGroupFormOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-red-950 transition"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة فئة / صنف جديد</span>
              </button>
            </div>

            {groups.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900 border border-dashed border-slate-800 text-center">
                <Building className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-1">لم تقم بإضافة فئات أو أصناف بعد</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                  اضغط على الزر أدناه لتحديد الفئات وأسمائها وأوقات تمارينها المعتمدة لهذا الموسم.
                </p>
                <button
                  onClick={() => {
                    setEditingGroup(null);
                    setIsGroupFormOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>تحديد أول فئة رياضية</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => {
                  const groupCount = members.filter((m) => m.groupId === group.id || m.category === group.category).length;
                  return (
                    <div
                      key={group.id}
                      className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-red-700/60 transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h3 className="text-base font-bold text-white leading-snug">{group.name}</h3>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-red-950 text-red-300 border border-red-800 shrink-0">
                              {groupCount} لاعب
                            </span>
                            <button
                              onClick={() => {
                                setEditingGroup(group);
                                setIsGroupFormOpen(true);
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                              title="تعديل الفئة"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`هل أنت متأكد من حذف الفئة "${group.name}"؟`)) {
                                  deleteGroup(group.id);
                                }
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                              title="حذف الفئة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs text-slate-300 mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
                          <p className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-red-400 shrink-0" />
                            <span>الأيام: <strong className="text-white">{group.scheduleDays || 'غير محدد'}</strong></span>
                          </p>
                          <p className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                            <span>التوقيت: <strong className="text-white">{group.scheduleTime || 'غير محدد'}</strong></span>
                          </p>
                          <p className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="truncate">المكان: {group.location || 'ملعب المرحوم نجيب الخطاب'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => {
                            setSelectedGroup(group);
                            setActiveTab('attendance');
                          }}
                          className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>مسح QR للحصة</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedGroup(group);
                            setIsManualAttendanceOpen(true);
                          }}
                          className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>تحضير يدوي</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB: ATTENDANCE ======================= */}
        {activeTab === 'attendance' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  تسجيل ومتابعة الحضور الميداني
                </h2>
                <p className="text-xs text-slate-400">
                  مسح بطاقات الـ QR بكاميرا الهاتف أو التحضير اليدوي للقائمة
                </p>
              </div>

              {groups.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setIsManualAttendanceOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>التحضير اليدوي</span>
                  </button>

                  <button
                    onClick={() => setIsScannerOpen(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-lg shadow-red-950 transition"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>فتح ماسح QR</span>
                  </button>
                </div>
              )}
            </div>

            {groups.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <Building className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-2">يرجى إضافة فئة أو صنف أولاً</h3>
                <p className="text-xs text-slate-400 mb-4">
                  لكي تتمكن من تسجيل الحضور، قم بتحديد فئة تدريبية في تبويب «الفئات والأصناف».
                </p>
                <button
                  onClick={() => {
                    setEditingGroup(null);
                    setIsGroupFormOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                >
                  إضافة فئة الآن
                </button>
              </div>
            ) : (
              <>
                {/* Session Settings Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">المجموعة التدريبية:</label>
                    <select
                      value={currentActiveGroup?.id || ''}
                      onChange={(e) => {
                        const g = groups.find((grp) => grp.id === e.target.value);
                        if (g) setSelectedGroup(g);
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-red-500"
                    >
                      {groups.map((grp) => (
                        <option key={grp.id} value={grp.id}>
                          {grp.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">تاريخ الحصة:</label>
                    <input
                      type="date"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-red-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <div className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-slate-400">حضور هذه الحصة:</span>
                      <span className="font-extrabold text-emerald-400 text-sm">
                        {attendance.filter((a) => a.groupId === currentActiveGroup?.id && a.sessionDate === sessionDate && a.status === 'present').length} حاضر
                      </span>
                    </div>
                  </div>
                </div>

                {/* Attendance Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs sm:text-sm">
                      <thead className="bg-slate-950/50 text-slate-400 font-bold border-b border-slate-800">
                        <tr>
                          <th className="p-3.5">اللاعب</th>
                          <th className="p-3.5">رقم العضوية</th>
                          <th className="p-3.5">التوقيت</th>
                          <th className="p-3.5">طريقة التسجيل</th>
                          <th className="p-3.5">الحالة</th>
                          <th className="p-3.5">المسجل</th>
                          <th className="p-3.5">ملاحظات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {attendance.filter((a) => a.groupId === currentActiveGroup?.id && a.sessionDate === sessionDate).length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center p-8 text-slate-400">
                              لم يتم تسجيل حضور لهذه الحصة بعد. انقر على «فتح ماسح QR» أو «التحضير اليدوي».
                            </td>
                          </tr>
                        ) : (
                          attendance
                            .filter((a) => a.groupId === currentActiveGroup?.id && a.sessionDate === sessionDate)
                            .map((rec) => (
                              <tr key={rec.id} className="hover:bg-slate-800/40">
                                <td className="p-3.5 font-bold text-white">{rec.memberName}</td>
                                <td className="p-3.5 font-mono text-red-400">{rec.memberNumber}</td>
                                <td className="p-3.5 text-slate-300">{rec.sessionTime || '—'}</td>
                                <td className="p-3.5">
                                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                    {rec.method === 'qr' ? <QrCode className="w-3 h-3 text-red-400" /> : <CheckCircle2 className="w-3 h-3 text-blue-400" />}
                                    <span>{rec.method === 'qr' ? 'مسح QR' : 'يدوي'}</span>
                                  </span>
                                </td>
                                <td className="p-3.5">
                                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                    {rec.status === 'present' ? 'حاضر' : rec.status}
                                  </span>
                                </td>
                                <td className="p-3.5 text-slate-300">{rec.recordedBy}</td>
                                <td className="p-3.5 text-slate-400 text-xs">{rec.notes || '—'}</td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ======================= TAB: SUBSCRIPTIONS & RECEIPTS ======================= */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  الاشتراكات والوصولات الرسمية (2026/2027)
                </h2>
                <p className="text-xs text-slate-400">
                  إصدار وطباعة وصولات التبرع والاستخلاص المعتمدة لفرع الشبان
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {payments.length > 0 && (
                  <button
                    onClick={handleExportReceipts}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>تصدير Excel</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setPreselectedPayMember(null);
                    setIsPaymentFormOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-red-950 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>إصدار وصل جديد</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs sm:text-sm">
                  <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">وصل عدد</th>
                      <th className="p-3.5">اللاعب</th>
                      <th className="p-3.5">المبلغ</th>
                      <th className="p-3.5">التاريخ</th>
                      <th className="p-3.5">طريقة الدفع</th>
                      <th className="p-3.5">المستلم</th>
                      <th className="p-3.5">الحالة</th>
                      <th className="p-3.5 text-center">معاينة وطباعة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center p-8 text-slate-400">
                          لم يتم إصدار أي وصولات بعد. انقر على «إصدار وصل جديد» لتسجيل أول استخلاص واحتساب الرصيد.
                        </td>
                      </tr>
                    ) : (
                      payments.map((receipt) => (
                        <tr key={receipt.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3.5 font-mono font-bold text-red-400">
                            {receipt.receiptNumber}
                          </td>
                          <td className="p-3.5 font-bold text-white">{receipt.memberName}</td>
                          <td className="p-3.5 font-extrabold text-emerald-400 text-sm">{receipt.amount} د.ت</td>
                          <td className="p-3.5 text-slate-300">{receipt.paymentDate}</td>
                          <td className="p-3.5 text-slate-300">
                            {receipt.paymentMethod === 'cash' ? 'نقداً (Espèces)' : receipt.paymentMethod}
                          </td>
                          <td className="p-3.5 text-slate-300">{receipt.receiverName}</td>
                          <td className="p-3.5">
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                              صحيح
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => setSelectedReceipt(receipt)}
                              className="px-3 py-1 rounded-lg bg-red-600/80 hover:bg-red-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow transition"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>طباعة الوصل</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB: EXPENSES ======================= */}
        {activeTab === 'expenses' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                مصاريف وتجهيزات فرع الشبان
              </h2>
              <p className="text-xs text-slate-400">
                توثيق مصاريف الكرات، المعدات الرياضية، الإسعافات والتنقلات
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs sm:text-sm">
                  <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">بيان المصروف</th>
                      <th className="p-3.5">الصنف</th>
                      <th className="p-3.5">المبلغ</th>
                      <th className="p-3.5">التاريخ</th>
                      <th className="p-3.5">المسؤول</th>
                      <th className="p-3.5">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {expenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-8 text-slate-400">
                          لا توجد مصاريف مسجلة حتى الآن.
                        </td>
                      </tr>
                    ) : (
                      expenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-800/40">
                          <td className="p-3.5 font-bold text-white">{exp.title}</td>
                          <td className="p-3.5">{exp.category}</td>
                          <td className="p-3.5 font-black text-red-400 text-sm">{exp.amount} د.ت</td>
                          <td className="p-3.5 text-slate-300">{exp.date}</td>
                          <td className="p-3.5 text-slate-300">{exp.recordedBy}</td>
                          <td className="p-3.5 text-slate-400 text-xs">{exp.notes || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB: SYNC ======================= */}
        {activeTab === 'sync' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                حالة الاتصال والنسخ الاحتياطي للبيانات
              </h2>
              <p className="text-xs text-slate-400">
                متابعة الاتصال مع الخادم السحابي والعمليات المحفوظة
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isOnline ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}>
                  {isOnline ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isOnline ? 'النظام متصل بالخادم وتحديث السجلات يعمل بشكل سليم' : 'الوضع الحالي: العمل دون اتصال بالشبكة (يتم الحفظ محلياً)'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {syncQueue.length === 0
                      ? 'جميع البيانات متزامنة ومحفوظة بنجاح.'
                      : `يوجد ${syncQueue.length} عمليات مسجلة محلياً بانتظار المزامنة.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={syncNow}
                  disabled={isSyncing || syncQueue.length === 0 || !isOnline}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow transition"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'جارِ المزامنة...' : 'مزامنة السجلات الآن'}</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>سجل التدقيق والتغييرات الإدارية</span>
              </h3>

              <div className="space-y-2">
                {auditLogs.slice(0, 10).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">{log.action}: </span>
                      <span className="text-slate-300">{log.details}</span>
                    </div>
                    <div className="text-left text-slate-500 text-[11px] shrink-0 pr-3">
                      <span>بواسطة: {log.performedBy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer with Club Identity */}
      <footer className="mt-auto py-4 px-4 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-500 no-print">
        <p className="font-bold text-slate-400">
          الاتحاد الرياضي بتطاوين • فرع الشبان (الموسم الرياضي 2026/2027)
        </p>
        <p className="text-[11px] text-slate-600 mt-1">
          Union Sportive de Tataouine (UST 1935) • المنظومة الإدارية والمالية الرسمية
        </p>
      </footer>

      {/* Modals */}
      <PWAInstallBanner />

      {selectedReceipt && (
        <OfficialReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {selectedCardMember && (
        <MemberCardModal
          member={selectedCardMember}
          onClose={() => setSelectedCardMember(null)}
        />
      )}

      {isMemberFormOpen && (
        <MemberFormModal
          initialMember={editingMember}
          onOpenGroupModal={() => setIsGroupFormOpen(true)}
          onClose={() => {
            setIsMemberFormOpen(false);
            setEditingMember(null);
          }}
        />
      )}

      {isGroupFormOpen && (
        <GroupFormModal
          initialGroup={editingGroup}
          onClose={() => {
            setIsGroupFormOpen(false);
            setEditingGroup(null);
          }}
        />
      )}

      {isPaymentFormOpen && (
        <PaymentFormModal
          preselectedMember={preselectedPayMember}
          onSuccess={(receipt) => {
            setIsPaymentFormOpen(false);
            setSelectedReceipt(receipt);
          }}
          onClose={() => {
            setIsPaymentFormOpen(false);
            setPreselectedPayMember(null);
          }}
        />
      )}

      {isScannerOpen && currentActiveGroup && (
        <AttendanceScannerModal
          selectedGroup={currentActiveGroup}
          sessionDate={sessionDate}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      {isManualAttendanceOpen && currentActiveGroup && (
        <ManualAttendanceModal
          selectedGroup={currentActiveGroup}
          sessionDate={sessionDate}
          onClose={() => setIsManualAttendanceOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainApp />
      </DataProvider>
    </AuthProvider>
  );
}
