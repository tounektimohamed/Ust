import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Percent,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Users,
  Search,
  Filter,
  Printer,
  FileSpreadsheet,
  Building,
  Award
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { exportToCSV } from '../utils/exportUtils';

export const AttendanceStatsView: React.FC = () => {
  const { members, groups, attendance } = useData();
  const { isCoach, profile } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'month' | 'week'>('all');

  // Filter attendance records by period
  const filteredAttendance = useMemo(() => {
    const now = new Date();
    return attendance.filter((a) => {
      if (periodFilter === 'week') {
        const d = new Date(a.sessionDate);
        const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      if (periodFilter === 'month') {
        const d = new Date(a.sessionDate);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [attendance, periodFilter]);

  // Unique session dates
  const uniqueSessions = useMemo(() => {
    return Array.from(new Set(filteredAttendance.map((a) => `${a.groupId || a.groupName}_${a.sessionDate}`)));
  }, [filteredAttendance]);

  // Overall attendance rate
  const overallRate = useMemo(() => {
    if (filteredAttendance.length === 0) return 0;
    const presentCount = filteredAttendance.filter((a) => a.status === 'present').length;
    return Math.round((presentCount / filteredAttendance.length) * 100);
  }, [filteredAttendance]);

  // Rate per category/group
  const categoryStats = useMemo(() => {
    const list = groups.map((g) => {
      const gAttendance = filteredAttendance.filter(
        (a) => a.groupId === g.id || a.groupName === g.name
      );
      const present = gAttendance.filter((a) => a.status === 'present').length;
      const total = gAttendance.length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      const groupMembersCount = members.filter((m) => m.groupId === g.id || m.category === g.category).length;
      return {
        id: g.id,
        name: g.name,
        category: g.category,
        totalSessions: Array.from(new Set(gAttendance.map((a) => a.sessionDate))).length,
        totalEntries: total,
        present,
        rate,
        membersCount: groupMembersCount,
      };
    });
    return list;
  }, [groups, filteredAttendance, members]);

  // Rate per player
  const playerStats = useMemo(() => {
    return members
      .filter((m) => {
        const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
        const matchesSearch =
          m.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.memberNumber.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .map((member) => {
        const playerRecords = filteredAttendance.filter((a) => a.memberId === member.id);
        const presentCount = playerRecords.filter((a) => a.status === 'present').length;
        const totalRecorded = playerRecords.length;
        const rate = totalRecorded > 0 ? Math.round((presentCount / totalRecorded) * 100) : 0;

        let statusText = 'مواظب ممتاز';
        let statusColor = 'text-emerald-400 bg-emerald-950 border-emerald-800';

        if (totalRecorded === 0) {
          statusText = 'لا توجد حصص مسجلة';
          statusColor = 'text-slate-400 bg-slate-900 border-slate-800';
        } else if (rate >= 85) {
          statusText = 'مواظبة ممتازة';
          statusColor = 'text-emerald-400 bg-emerald-950 border-emerald-800';
        } else if (rate >= 70) {
          statusText = 'مواظبة جيدة';
          statusColor = 'text-blue-400 bg-blue-950 border-blue-800';
        } else if (rate >= 50) {
          statusText = 'مواظبة متوسطة';
          statusColor = 'text-amber-400 bg-amber-950 border-amber-800';
        } else {
          statusText = 'إنذار غياب متكرر';
          statusColor = 'text-red-400 bg-red-950 border-red-800';
        }

        return {
          id: member.id,
          name: `${member.firstName} ${member.lastName}`,
          memberNumber: member.memberNumber,
          category: member.category,
          presentCount,
          totalRecorded,
          rate,
          statusText,
          statusColor,
        };
      })
      .sort((a, b) => b.rate - a.rate);
  }, [members, filteredAttendance, selectedCategory, searchTerm]);

  const handleExportCSV = () => {
    const data = playerStats.map((p) => ({
      'المعرف': p.memberNumber,
      'اللاعب': p.name,
      'الفئة': p.category,
      'الحصص المحضورة': p.presentCount,
      'إجمالي الحصص': p.totalRecorded,
      'نسبة الحضور (%)': `${p.rate}%`,
      'تقييم المواظبة': p.statusText,
    }));
    exportToCSV(`نسب_حضور_اللاعبين_${new Date().toISOString().split('T')[0]}`, data);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-red-500" />
            <h2 className="text-lg sm:text-xl font-black text-white">
              نسب وإحصائيات الحضور والمواظبة الرياضية
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            متابعة دقيقة لنسب التزام وحضور اللاعبين في حصص التمارين لفرع الشبان
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          <button
            onClick={handleExportCSV}
            disabled={playerStats.length === 0}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-red-950 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة تقرير الحضور</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Percentage */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-red-900/40 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">نسبة الحضور العامة</span>
            <div className="w-8 h-8 rounded-xl bg-red-950 border border-red-800 text-red-400 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{overallRate}%</span>
            <span className="text-xs font-semibold text-emerald-400">معدل الانضباط</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${overallRate}%` }}
            />
          </div>
        </div>

        {/* Total Sessions */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">الحصص المسجلة</span>
            <div className="w-8 h-8 rounded-xl bg-blue-950 border border-blue-800 text-blue-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {uniqueSessions.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">حصة تدريبية منجزة</p>
        </div>

        {/* Total Attendance Entries */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">حضور اللاعبين</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            {filteredAttendance.filter((a) => a.status === 'present').length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">تسجيل حضور فعلي</p>
        </div>

        {/* Top Discipline Category */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">الفئة الأكثر التزاماً</span>
            <div className="w-8 h-8 rounded-xl bg-amber-950 border border-amber-800 text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-amber-300 truncate">
            {categoryStats.length > 0 ? [...categoryStats].sort((a, b) => b.rate - a.rate)[0]?.name || '—' : '—'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            بنسبة حضور {categoryStats.length > 0 ? Math.max(...categoryStats.map((c) => c.rate), 0) : 0}%
          </p>
        </div>
      </div>

      {/* Category Rates Cards */}
      {categoryStats.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Building className="w-4 h-4 text-red-500" />
            <span>نسبة الحضور حسب الفئات والأصناف الرياضية</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryStats.map((cat) => (
              <div
                key={cat.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-bold text-white text-xs sm:text-sm">{cat.name}</h4>
                  <span className="font-black text-sm text-emerald-400">{cat.rate}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      cat.rate >= 80 ? 'bg-emerald-500' : cat.rate >= 60 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${cat.rate}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{cat.present} من أصل {cat.totalEntries} حضور</span>
                  <span>{cat.membersCount} لاعب مسجل</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="ابحث باسم اللاعب أو رقم العضوية..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-red-500"
          >
            <option value="all">كل الفئات والأصناف</option>
            {groups.map((g) => (
              <option key={g.id} value={g.category || g.name}>
                {g.name}
              </option>
            ))}
          </select>

          {/* Period Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setPeriodFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                periodFilter === 'all' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              كامل الموسم
            </button>
            <button
              onClick={() => setPeriodFilter('month')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                periodFilter === 'month' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              هذا الشهر
            </button>
            <button
              onClick={() => setPeriodFilter('week')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                periodFilter === 'week' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              آخر 7 أيام
            </button>
          </div>
        </div>
      </div>

      {/* Players Attendance Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-red-500" />
            <span>كشف نسب حضور اللاعبين الفردية</span>
          </h3>
          <span className="text-xs text-slate-400">
            إجمالي اللاعبين: {playerStats.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th className="p-3.5">اللاعب</th>
                <th className="p-3.5">الفئة / الصنف</th>
                <th className="p-3.5 text-center">الحصص المحضورة</th>
                <th className="p-3.5 text-center">نسبة الحضور</th>
                <th className="p-3.5">مؤشر المواظبة</th>
                <th className="p-3.5">التقييم الفني</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {playerStats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-slate-400">
                    لا توجد بيانات حضور مسجلة تطابق البحث أو الفئة المحددة.
                  </td>
                </tr>
              ) : (
                playerStats.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-white">{p.name}</div>
                      <div className="font-mono text-[11px] text-red-400">{p.memberNumber}</div>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-300">{p.category}</td>
                    <td className="p-3.5 text-center font-bold text-slate-200">
                      {p.presentCount} <span className="text-slate-500 text-xs">/ {p.totalRecorded}</span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="font-black text-sm text-white">{p.rate}%</span>
                    </td>
                    <td className="p-3.5 min-w-[140px]">
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            p.rate >= 80 ? 'bg-emerald-500' : p.rate >= 60 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${p.rate}%` }}
                        />
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${p.statusColor}`}
                      >
                        {p.statusText}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
