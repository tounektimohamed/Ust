export type UserRole = 'admin' | 'treasurer' | 'coach' | 'viewer';

export interface CoachAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  assignedGroupIds?: string[];
  assignedCategories?: string[];
  active: boolean;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  assignedGroupIds?: string[];
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type MemberStatus = 'active' | 'suspended' | 'archived';

export interface Member {
  id: string;
  memberNumber: string; // e.g. UST-2026-042
  firstName: string;
  lastName: string;
  photoUrl?: string;
  birthDate: string;
  phone?: string;
  parentPhone?: string; // Contact for youth / minor
  address?: string;
  registrationDate: string;
  sport: string; // e.g. كرة القدم - فرع الشبان
  category: string; // e.g. U11 أداني، U13 أصاغر، U15 أواسط
  groupId?: string;
  status: MemberStatus;
  emergencyContact?: string;
  adminNotes?: string;
  qrCode: string; // Unique technical token / ID
  createdAt?: string;
  updatedAt?: string;
}

export interface SportsGroup {
  id: string;
  name: string; // e.g. "فئة الأداني (U13) - الفوج أ"
  category: string; // e.g. "U13"
  coachIds?: string[];
  scheduleDays: string; // e.g. "الثلاثاء، الخميس، السبت"
  scheduleTime: string; // e.g. "16:30 - 18:00"
  location: string; // e.g. "ملعب المرحوم نجيب الخطاب بتطاوين"
  active: boolean;
  createdAt?: string;
}

export type SubscriptionType = 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'trial';
export type SubscriptionStatus = 'active' | 'expired' | 'suspended' | 'trial';
export type PaymentStatus = 'paid' | 'partial' | 'unpaid';

export interface Subscription {
  id: string;
  memberId: string;
  memberName: string;
  type: SubscriptionType;
  amount: number; // In TND / DT
  discountType: 'percentage' | 'fixed' | 'none';
  discountValue: number;
  finalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type PaymentMethod = 'cash' | 'transfer' | 'check' | 'other';
export type PaymentValidity = 'valid' | 'cancelled';

export interface PaymentReceipt {
  id: string;
  receiptNumber: string; // e.g. "0045"
  season: string; // "2026/2027"
  subscriptionId?: string;
  memberId: string;
  memberName: string;
  amount: number; // in TND
  paymentMethod: PaymentMethod;
  paymentDate: string;
  receiverName: string; // e.g. "أمين المال - فرع الشبان"
  status: PaymentValidity;
  receiptType?: 'subscription' | 'donation' | 'both';
  cancellationReason?: string;
  notes?: string;
  createdAt?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'unexcused';
export type AttendanceMethod = 'manual' | 'qr';

export interface AttendanceRecord {
  id: string;
  groupId: string;
  groupName: string;
  sessionDate: string;
  sessionTime?: string;
  memberId: string;
  memberName: string;
  memberNumber: string;
  status: AttendanceStatus;
  method: AttendanceMethod;
  recordedBy: string;
  notes?: string;
  createdAt: string;
}

export interface ClubExpense {
  id: string;
  title: string;
  amount: number;
  category: string; // تجهيزات رياضية، نقل، إعاشة، طبية، أخرى
  date: string;
  recordedBy: string;
  notes?: string;
  createdAt?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  performedBy: string;
  timestamp: string;
}
