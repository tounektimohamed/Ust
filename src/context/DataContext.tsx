import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Member,
  SportsGroup,
  Subscription,
  PaymentReceipt,
  AttendanceRecord,
  ClubExpense,
  AuditLog
} from '../types';

interface SyncItem {
  id: string;
  collection: string;
  type: 'set' | 'update' | 'delete';
  data?: any;
  timestamp: string;
}

interface DataContextType {
  members: Member[];
  groups: SportsGroup[];
  subscriptions: Subscription[];
  payments: PaymentReceipt[];
  attendance: AttendanceRecord[];
  expenses: ClubExpense[];
  auditLogs: AuditLog[];
  isOnline: boolean;
  syncQueue: SyncItem[];
  isSyncing: boolean;
  addMember: (member: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateMember: (id: string, updates: Partial<Member>) => Promise<void>;
  archiveMember: (id: string) => Promise<void>;
  addGroup: (group: Omit<SportsGroup, 'id' | 'createdAt'>) => Promise<string>;
  updateGroup: (id: string, updates: Partial<SportsGroup>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  addSubscription: (sub: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateSubscription: (id: string, updates: Partial<Subscription>) => Promise<void>;
  addPayment: (payment: Omit<PaymentReceipt, 'id' | 'createdAt'>) => Promise<string>;
  cancelPayment: (id: string, reason: string, cancelledBy: string) => Promise<void>;
  recordAttendance: (records: Omit<AttendanceRecord, 'id' | 'createdAt'>[]) => Promise<void>;
  updateAttendance: (id: string, updates: Partial<AttendanceRecord>) => Promise<void>;
  addExpense: (expense: Omit<ClubExpense, 'id' | 'createdAt'>) => Promise<string>;
  syncNow: () => Promise<void>;
  clearAllData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper to filter out any mock or test data generated previously
const isMockRecord = (id?: string, name?: string): boolean => {
  if (!id) return false;
  const mockIds = ['mem-001', 'sub-001', 'sub-mvge3s8w', 'grp-001', 'grp-002', 'grp-003', 'grp-004', 'pay-001'];
  if (mockIds.includes(id)) return true;
  if (name && (name.includes('محمد التونكتي') || name.includes('فريق الأصاغر أ') || name.includes('فريق المدارس ب'))) {
    return true;
  }
  return false;
};

// Purge all old mock keys and dummy data from storage on version bump
if (typeof window !== 'undefined') {
  const purgeVersion = 'ust_purged_mock_v12';
  if (!localStorage.getItem(purgeVersion)) {
    const keysToClean = [
      'ust_members', 'ust_members_v2', 'ust_members_v3', 'ust_members_v4', 'ust_real_members',
      'ust_subscriptions', 'ust_subscriptions_v2', 'ust_subscriptions_v3', 'ust_real_subscriptions',
      'ust_payments', 'ust_payments_v2', 'ust_payments_v3', 'ust_real_payments',
      'ust_attendance', 'ust_attendance_v2', 'ust_real_attendance',
      'ust_expenses', 'ust_expenses_v2', 'ust_real_expenses',
      'ust_groups', 'ust_groups_v2', 'ust_groups_v3', 'ust_groups_v4', 'ust_real_groups',
      'ust_sync_queue', 'ust_sync_queue_v2', 'ust_real_sync_queue'
    ];
    keysToClean.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(purgeVersion, 'true');
  }
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ZERO fake members - empty list
  const [members, setMembers] = useState<Member[]>(() => {
    const cached = localStorage.getItem('ust_clean_members_v12');
    if (!cached) return [];
    try {
      const parsed: Member[] = JSON.parse(cached);
      return parsed.filter((m) => !isMockRecord(m.id, `${m.firstName} ${m.lastName}`));
    } catch {
      return [];
    }
  });

  // ZERO predefined groups - categories created only by the administrator
  const [groups, setGroups] = useState<SportsGroup[]>(() => {
    const cached = localStorage.getItem('ust_clean_groups_v12');
    if (!cached) return [];
    try {
      const parsed: SportsGroup[] = JSON.parse(cached);
      return parsed.filter((g) => !isMockRecord(g.id, g.name));
    } catch {
      return [];
    }
  });

  // ZERO fake subscriptions - 100% empty list
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    const cached = localStorage.getItem('ust_clean_subscriptions_v12');
    if (!cached) return [];
    try {
      const parsed: Subscription[] = JSON.parse(cached);
      return parsed.filter((s) => !isMockRecord(s.id, s.memberName));
    } catch {
      return [];
    }
  });

  // ZERO fake payments - empty list
  const [payments, setPayments] = useState<PaymentReceipt[]>(() => {
    const cached = localStorage.getItem('ust_clean_payments_v12');
    if (!cached) return [];
    try {
      const parsed: PaymentReceipt[] = JSON.parse(cached);
      return parsed.filter((p) => !isMockRecord(p.id, p.memberName));
    } catch {
      return [];
    }
  });

  // ZERO fake attendance - empty list
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const cached = localStorage.getItem('ust_clean_attendance_v12');
    if (!cached) return [];
    try {
      const parsed: AttendanceRecord[] = JSON.parse(cached);
      return parsed.filter((a) => !isMockRecord(a.id, a.memberName));
    } catch {
      return [];
    }
  });

  // ZERO fake expenses - empty list
  const [expenses, setExpenses] = useState<ClubExpense[]>(() => {
    const cached = localStorage.getItem('ust_clean_expenses_v12');
    if (!cached) return [];
    try {
      const parsed: ClubExpense[] = JSON.parse(cached);
      return parsed.filter((e) => !isMockRecord(e.id, e.title));
    } catch {
      return [];
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const cached = localStorage.getItem('ust_clean_audit_logs_v12');
    return cached ? JSON.parse(cached) : [];
  });

  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncQueue, setSyncQueue] = useState<SyncItem[]>(() => {
    const cached = localStorage.getItem('ust_clean_sync_queue_v12');
    if (!cached) return [];
    try {
      const parsed: SyncItem[] = JSON.parse(cached);
      return parsed.filter((q) => !isMockRecord(q.id));
    } catch {
      return [];
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync state changes to clean local storage
  useEffect(() => {
    localStorage.setItem('ust_clean_members_v12', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('ust_clean_groups_v12', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('ust_clean_subscriptions_v12', JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem('ust_clean_payments_v12', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('ust_clean_attendance_v12', JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem('ust_clean_expenses_v12', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('ust_clean_audit_logs_v12', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('ust_clean_sync_queue_v12', JSON.stringify(syncQueue));
  }, [syncQueue]);

  // Online / Offline state
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncNow();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Connect live listeners and filter out any old mock data
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    try {
      const unsubMembers = onSnapshot(collection(db, 'members'), (snapshot) => {
        if (!snapshot.empty) {
          const list: Member[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as Member;
            if (!isMockRecord(d.id, `${data.firstName} ${data.lastName}`)) {
              list.push({ ...data, id: d.id });
            }
          });
          setMembers(list);
        }
      }, (err) => console.warn('Snapshot note:', err.message));
      unsubs.push(unsubMembers);

      const unsubGroups = onSnapshot(collection(db, 'groups'), (snapshot) => {
        if (!snapshot.empty) {
          const list: SportsGroup[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as SportsGroup;
            if (!isMockRecord(d.id, data.name)) {
              list.push({ ...data, id: d.id });
            }
          });
          setGroups(list);
        }
      }, (err) => console.warn('Snapshot note:', err.message));
      unsubs.push(unsubGroups);

      const unsubSubs = onSnapshot(collection(db, 'subscriptions'), (snapshot) => {
        if (!snapshot.empty) {
          const list: Subscription[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as Subscription;
            if (!isMockRecord(d.id, data.memberName)) {
              list.push({ ...data, id: d.id });
            }
          });
          setSubscriptions(list);
        }
      }, (err) => console.warn('Snapshot note:', err.message));
      unsubs.push(unsubSubs);

      const unsubPayments = onSnapshot(collection(db, 'payments'), (snapshot) => {
        if (!snapshot.empty) {
          const list: PaymentReceipt[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as PaymentReceipt;
            if (!isMockRecord(d.id, data.memberName)) {
              list.push({ ...data, id: d.id });
            }
          });
          setPayments(list);
        }
      }, (err) => console.warn('Snapshot note:', err.message));
      unsubs.push(unsubPayments);

      const unsubAttendance = onSnapshot(collection(db, 'attendance'), (snapshot) => {
        if (!snapshot.empty) {
          const list: AttendanceRecord[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as AttendanceRecord;
            if (!isMockRecord(d.id, data.memberName)) {
              list.push({ ...data, id: d.id });
            }
          });
          setAttendance(list);
        }
      }, (err) => console.warn('Snapshot note:', err.message));
      unsubs.push(unsubAttendance);

      const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
        if (!snapshot.empty) {
          const list: ClubExpense[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as ClubExpense;
            if (!isMockRecord(d.id, data.title)) {
              list.push({ ...data, id: d.id });
            }
          });
          setExpenses(list);
        }
      }, (err) => console.warn('Snapshot note:', err.message));
      unsubs.push(unsubExpenses);
    } catch (err) {
      console.warn('Live listener note:', err);
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, []);

  // Sync queue processor
  const syncNow = useCallback(async () => {
    if (isSyncing || syncQueue.length === 0 || !navigator.onLine) {
      return;
    }
    setIsSyncing(true);
    const queueCopy = [...syncQueue];

    for (const item of queueCopy) {
      // Skip any legacy mock items
      if (isMockRecord(item.id)) {
        setSyncQueue((prev) => prev.filter((q) => q.id !== item.id));
        continue;
      }

      try {
        if (item.type === 'set' && item.data) {
          await setDoc(doc(db, item.collection, item.id), item.data);
        } else if (item.type === 'update' && item.data) {
          await updateDoc(doc(db, item.collection, item.id), item.data);
        } else if (item.type === 'delete') {
          await deleteDoc(doc(db, item.collection, item.id));
        }
        setSyncQueue((prev) => prev.filter((q) => q.id !== item.id));
      } catch (err: any) {
        console.warn('Sync queue note:', err.message);
        // Remove bad item to prevent queue congestion
        setSyncQueue((prev) => prev.filter((q) => q.id !== item.id));
      }
    }
    setIsSyncing(false);
  }, [isSyncing, syncQueue]);

  // Clean and empty all data completely
  const clearAllData = () => {
    setMembers([]);
    setGroups([]);
    setSubscriptions([]);
    setPayments([]);
    setAttendance([]);
    setExpenses([]);
    setSyncQueue([]);
    setAuditLogs([]);
    const keysToRemove = [
      'ust_clean_members_v12',
      'ust_clean_groups_v12',
      'ust_clean_subscriptions_v12',
      'ust_clean_payments_v12',
      'ust_clean_attendance_v12',
      'ust_clean_expenses_v12',
      'ust_clean_sync_queue_v12',
      'ust_clean_audit_logs_v12'
    ];
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  };

  // Add Member
  const addMember = async (data: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = 'mem-' + Date.now().toString(36);
    const now = new Date().toISOString();
    const newMember: Member = { ...data, id, createdAt: now, updatedAt: now };

    setMembers((prev) => [newMember, ...prev]);

    if (navigator.onLine) {
      try {
        await setDoc(doc(db, 'members', id), newMember);
      } catch (err) {
        setSyncQueue((prev) => [...prev, { id, collection: 'members', type: 'set', data: newMember, timestamp: now }]);
      }
    } else {
      setSyncQueue((prev) => [...prev, { id, collection: 'members', type: 'set', data: newMember, timestamp: now }]);
    }

    setAuditLogs((prev) => [
      {
        id: 'log-' + Date.now(),
        action: 'إضافة لاعب جديد',
        entity: 'المنتسبون',
        entityId: id,
        details: `تسجيل اللاعب: ${newMember.firstName} ${newMember.lastName} (${newMember.memberNumber})`,
        performedBy: 'المسؤول',
        timestamp: now,
      },
      ...prev
    ]);

    return id;
  };

  const updateMember = async (id: string, updates: Partial<Member>) => {
    const now = new Date().toISOString();
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates, updatedAt: now } : m)));

    if (navigator.onLine) {
      try {
        await updateDoc(doc(db, 'members', id), { ...updates, updatedAt: now });
      } catch (err) {
        setSyncQueue((prev) => [...prev, { id, collection: 'members', type: 'update', data: { ...updates, updatedAt: now }, timestamp: now }]);
      }
    } else {
      setSyncQueue((prev) => [...prev, { id, collection: 'members', type: 'update', data: { ...updates, updatedAt: now }, timestamp: now }]);
    }
  };

  const archiveMember = async (id: string) => {
    const target = members.find((m) => m.id === id);
    await updateMember(id, { status: 'archived' });
    setAuditLogs((prev) => [
      {
        id: 'log-' + Date.now(),
        action: 'أرشفة بطاقة لاعب',
        entity: 'المنتسبون',
        entityId: id,
        details: `أرشفة بطاقة: ${target ? target.firstName + ' ' + target.lastName : id}`,
        performedBy: 'المسؤول',
        timestamp: new Date().toISOString(),
      },
      ...prev
    ]);
  };

  const addGroup = async (data: Omit<SportsGroup, 'id' | 'createdAt'>) => {
    const id = 'grp-' + Date.now().toString(36);
    const newGroup: SportsGroup = { ...data, id, createdAt: new Date().toISOString() };
    setGroups((prev) => [...prev, newGroup]);

    if (navigator.onLine) {
      try {
        await setDoc(doc(db, 'groups', id), newGroup);
      } catch (err) {
        setSyncQueue((prev) => [...prev, { id, collection: 'groups', type: 'set', data: newGroup, timestamp: new Date().toISOString() }]);
      }
    }
    return id;
  };

  const updateGroup = async (id: string, updates: Partial<SportsGroup>) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
    if (navigator.onLine) {
      try {
        await updateDoc(doc(db, 'groups', id), updates);
      } catch (err) {
        setSyncQueue((prev) => [...prev, { id, collection: 'groups', type: 'update', data: updates, timestamp: new Date().toISOString() }]);
      }
    }
  };

  const deleteGroup = async (id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
    if (navigator.onLine) {
      try {
        await deleteDoc(doc(db, 'groups', id));
      } catch (err) {
        setSyncQueue((prev) => [...prev, { id, collection: 'groups', type: 'delete', timestamp: new Date().toISOString() }]);
      }
    } else {
      setSyncQueue((prev) => [...prev, { id, collection: 'groups', type: 'delete', timestamp: new Date().toISOString() }]);
    }
  };

  const addSubscription = async (data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = 'sub-' + Date.now().toString(36);
    const now = new Date().toISOString();
    const newSub: Subscription = { ...data, id, createdAt: now, updatedAt: now };
    setSubscriptions((prev) => [newSub, ...prev]);

    if (navigator.onLine) {
      try {
        await setDoc(doc(db, 'subscriptions', id), newSub);
      } catch (err) {
        setSyncQueue((prev) => [...prev, { id, collection: 'subscriptions', type: 'set', data: newSub, timestamp: now }]);
      }
    } else {
      setSyncQueue((prev) => [...prev, { id, collection: 'subscriptions', type: 'set', data: newSub, timestamp: now }]);
    }
    return id;
  };

  const updateSubscription = async (id: string, updates: Partial<Subscription>) => {
    const now = new Date().toISOString();
    setSubscriptions((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: now } : s)));
    if (navigator.onLine) {
      try {
        await updateDoc(doc(db, 'subscriptions', id), { ...updates, updatedAt: now });
      } catch (err) {
        setSyncQueue((prev) => [...prev, { id, collection: 'subscriptions', type: 'update', data: { ...updates, updatedAt: now }, timestamp: now }]);
      }
    }
  };

  const addPayment = async (data: Omit<PaymentReceipt, 'id' | 'createdAt'>) => {
    const id = 'pay-' + Date.now().toString(36);
    const now = new Date().toISOString();
    const newPayment: PaymentReceipt = { ...data, id, createdAt: now };
    setPayments((prev) => [newPayment, ...prev]);

    if (data.subscriptionId) {
      const sub = subscriptions.find((s) => s.id === data.subscriptionId);
      if (sub) {
        const newPaid = Number(sub.paidAmount || 0) + Number(data.amount);
        const newRem = Math.max(0, sub.finalAmount - newPaid);
        const newStatus = newRem === 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';
        await updateSubscription(sub.id, {
          paidAmount: newPaid,
          remainingAmount: newRem,
          paymentStatus: newStatus,
        });
      }
    }

    if (navigator.onLine) {
      try {
        await setDoc(doc(db, 'payments', id), newPayment);
      } catch (err) {
        setSyncQueue((prev) => [...prev, { id, collection: 'payments', type: 'set', data: newPayment, timestamp: now }]);
      }
    } else {
      setSyncQueue((prev) => [...prev, { id, collection: 'payments', type: 'set', data: newPayment, timestamp: now }]);
    }

    setAuditLogs((prev) => [
      {
        id: 'log-' + Date.now(),
        action: 'إصدار وصل استخلاص رسمي',
        entity: 'الوصولات',
        entityId: id,
        details: `وصل رقم ${newPayment.receiptNumber} بمبلغ ${newPayment.amount} د.ت لفائدة: ${newPayment.memberName}`,
        performedBy: newPayment.receiverName || 'المسؤول',
        timestamp: now,
      },
      ...prev
    ]);

    return id;
  };

  const cancelPayment = async (id: string, reason: string, cancelledBy: string) => {
    const now = new Date().toISOString();
    setPayments((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: 'cancelled', cancellationReason: reason, cancelledBy } : p
      )
    );

    if (navigator.onLine) {
      try {
        await updateDoc(doc(db, 'payments', id), {
          status: 'cancelled',
          cancellationReason: reason,
          cancelledBy,
        });
      } catch (err) {
        setSyncQueue((prev) => [
          ...prev,
          {
            id,
            collection: 'payments',
            type: 'update',
            data: { status: 'cancelled', cancellationReason: reason, cancelledBy },
            timestamp: now,
          },
        ]);
      }
    }
  };

  const recordAttendance = async (records: Omit<AttendanceRecord, 'id' | 'createdAt'>[]) => {
    const now = new Date().toISOString();
    const newItems: AttendanceRecord[] = records.map((r, i) => ({
      ...r,
      id: 'att-' + Date.now().toString(36) + '-' + i,
      createdAt: now,
    }));

    setAttendance((prev) => [...newItems, ...prev]);

    for (const item of newItems) {
      if (navigator.onLine) {
        try {
          await setDoc(doc(db, 'attendance', item.id), item);
        } catch (err) {
          setSyncQueue((prev) => [...prev, { id: item.id, collection: 'attendance', type: 'set', data: item, timestamp: now }]);
        }
      } else {
        setSyncQueue((prev) => [...prev, { id: item.id, collection: 'attendance', type: 'set', data: item, timestamp: now }]);
      }
    }
  };

  const updateAttendance = async (id: string, updates: Partial<AttendanceRecord>) => {
    setAttendance((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    if (navigator.onLine) {
      try {
        await updateDoc(doc(db, 'attendance', id), updates);
      } catch (err) {
        setSyncQueue((prev) => [
          ...prev,
          { id, collection: 'attendance', type: 'update', data: updates, timestamp: new Date().toISOString() },
        ]);
      }
    }
  };

  const addExpense = async (data: Omit<ClubExpense, 'id' | 'createdAt'>) => {
    const id = 'exp-' + Date.now().toString(36);
    const now = new Date().toISOString();
    const newExp: ClubExpense = { ...data, id, createdAt: now };
    setExpenses((prev) => [newExp, ...prev]);

    if (navigator.onLine) {
      try {
        await setDoc(doc(db, 'expenses', id), newExp);
      } catch (err) {
        setSyncQueue((prev) => [...prev, { id, collection: 'expenses', type: 'set', data: newExp, timestamp: now }]);
      }
    } else {
      setSyncQueue((prev) => [...prev, { id, collection: 'expenses', type: 'set', data: newExp, timestamp: now }]);
    }
    return id;
  };

  return (
    <DataContext.Provider
      value={{
        members,
        groups,
        subscriptions,
        payments,
        attendance,
        expenses,
        auditLogs,
        isOnline,
        syncQueue,
        isSyncing,
        addMember,
        updateMember,
        archiveMember,
        addGroup,
        updateGroup,
        deleteGroup,
        addSubscription,
        updateSubscription,
        addPayment,
        cancelPayment,
        recordAttendance,
        updateAttendance,
        addExpense,
        syncNow,
        clearAllData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
