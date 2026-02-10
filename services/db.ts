
import { 
  collection, 
  getDocs, 
  getDoc,
  setDoc, 
  doc, 
  deleteDoc, 
  query, 
  where, 
  updateDoc,
  limit,
  orderBy
// @ts-ignore
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { db, auth } from './firebase';
import { Student, ClassSchedule, ClassSession, AttendanceRecord, GroupBatch, AppUser, LibraryResource, Announcement, Homework } from '../types';
import { addDays, format, addWeeks, isAfter, isBefore } from 'date-fns';

const COLLECTIONS = {
  STUDENTS: 'students',
  GROUPS: 'groups',
  SCHEDULES: 'classSchedules',
  SESSIONS: 'classSessions',
  ATTENDANCE: 'attendance',
  USERS: 'users',
  LIBRARY: 'library',
  ANNOUNCEMENTS: 'announcements',
  HOMEWORK: 'homework'
};

const CACHE_KEYS = {
  STUDENTS: 'ka_cache_students',
  SESSIONS: 'ka_cache_sessions',
  GROUPS: 'ka_cache_groups',
  LIBRARY: 'ka_cache_library'
};

const sanitize = (data: any) => {
  const clean = { ...data };
  Object.keys(clean).forEach(key => {
    if (clean[key] === undefined) {
      clean[key] = null;
    }
  });
  return clean;
};

async function getCurrentUserRole(): Promise<{ role: string, uid: string, email: string }> {
  const user = auth.currentUser;
  if (!user) return { role: 'collaborator', uid: '', email: '' };

  const email = user.email?.toLowerCase() || '';
  const isAdmin = email === 'kingcompiler.official@gmail.com';
  
  if (isAdmin) {
    return { role: 'admin', uid: user.uid, email };
  }

  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data() as AppUser;
      return { role: data.role || 'collaborator', uid: user.uid, email };
    }
  } catch (err) {
    console.error("DB: Role fetch error", err);
  }

  return { role: 'collaborator', uid: user.uid, email };
}

export const dbService = {
  getLibrary: async (useCache = true): Promise<LibraryResource[]> => {
    if (useCache) {
      const cached = localStorage.getItem(CACHE_KEYS.LIBRARY);
      if (cached) return JSON.parse(cached);
    }
    try {
      const snapshot = await getDocs(query(collection(db, COLLECTIONS.LIBRARY), orderBy('addedDate', 'desc')));
      const resources = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as LibraryResource));
      localStorage.setItem(CACHE_KEYS.LIBRARY, JSON.stringify(resources));
      return resources;
    } catch (err) {
      console.warn("DB: Library fetch error", err);
      return JSON.parse(localStorage.getItem(CACHE_KEYS.LIBRARY) || '[]');
    }
  },

  saveLibraryResource: async (resource: LibraryResource) => {
    await setDoc(doc(db, COLLECTIONS.LIBRARY, resource.id), sanitize(resource), { merge: true });
    const current = await dbService.getLibrary(true);
    const updated = current.filter(r => r.id !== resource.id);
    updated.unshift(resource);
    localStorage.setItem(CACHE_KEYS.LIBRARY, JSON.stringify(updated));
  },

  deleteLibraryResource: async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.LIBRARY, id));
    const current = await dbService.getLibrary(true);
    localStorage.setItem(CACHE_KEYS.LIBRARY, JSON.stringify(current.filter(r => r.id !== id)));
  },

  getAnnouncements: async (): Promise<Announcement[]> => {
    try {
      const snapshot = await getDocs(query(collection(db, COLLECTIONS.ANNOUNCEMENTS), orderBy('date', 'desc')));
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Announcement));
    } catch (err) {
      console.warn("DB: Announcements fetch error", err);
      return [];
    }
  },

  saveAnnouncement: async (announcement: Announcement) => {
    await setDoc(doc(db, COLLECTIONS.ANNOUNCEMENTS, announcement.id), sanitize(announcement), { merge: true });
  },

  deleteAnnouncement: async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.ANNOUNCEMENTS, id));
  },

  getHomework: async (level?: string, studentId?: string): Promise<Homework[]> => {
    try {
      const coll = collection(db, COLLECTIONS.HOMEWORK);
      let q = query(coll, orderBy('dueDate', 'desc'));
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Homework));
      
      if (!level && !studentId) return data;

      return data.filter(h => {
        const matchesStudent = studentId && h.studentId === studentId;
        const matchesLevel = level && h.level === level;
        const isGlobal = !h.studentId && !h.level;
        return matchesStudent || matchesLevel || isGlobal;
      });
    } catch (err) {
      console.warn("DB: Homework fetch error", err);
      return [];
    }
  },

  saveHomework: async (homework: Homework) => {
    await setDoc(doc(db, COLLECTIONS.HOMEWORK, homework.id), sanitize(homework), { merge: true });
  },

  deleteHomework: async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.HOMEWORK, id));
  },

  getStudents: async (useCache = true): Promise<Student[]> => {
    if (useCache) {
      const cached = localStorage.getItem(CACHE_KEYS.STUDENTS);
      if (cached) return JSON.parse(cached);
    }

    try {
      const { role, uid, email } = await getCurrentUserRole();
      const coll = collection(db, COLLECTIONS.STUDENTS);
      
      let q;
      if (role === 'admin') {
        q = query(coll);
      } else if (role === 'student') {
        q = query(coll, where('email', '==', email.toLowerCase()));
      } else {
        q = query(coll, where('collaboratorId', '==', uid));
      }
      
      const snapshot = await getDocs(q);
      const students = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        return { id: doc.id, status: 'active', ...data } as Student;
      }).sort((a: Student, b: Student) => (a.fullName || '').localeCompare(b.fullName || ''));
      
      localStorage.setItem(CACHE_KEYS.STUDENTS, JSON.stringify(students));
      return students;
    } catch (err: any) {
      return JSON.parse(localStorage.getItem(CACHE_KEYS.STUDENTS) || '[]');
    }
  },

  getStudent: async (id: string): Promise<Student | null> => {
    try {
      const studentDoc = await getDoc(doc(db, COLLECTIONS.STUDENTS, id));
      if (studentDoc.exists()) {
        return { id: studentDoc.id, ...studentDoc.data() } as Student;
      }
      return null;
    } catch (err) {
      console.error("DB: Error fetching student by ID", err);
      return null;
    }
  },
  
  saveStudent: async (student: Student) => {
    const studentRef = doc(db, COLLECTIONS.STUDENTS, student.id);
    await setDoc(studentRef, sanitize(student), { merge: true });
    
    const current = await dbService.getStudents(true);
    const updated = current.map(s => s.id === student.id ? student : s);
    if (!current.find(s => s.id === student.id)) updated.push(student);
    localStorage.setItem(CACHE_KEYS.STUDENTS, JSON.stringify(updated));
  },

  deleteStudent: async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.STUDENTS, id));
    const current = await dbService.getStudents(true);
    localStorage.setItem(CACHE_KEYS.STUDENTS, JSON.stringify(current.filter(s => s.id !== id)));
  },

  getGroups: async (useCache = true): Promise<GroupBatch[]> => {
    if (useCache) {
      const cached = localStorage.getItem(CACHE_KEYS.GROUPS);
      if (cached) return JSON.parse(cached);
    }
    try {
      const { role } = await getCurrentUserRole();
      if (role !== 'admin') return [];
      const snapshot = await getDocs(query(collection(db, COLLECTIONS.GROUPS)));
      const groups = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as GroupBatch))
        .sort((a: GroupBatch, b: GroupBatch) => (a.name || '').localeCompare(b.name || ''));
      localStorage.setItem(CACHE_KEYS.GROUPS, JSON.stringify(groups));
      return groups;
    } catch (err) { return JSON.parse(localStorage.getItem(CACHE_KEYS.GROUPS) || '[]'); }
  },

  saveGroup: async (group: GroupBatch) => {
    await setDoc(doc(db, COLLECTIONS.GROUPS, group.id), sanitize(group), { merge: true });
    const current = await dbService.getGroups(true);
    const updated = current.map(g => g.id === group.id ? group : g);
    if (!current.find(g => g.id === group.id)) updated.push(group);
    localStorage.setItem(CACHE_KEYS.GROUPS, JSON.stringify(updated));
  },

  deleteGroup: async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.GROUPS, id));
    const current = await dbService.getGroups(true);
    localStorage.setItem(CACHE_KEYS.GROUPS, JSON.stringify(current.filter(g => g.id !== id)));
  },

  getSchedules: async (studentId?: string, groupId?: string): Promise<ClassSchedule[]> => {
    try {
      const { role, uid } = await getCurrentUserRole();
      const coll = collection(db, COLLECTIONS.SCHEDULES);
      let q = query(coll);
      if (studentId) q = query(coll, where('studentId', '==', studentId));
      else if (groupId) q = query(coll, where('groupId', '==', groupId));
      else if (role !== 'admin' && uid) q = query(coll, where('collaboratorId', '==', uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as ClassSchedule));
    } catch (err) { return []; }
  },

  saveSchedule: async (schedule: ClassSchedule) => {
    await setDoc(doc(db, COLLECTIONS.SCHEDULES, schedule.id), sanitize(schedule), { merge: true });
    await dbService.generateSessionsForSchedule(schedule);
  },

  deleteSchedule: async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.SCHEDULES, id));
  },

  getSessions: async (useCache = true): Promise<ClassSession[]> => {
    if (useCache) {
      const cached = localStorage.getItem(CACHE_KEYS.SESSIONS);
      if (cached) return JSON.parse(cached);
    }
    try {
      const { role, uid } = await getCurrentUserRole();
      const coll = collection(db, COLLECTIONS.SESSIONS);
      let q = query(coll);
      if (role !== 'admin' && uid) q = query(coll, where('collaboratorId', '==', uid));
      const snapshot = await getDocs(q);
      const sessions = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as ClassSession))
        .sort((a: ClassSession, b: ClassSession) => (a.start || "").localeCompare(b.start || ""));
      localStorage.setItem(CACHE_KEYS.SESSIONS, JSON.stringify(sessions));
      return sessions;
    } catch (err) { return JSON.parse(localStorage.getItem(CACHE_KEYS.SESSIONS) || '[]'); }
  },

  updateSession: async (updatedSession: ClassSession) => {
    await updateDoc(doc(db, COLLECTIONS.SESSIONS, updatedSession.id), sanitize(updatedSession));
    const current = await dbService.getSessions(true);
    localStorage.setItem(CACHE_KEYS.SESSIONS, JSON.stringify(current.map(s => s.id === updatedSession.id ? updatedSession : s)));
  },

  getAttendance: async (studentId?: string): Promise<AttendanceRecord[]> => {
    try {
      const coll = collection(db, COLLECTIONS.ATTENDANCE);
      let q = studentId ? query(coll, where('studentId', '==', studentId)) : query(coll, limit(100));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
    } catch (err) { return []; }
  },

  saveAttendance: async (record: AttendanceRecord) => {
    await setDoc(doc(db, COLLECTIONS.ATTENDANCE, record.id), sanitize(record));
  },

  getCollaborators: async (): Promise<AppUser[]> => {
    try {
      const q = query(collection(db, COLLECTIONS.USERS), where('role', '==', 'collaborator'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc: any) => ({ ...doc.data() } as AppUser));
    } catch (err) { return []; }
  },

  saveCollaborator: async (partner: AppUser) => {
    await setDoc(doc(db, COLLECTIONS.USERS, partner.uid), sanitize(partner), { merge: true });
  },

  deleteCollaborator: async (uid: string) => {
    await deleteDoc(doc(db, COLLECTIONS.USERS, uid));
  },

  syncAllSessions: async () => {
    const schedules = await dbService.getSchedules();
    for (const schedule of schedules) {
      if (schedule.active) await dbService.generateSessionsForSchedule(schedule);
    }
  },

  generateSessionsForSchedule: async (schedule: ClassSchedule) => {
    if (!schedule.active) return;
    
    if (schedule.studentId) {
      const studentDoc = await getDoc(doc(db, COLLECTIONS.STUDENTS, schedule.studentId));
      if (studentDoc.exists()) {
        const studentData = studentDoc.data() as Student;
        if (studentData.status === 'break') return;
      }
    }

    const today = new Date();
    const projectionLimit = addWeeks(today, 3);
    const scheduleStartDate = new Date(schedule.startDate + 'T00:00:00');
    let current = isAfter(scheduleStartDate, today) ? scheduleStartDate : today;
    while (isBefore(current, projectionLimit)) {
      if (schedule.days.includes(current.getDay())) {
        const dateStr = format(current, 'yyyy-MM-dd');
        const start = `${dateStr}T${schedule.startTime}:00`;
        const end = `${dateStr}T${schedule.endTime}:00`;
        const deterministicId = `sess_${schedule.id}_${start.replace(/[:.-]/g, '')}`;
        await setDoc(doc(db, COLLECTIONS.SESSIONS, deterministicId), sanitize({
          id: deterministicId,
          studentId: schedule.studentId || null,
          studentName: schedule.studentName || null,
          groupId: schedule.groupId || null,
          groupName: schedule.groupName || null,
          collaboratorId: schedule.collaboratorId || null,
          scheduleId: schedule.id,
          start,
          end,
          status: 'upcoming',
          topic: 'Scheduled Session'
        }), { merge: true });
      }
      current = addDays(current, 1);
    }
  }
};
