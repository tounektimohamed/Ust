import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { collection, doc, getDoc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile, UserRole, CoachAccount } from '../types';

interface AuthContextType {
  currentUser: { uid: string; email: string; displayName?: string } | null;
  profile: UserProfile | null;
  activeRole: UserRole;
  loading: boolean;
  coaches: CoachAccount[];
  addCoach: (coach: Omit<CoachAccount, 'id' | 'createdAt'>) => Promise<string>;
  deleteCoach: (id: string) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName: string, role?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isTreasurer: boolean;
  isCoach: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper for SHA-256 password hashing
export async function hashPassword(pass: string): Promise<string> {
  const enc = new TextEncoder().encode(pass);
  const hash = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<{ uid: string; email: string; displayName?: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('admin');
  const [loading, setLoading] = useState(true);

  // Coaches list
  const [coaches, setCoaches] = useState<CoachAccount[]>(() => {
    const cached = localStorage.getItem('ust_clean_coaches_v1');
    return cached ? JSON.parse(cached) : [];
  });

  // Sync coaches to localStorage
  useEffect(() => {
    localStorage.setItem('ust_clean_coaches_v1', JSON.stringify(coaches));
  }, [coaches]);

  // Firestore listener for coaches
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'coaches'), (snap) => {
        const list: CoachAccount[] = [];
        snap.forEach((d) => {
          list.push({ ...d.data(), id: d.id } as CoachAccount);
        });
        setCoaches(list);
      }, (err) => console.warn('Coaches listener note:', err));

      return () => unsub();
    } catch (e) {
      console.warn('Coaches listener offline:', e);
    }
  }, []);

  // Check persistent session on boot
  useEffect(() => {
    const initAuth = async () => {
      // 1. Check stored user session
      const storedSession = localStorage.getItem('ust_admin_session');
      if (storedSession) {
        try {
          const parsed = JSON.parse(storedSession);
          setCurrentUser(parsed);
          setProfile({
            uid: parsed.uid,
            email: parsed.email,
            displayName: parsed.displayName || (parsed.role === 'coach' ? 'المدرب' : 'المسؤول الرئيسي'),
            role: parsed.role || 'admin',
            assignedGroupIds: parsed.assignedGroupIds,
          });
          setActiveRole(parsed.role || 'admin');
          setLoading(false);
          return;
        } catch (e) {
          console.warn('Session parse note:', e);
        }
      }

      // 2. Check Firebase Auth state
      onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          const userObj = {
            uid: fbUser.uid,
            email: fbUser.email || 'tounekti2020@gmail.com',
            displayName: fbUser.displayName || 'المسؤول الرئيسي',
            role: 'admin' as UserRole,
          };
          setCurrentUser(userObj);
          setProfile({
            uid: userObj.uid,
            email: userObj.email,
            displayName: userObj.displayName,
            role: 'admin',
          });
          setActiveRole('admin');
          localStorage.setItem('ust_admin_session', JSON.stringify(userObj));
        }
        setLoading(false);
      });
    };

    initAuth();
  }, []);

  // Create new coach account
  const addCoach = async (data: Omit<CoachAccount, 'id' | 'createdAt'>): Promise<string> => {
    const id = 'coach-' + Date.now().toString(36);
    const now = new Date().toISOString();
    const newCoach: CoachAccount = { ...data, id, createdAt: now };

    setCoaches((prev) => [...prev, newCoach]);

    // Save to Firestore
    try {
      await setDoc(doc(db, 'coaches', id), newCoach);
    } catch (e) {
      console.warn('Firestore add coach note:', e);
    }

    // Try linking in Firebase Auth for email authentication
    try {
      await createUserWithEmailAndPassword(auth, data.email.trim().toLowerCase(), 'USTcoach2026!');
    } catch {
      // Handled via local/firestore hash
    }

    return id;
  };

  // Delete coach account
  const deleteCoach = async (id: string): Promise<void> => {
    setCoaches((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteDoc(doc(db, 'coaches', id));
    } catch (e) {
      console.warn('Firestore delete coach note:', e);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (!cleanEmail || !cleanPass) {
      throw new Error('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
    }

    const passHash = await hashPassword(cleanPass);

    // 1. Check if matching any Coach account
    const matchedCoach = coaches.find((c) => c.email.trim().toLowerCase() === cleanEmail && c.active);
    if (matchedCoach) {
      if (matchedCoach.passwordHash === passHash) {
        const userObj = {
          uid: matchedCoach.id,
          email: matchedCoach.email,
          displayName: matchedCoach.name,
          role: 'coach' as UserRole,
          assignedGroupIds: matchedCoach.assignedGroupIds,
        };
        setCurrentUser(userObj);
        setProfile({
          uid: matchedCoach.id,
          email: matchedCoach.email,
          displayName: matchedCoach.name,
          role: 'coach',
          assignedGroupIds: matchedCoach.assignedGroupIds,
        });
        setActiveRole('coach');
        localStorage.setItem('ust_admin_session', JSON.stringify(userObj));
        return;
      } else {
        throw new Error('كلمة المرور الخاصة بحساب المدرب غير صحيحة.');
      }
    }

    // Also check Firestore directly in case coach was just added in another tab
    try {
      const coachSnap = await getDoc(doc(db, 'coaches', cleanEmail));
      if (coachSnap.exists()) {
        const cData = coachSnap.data() as CoachAccount;
        if (cData.passwordHash === passHash) {
          const userObj = {
            uid: cData.id || coachSnap.id,
            email: cData.email,
            displayName: cData.name,
            role: 'coach' as UserRole,
            assignedGroupIds: cData.assignedGroupIds,
          };
          setCurrentUser(userObj);
          setProfile({
            uid: userObj.uid,
            email: userObj.email,
            displayName: userObj.displayName,
            role: 'coach',
            assignedGroupIds: userObj.assignedGroupIds,
          });
          setActiveRole('coach');
          localStorage.setItem('ust_admin_session', JSON.stringify(userObj));
          return;
        }
      }
    } catch (e) {
      console.warn('Direct coach query note:', e);
    }

    // 2. Attempt Administrator Login via Firebase Auth
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
      const user = cred.user;
      const userObj = {
        uid: user.uid,
        email: user.email || cleanEmail,
        displayName: user.displayName || 'المسؤول الرئيسي',
        role: 'admin' as UserRole,
      };
      setCurrentUser(userObj);
      setProfile({
        uid: userObj.uid,
        email: userObj.email,
        displayName: userObj.displayName,
        role: 'admin',
      });
      setActiveRole('admin');
      localStorage.setItem('ust_admin_session', JSON.stringify(userObj));
      return;
    } catch (fbErr: any) {
      // 3. Fallback: Verify Administrator password hash from Firestore or local
      let authDoc: any = null;
      try {
        const snap = await getDoc(doc(db, 'system', 'admin_auth'));
        if (snap.exists()) {
          authDoc = snap.data();
        }
      } catch (err) {
        console.warn('admin_auth read note:', err);
      }

      const localHash = localStorage.getItem('ust_admin_pwd_hash');

      if (authDoc && authDoc.passwordHash) {
        if (authDoc.passwordHash === passHash && (!authDoc.email || authDoc.email.toLowerCase() === cleanEmail)) {
          const userObj = {
            uid: authDoc.uid || 'admin-ust-01',
            email: cleanEmail,
            displayName: authDoc.displayName || 'المسؤول الرئيسي',
            role: 'admin' as UserRole,
          };
          setCurrentUser(userObj);
          setProfile({
            uid: userObj.uid,
            email: userObj.email,
            displayName: userObj.displayName,
            role: 'admin',
          });
          setActiveRole('admin');
          localStorage.setItem('ust_admin_session', JSON.stringify(userObj));
          return;
        } else {
          throw new Error('بيانات الدخول غير صحيحة. يرجى التثبت من البريد وكلمة المرور.');
        }
      } else if (localHash) {
        if (localHash === passHash) {
          const userObj = {
            uid: 'admin-ust-01',
            email: cleanEmail,
            displayName: 'المسؤول الرئيسي',
            role: 'admin' as UserRole,
          };
          setCurrentUser(userObj);
          setProfile({
            uid: userObj.uid,
            email: userObj.email,
            displayName: userObj.displayName,
            role: 'admin',
          });
          setActiveRole('admin');
          localStorage.setItem('ust_admin_session', JSON.stringify(userObj));
          return;
        } else {
          throw new Error('كلمة المرور غير صحيحة. يرجى التثبت من كلمة المرور.');
        }
      } else {
        // Initial first-time setup for the club admin
        try {
          await setDoc(doc(db, 'system', 'admin_auth'), {
            email: cleanEmail,
            passwordHash: passHash,
            displayName: 'المسؤول الرئيسي (فرع الشبان)',
            initializedAt: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('Could not save to system/admin_auth:', e);
        }

        localStorage.setItem('ust_admin_pwd_hash', passHash);

        const userObj = {
          uid: 'admin-ust-01',
          email: cleanEmail,
          displayName: 'المسؤول الرئيسي (فرع الشبان)',
          role: 'admin' as UserRole,
        };
        setCurrentUser(userObj);
        setProfile({
          uid: userObj.uid,
          email: userObj.email,
          displayName: userObj.displayName,
          role: 'admin',
        });
        setActiveRole('admin');
        localStorage.setItem('ust_admin_session', JSON.stringify(userObj));
      }
    }
  };

  const registerWithEmail = async (email: string, pass: string, displayName: string, role: UserRole = 'admin') => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (cleanPass.length < 6) {
      throw new Error('كلمة المرور يجب أن تتكون من 6 أحرف أو أرقام على الأقل.');
    }

    const passHash = await hashPassword(cleanPass);

    if (role === 'coach') {
      // Save as coach
      await addCoach({
        name: displayName.trim() || 'مدرب فرع الشبان',
        email: cleanEmail,
        passwordHash: passHash,
        active: true,
      });

      const userObj = {
        uid: 'coach-' + Date.now().toString(36),
        email: cleanEmail,
        displayName: displayName.trim() || 'مدرب فرع الشبان',
        role: 'coach' as UserRole,
      };
      setCurrentUser(userObj);
      setProfile({
        uid: userObj.uid,
        email: userObj.email,
        displayName: userObj.displayName,
        role: 'coach',
      });
      setActiveRole('coach');
      localStorage.setItem('ust_admin_session', JSON.stringify(userObj));
      return;
    }

    // Save official admin credentials to Firestore
    try {
      await setDoc(doc(db, 'system', 'admin_auth'), {
        email: cleanEmail,
        passwordHash: passHash,
        displayName: displayName.trim() || 'المسؤول الرئيسي',
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('admin_auth write note:', e);
    }

    localStorage.setItem('ust_admin_pwd_hash', passHash);

    try {
      await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
    } catch {
      try {
        await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
      } catch {
        // Handled via hash
      }
    }

    const userObj = {
      uid: 'admin-ust-01',
      email: cleanEmail,
      displayName: displayName.trim() || 'المسؤول الرئيسي',
      role: 'admin' as UserRole,
    };
    setCurrentUser(userObj);
    setProfile({
      uid: userObj.uid,
      email: userObj.email,
      displayName: userObj.displayName,
      role: 'admin',
    });
    setActiveRole('admin');
    localStorage.setItem('ust_admin_session', JSON.stringify(userObj));
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.warn('Sign out note:', err);
    }
    localStorage.removeItem('ust_admin_session');
    setCurrentUser(null);
    setProfile(null);
    setActiveRole('viewer');
  };

  const isAdmin = activeRole === 'admin';
  const isTreasurer = activeRole === 'treasurer' || activeRole === 'admin';
  const isCoach = activeRole === 'coach';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        activeRole,
        loading,
        coaches,
        addCoach,
        deleteCoach,
        loginWithEmail,
        registerWithEmail,
        signOut,
        isAdmin,
        isTreasurer,
        isCoach,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
