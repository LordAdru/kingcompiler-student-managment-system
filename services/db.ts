
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
  limit
// @ts-ignore
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { db, auth } from './firebase';
import { Student, ClassSchedule, ClassSession, AttendanceRecord, GroupBatch, AppUser } from '../types';
import { addDays, format, addWeeks, isAfter, isBefore } from 'date-fns';

const COLLECTIONS = {
  STUDENTS: 'students',
  GROUPS: 'groups',
  SCHEDULES: 'classSchedules',
  SESSIONS: 'classSessions',
  ATTENDANCE: 'attendance',
  USERS: 'users'
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

/**
 * Super-resilient role detection.
 */
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
  // --- STUDENTS ---
  getStudents: async (): Promise<Student[]> => {
    try {
      const { role, uid } = await getCurrentUserRole();
      const coll = collection(db, COLLECTIONS.STUDENTS);
      
      let q;
      if (role === 'admin') {
        q = query(coll);
      } else {
        q = query(coll, where('collaboratorId', '==', uid));
      }
      
      const snapshot = await getDocs(q);
      const students = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Student));
      
      return students.sort((a: Student, b: Student) => (a.fullName || '').localeCompare(b.fullName || ''));
    } catch (err: any) {
      if (err.code === 'permission-denied') {
        console.error("FIREBASE ERROR: Permission Denied. Check Rules.");
      }
      return [];
    }
  },
  
  saveStudent: async (student: Student) => {
    const studentRef = doc(db, COLLECTIONS.STUDENTS, student.id);
    await setDoc(studentRef, sanitize(student), { merge: true });
  },

  deleteStudent: async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.STUDENTS, id));
  },

  // --- GROUPS ---
  getGroups: async (): Promise<GroupBatch[]> => {
    try {
      const { role } = await getCurrentUserRole();
      if (role !== 'admin') return [];
      const snapshot = await getDocs(query(collection(db, COLLECTIONS.GROUPS)));
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as GroupBatch))
        .sort((a: GroupBatch, b: GroupBatch) => (a.name || '').localeCompare(b.name || ''));
    } catch (err) { return []; }
  },

  saveGroup: async (group: GroupBatch) => {
    await setDoc(doc(db, COLLECTIONS.GROUPS, group.id), sanitize(group), { merge: true });
  },

  deleteGroup: async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.GROUPS, id));
  },

  // --- SCHEDULES ---
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

  // --- SESSIONS ---
  getSessions: async (): Promise<ClassSession[]> => {
    try {
      const { role, uid } = await getCurrentUserRole();
      const coll = collection(db, COLLECTIONS.SESSIONS);
      let q = query(coll);
      if (role !== 'admin' && uid) q = query(coll, where('collaboratorId', '==', uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as ClassSession))
        .sort((a: ClassSession, b: ClassSession) => (a.start || "").localeCompare(b.start || ""));
    } catch (err) { return []; }
  },

  updateSession: async (updatedSession: ClassSession) => {
    await updateDoc(doc(db, COLLECTIONS.SESSIONS, updatedSession.id), sanitize(updatedSession));
  },

  // --- ATTENDANCE ---
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

  // --- PARTNERS / COLLABORATORS ---
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
