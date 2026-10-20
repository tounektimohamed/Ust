import React, { useState } from 'react';
import { X, Check, Clock, UserX, AlertCircle, Save } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { SportsGroup, AttendanceStatus } from '../types';

interface ManualAttendanceModalProps {
  selectedGroup: SportsGroup;
  sessionDate: string;
  onClose: () => void;
}

export const ManualAttendanceModal: React.FC<ManualAttendanceModalProps> = ({
  selectedGroup,
  sessionDate,
  onClose,
}) => {
  const { members, attendance, recordAttendance, updateAttendance } = useData();
  const { profile } = useAuth();

  const groupMembers = members.filter(
    (m) => (m.groupId === selectedGroup.id || m.category === selectedGroup.category) && m.status !== 'archived'
  );

  // Map of existing attendance for this session
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(() => {
    const map: Record<string, AttendanceStatus> = {};
    groupMembers.forEach((m) => {
      const rec = attendance.find((a) => a.memberId === m.id && a.groupId === selectedGroup.id && a.sessionDate === sessionDate);
      if (rec) {
        map[m.id] = rec.status;
      }
    });
    return map;
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSetStatus = (memberId: string, status: AttendanceStatus) => {
    setStatuses((prev) => ({
      ...prev,
      [memberId]: status,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const toCreate: any[] = [];

    for (const m of groupMembers) {
      const currentStatus = statuses[m.id];
      if (!currentStatus) continue;

      const existingRec = attendance.find(
        (a) => a.memberId === m.id && a.groupId === selectedGroup.id && a.sessionDate === sessionDate
      );

      if (existingRec) {
        if (existingRec.status !== currentStatus) {
          await updateAttendance(existingRec.id, { status: currentStatus });
        }
      } else {
        toCreate.push({
          groupId: selectedGroup.id,
          groupName: selectedGroup.name,
          sessionDate,
          sessionTime: new Date().toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit' }),
          memberId: m.id,
          memberName: `${m.firstName} ${m.lastName}`,
          memberNumber: m.memberNumber,
          status: currentStatus,
          method: 'manual',
          recordedBy: profile?.displayName || 'المدرب',
          notes: 'تسجيل يدوي',
        });
      }
    }

    if (toCreate.length > 0) {
      await recordAttendance(toCreate);
    }

    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto no-print">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-auto text-slate-100 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-800 border-b border-slate-700">
          <div>
            <h3 className="text-base font-bold text-white">
              دفتر الحضور اليدوي للحصة
            </h3>
            <p className="text-xs text-slate-400">
              {selectedGroup.name} • {sessionDate}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {groupMembers.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">
              لا يوجد لاعبون مسجلون في هذه المجموعة حالياً.
            </p>
          ) : (
            groupMembers.map((member) => {
              const current = statuses[member.id];
              return (
                <div
                  key={member.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-red-950 text-red-300 border border-red-800 flex items-center justify-center font-bold text-xs">
                      {member.firstName[0]}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {member.firstName} {member.lastName}
                      </h4>
                      <p className="text-xs text-slate-400">
                        الرقم: <span className="font-mono text-red-400">{member.memberNumber}</span> • {member.category}
                      </p>
                    </div>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleSetStatus(member.id, 'present')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        current === 'present'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                          : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>حاضر</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetStatus(member.id, 'late')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        current === 'late'
                          ? 'bg-amber-600 text-white shadow-md shadow-amber-950'
                          : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>متأخر</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetStatus(member.id, 'excused')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        current === 'excused'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                          : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>مبرر</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetStatus(member.id, 'absent')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        current === 'absent'
                          ? 'bg-red-600 text-white shadow-md shadow-red-950'
                          : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>غائب</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-5 py-3.5 bg-slate-800 border-t border-slate-700 flex justify-between items-center text-xs text-slate-400">
          <span>يتم حفظ وتوثيق أي تعديل في سجل التدقيق</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition flex items-center gap-1.5 shadow-md shadow-red-950"
            >
              <Save className="w-4 h-4" />
              <span>حفظ سجل الحضور</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
