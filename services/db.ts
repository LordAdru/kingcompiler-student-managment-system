
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
  orderBy,
  writeBatch
// @ts-ignore
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { db, auth } from './firebase';
import { Student, ClassSchedule, ClassSession, AttendanceRecord, GroupBatch, AppUser, LibraryResource, Announcement, Homework } from '../types';
import { SYSTEM_RESOURCES as LOCAL_SYSTEM_RESOURCES } from './libraryData';
import { addDays, format, addWeeks, isAfter, isBefore, startOfDay } from 'date-fns';
import { COURSES } from '../constants';

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

// --- SYSTEM DEFAULT RESOURCES ---
const SYSTEM_RESOURCES: LibraryResource[] = LOCAL_SYSTEM_RESOURCES;

// --- INDEXED DB ENGINE FOR LOCAL LARGE FILES ---
const DB_NAME = 'KingAcademyLocalStore';
const DB_VERSION = 1;
const STORE_NAME = 'assets';

const openLocalDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const localAssetService = {
  saveFile: async (id: string, blob: Blob | string): Promise<void> => {
    const db = await openLocalDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(blob, id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  getFile: async (id: string): Promise<Blob | string | null> => {
    const db = await openLocalDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  deleteFile: async (id: string): Promise<void> => {
    const db = await openLocalDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
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
    let cloudResources: LibraryResource[] = [];
    
    if (useCache) {
      const cached = localStorage.getItem(CACHE_KEYS.LIBRARY);
      if (cached) cloudResources = JSON.parse(cached);
    }

    if (cloudResources.length === 0) {
      try {
        const snapshot = await getDocs(query(collection(db, COLLECTIONS.LIBRARY), orderBy('addedDate', 'desc')));
        cloudResources = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as LibraryResource));
        localStorage.setItem(CACHE_KEYS.LIBRARY, JSON.stringify(cloudResources));
      } catch (err) {
        console.warn("DB: Library fetch error", err);
        cloudResources = JSON.parse(localStorage.getItem(CACHE_KEYS.LIBRARY) || '[]');
      }
    }

    // Merge system-level resources (Starter Workbook) with dynamic cloud resources
    const allResources = [...SYSTEM_RESOURCES, ...cloudResources];
    
    // Deduplicate by ID
    const uniqueResources = Array.from(new Map(allResources.map(r => [r.id, r])).values());
    
    return uniqueResources.sort((a, b) => (b.addedDate || "").localeCompare(a.addedDate || ""));
  },

  saveLibraryResource: async (resource: LibraryResource) => {
    await setDoc(doc(db, COLLECTIONS.LIBRARY, resource.id), sanitize(resource), { merge: true });
    const current = await dbService.getLibrary(true);
    const updated = current.filter(r => r.id !== resource.id);
    updated.unshift(resource);
    localStorage.setItem(CACHE_KEYS.LIBRARY, JSON.stringify(updated));
  },

  deleteLibraryResource: async (id: string) => {
    const docSnap = await getDoc(doc(db, COLLECTIONS.LIBRARY, id));
    if (docSnap.exists()) {
      const data = docSnap.data() as LibraryResource;
      if (data.storageSource === 'local') {
        if (data.localAssetId) await localAssetService.deleteFile(data.localAssetId);
        if (data.coverImageUrl?.startsWith('local_')) await localAssetService.deleteFile(data.coverImageUrl);
      }
    }
    await deleteDoc(doc(db, COLLECTIONS.LIBRARY, id));
    const current = await dbService.getLibrary(true);
    localStorage.setItem(CACHE_KEYS.LIBRARY, JSON.stringify(current.filter(r => r.id !== id)));
  },

  getAnnouncements: async (): Promise<Announcement[]> => {
    try {
      const snapshot = await getDocs(query(collection(db, COLLECTIONS.ANNOUNCEMENTS), orderBy('date', 'desc')));
      return snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as Announcement));
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
      const allHomework = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        return { ...data, id: doc.id } as Homework;
      });

      if (!level && !studentId) {
        return allHomework;
      }

      return allHomework.filter(h => {
        const isPersonal = studentId && h.studentId === studentId;
        const isLevelWide = level && h.level === level && !h.studentId;
        const isGlobal = !h.studentId && !h.level;
        
        return isPersonal || isLevelWide || isGlobal;
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
    if (!id) throw new Error("A valid Document ID is required for deletion.");
    const docRef = doc(db, COLLECTIONS.HOMEWORK, id);
    await deleteDoc(docRef);
  },

  getStudents: async (useCache = true, includeDeleted = false): Promise<Student[]> => {
    if (useCache && !includeDeleted) {
      const cached = localStorage.getItem(CACHE_KEYS.STUDENTS);
      if (cached) {
        const parsed = JSON.parse(cached);
        return includeDeleted ? parsed : parsed.filter((s: Student) => !s.isDeleted);
      }
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
        if (!data.enrollments && data.course) {
          data.enrollments = [{
            course: data.course,
            level: data.level,
            currentTopicIndex: data.currentTopicIndex || 0,
            assignedTopics: data.assignedTopics || []
          }];
        }
        return { status: 'active', ...data, id: doc.id } as Student;
      }).sort((a: Student, b: Student) => (a.fullName || '').localeCompare(b.fullName || ''));
      
      localStorage.setItem(CACHE_KEYS.STUDENTS, JSON.stringify(students));
      return includeDeleted ? students : students.filter(s => !s.isDeleted);
    } catch (err: any) {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEYS.STUDENTS) || '[]');
      return includeDeleted ? cached : cached.filter((s: Student) => !s.isDeleted);
    }
  },

  getStudent: async (id: string): Promise<Student | null> => {
    try {
      const studentDoc = await getDoc(doc(db, COLLECTIONS.STUDENTS, id));
      if (studentDoc.exists()) {
        const data = studentDoc.data();
        if (!data.enrollments && data.course) {
          data.enrollments = [{
            course: data.course,
            level: data.level,
            currentTopicIndex: data.currentTopicIndex || 0,
            assignedTopics: data.assignedTopics || []
          }];
        }
        return { ...data, id: studentDoc.id } as Student;
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
    
    // Invalidate local cache
    localStorage.removeItem(CACHE_KEYS.STUDENTS);
  },

  softDeleteStudent: async (id: string) => {
    const studentRef = doc(db, COLLECTIONS.STUDENTS, id);
    await updateDoc(studentRef, { isDeleted: true });

    // Also soft delete sessions
    const sessionsSnap = await getDocs(query(collection(db, COLLECTIONS.SESSIONS), where('studentId', '==', id)));
    for (const d of sessionsSnap.docs) {
      await updateDoc(doc(db, COLLECTIONS.SESSIONS, d.id), { isDeleted: true });
    }

    localStorage.removeItem(CACHE_KEYS.STUDENTS);
    localStorage.removeItem(CACHE_KEYS.SESSIONS);
  },

  restoreStudent: async (id: string) => {
    const studentRef = doc(db, COLLECTIONS.STUDENTS, id);
    await updateDoc(studentRef, { isDeleted: false });

    // Restore sessions too
    const sessionsSnap = await getDocs(query(collection(db, COLLECTIONS.SESSIONS), where('studentId', '==', id)));
    for (const d of sessionsSnap.docs) {
      await updateDoc(doc(db, COLLECTIONS.SESSIONS, d.id), { isDeleted: false });
    }

    localStorage.removeItem(CACHE_KEYS.STUDENTS);
    localStorage.removeItem(CACHE_KEYS.SESSIONS);
  },

  permanentlyDeleteStudent: async (id: string) => {
    // 1. Wipe Sessions
    const sessionsSnap = await getDocs(query(collection(db, COLLECTIONS.SESSIONS), where('studentId', '==', id)));
    for (const d of sessionsSnap.docs) {
      await deleteDoc(doc(db, COLLECTIONS.SESSIONS, d.id));
    }

    // 2. Wipe Schedules
    const schedulesSnap = await getDocs(query(collection(db, COLLECTIONS.SCHEDULES), where('studentId', '==', id)));
    for (const d of schedulesSnap.docs) {
      await deleteDoc(doc(db, COLLECTIONS.SCHEDULES, d.id));
    }

    // 3. Wipe Attendance
    const attendanceSnap = await getDocs(query(collection(db, COLLECTIONS.ATTENDANCE), where('studentId', '==', id)));
    for (const d of attendanceSnap.docs) {
      await deleteDoc(doc(db, COLLECTIONS.ATTENDANCE, d.id));
    }

    // 4. Wipe User Account if exists
    const usersSnap = await getDocs(query(collection(db, COLLECTIONS.USERS), where('studentId', '==', id)));
    for (const d of usersSnap.docs) {
      await deleteDoc(doc(db, COLLECTIONS.USERS, d.id));
    }

    // 5. Delete Student Record Last
    await deleteDoc(doc(db, COLLECTIONS.STUDENTS, id));

    localStorage.removeItem(CACHE_KEYS.STUDENTS);
    localStorage.removeItem(CACHE_KEYS.SESSIONS);
  },

  getGroups: async (useCache = true, includeDeleted = false): Promise<GroupBatch[]> => {
    if (useCache && !includeDeleted) {
      const cached = localStorage.getItem(CACHE_KEYS.GROUPS);
      if (cached) {
        const parsed = JSON.parse(cached);
        return includeDeleted ? parsed : parsed.filter((g: GroupBatch) => !g.isDeleted);
      }
    }
    try {
      const { role } = await getCurrentUserRole();
      if (role !== 'admin') return [];
      const snapshot = await getDocs(query(collection(db, COLLECTIONS.GROUPS)));
      const groups = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as GroupBatch))
        .sort((a: GroupBatch, b: GroupBatch) => (a.name || '').localeCompare(b.name || ''));
      localStorage.setItem(CACHE_KEYS.GROUPS, JSON.stringify(groups));
      return includeDeleted ? groups : groups.filter(g => !g.isDeleted);
    } catch (err) { 
      const cached = JSON.parse(localStorage.getItem(CACHE_KEYS.GROUPS) || '[]');
      return includeDeleted ? cached : cached.filter((g: GroupBatch) => !g.isDeleted);
    }
  },

  saveGroup: async (group: GroupBatch) => {
    await setDoc(doc(db, COLLECTIONS.GROUPS, group.id), sanitize(group), { merge: true });
    localStorage.removeItem(CACHE_KEYS.GROUPS);
  },

  softDeleteGroup: async (id: string) => {
    await updateDoc(doc(db, COLLECTIONS.GROUPS, id), { isDeleted: true });
    
    // Also soft delete group sessions
    const sessionsSnap = await getDocs(query(collection(db, COLLECTIONS.SESSIONS), where('groupId', '==', id)));
    for (const d of sessionsSnap.docs) {
      await updateDoc(doc(db, COLLECTIONS.SESSIONS, d.id), { isDeleted: true });
    }
    localStorage.removeItem(CACHE_KEYS.GROUPS);
    localStorage.removeItem(CACHE_KEYS.SESSIONS);
  },

  getSchedule: async (id: string): Promise<ClassSchedule | null> => {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.SCHEDULES, id));
      if (docSnap.exists()) return { ...docSnap.data(), id: docSnap.id } as ClassSchedule;
      return null;
    } catch (err) { return null; }
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
      return snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as ClassSchedule))
        .filter(s => !s.isDeleted);
    } catch (err) { return []; }
  },

  saveSchedule: async (schedule: ClassSchedule) => {
    await setDoc(doc(db, COLLECTIONS.SCHEDULES, schedule.id), sanitize(schedule), { merge: true });
    await dbService.generateSessionsForSchedule(schedule);
  },

  deleteSchedule: async (id: string) => {
    // We soft delete schedules for record keeping but hide them immediately
    await updateDoc(doc(db, COLLECTIONS.SCHEDULES, id), { isDeleted: true });

    // Cascading Soft Delete for Sessions
    const sessionsSnap = await getDocs(query(collection(db, COLLECTIONS.SESSIONS), where('scheduleId', '==', id)));
    for (const d of sessionsSnap.docs) {
      await updateDoc(doc(db, COLLECTIONS.SESSIONS, d.id), { isDeleted: true });
    }
    localStorage.removeItem(CACHE_KEYS.SESSIONS);
  },

  permanentlyDeleteSchedule: async (id: string) => {
    // 1. Delete all sessions linked to this schedule that are not 'completed'
    const sessionsSnap = await getDocs(query(collection(db, COLLECTIONS.SESSIONS), where('scheduleId', '==', id)));
    for (const d of sessionsSnap.docs) {
      const data = d.data() as ClassSession;
      if (data.status !== 'completed') {
        await deleteDoc(doc(db, COLLECTIONS.SESSIONS, d.id));
      }
    }
    // 2. Delete the actual schedule record
    await deleteDoc(doc(db, COLLECTIONS.SCHEDULES, id));
    localStorage.removeItem(CACHE_KEYS.SESSIONS);
  },

  getSessions: async (useCache = true, includeDeleted = false): Promise<ClassSession[]> => {
    if (useCache && !includeDeleted) {
      const cached = localStorage.getItem(CACHE_KEYS.SESSIONS);
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.filter((s: ClassSession) => !s.isDeleted);
      }
    }
    try {
      const { role, uid } = await getCurrentUserRole();
      const coll = collection(db, COLLECTIONS.SESSIONS);
      let q = query(coll);
      if (role !== 'admin' && uid) q = query(coll, where('collaboratorId', '==', uid));
      const snapshot = await getDocs(q);
      const sessions = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as ClassSession))
        .sort((a: ClassSession, b: ClassSession) => (a.start || "").localeCompare(b.start || ""));
      localStorage.setItem(CACHE_KEYS.SESSIONS, JSON.stringify(sessions));
      return includeDeleted ? sessions : sessions.filter(s => !s.isDeleted);
    } catch (err) { 
      const cached = JSON.parse(localStorage.getItem(CACHE_KEYS.SESSIONS) || '[]');
      return includeDeleted ? cached : cached.filter((s: ClassSession) => !s.isDeleted);
    }
  },

  updateSession: async (updatedSession: ClassSession) => {
    await updateDoc(doc(db, COLLECTIONS.SESSIONS, updatedSession.id), sanitize(updatedSession));
    localStorage.removeItem(CACHE_KEYS.SESSIONS);
  },

  deleteSession: async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.SESSIONS, id));
    localStorage.removeItem(CACHE_KEYS.SESSIONS);
  },

  getAttendance: async (studentId?: string): Promise<AttendanceRecord[]> => {
    try {
      const coll = collection(db, COLLECTIONS.ATTENDANCE);
      let q = studentId ? query(coll, where('studentId', '==', studentId)) : query(coll, limit(100));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as AttendanceRecord));
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
      if (schedule.active && !schedule.isDeleted) await dbService.generateSessionsForSchedule(schedule);
    }
  },

  generateSessionsForSchedule: async (schedule: ClassSchedule) => {
    if (!schedule.active || schedule.isDeleted) return;
    
    // CRITICAL: Clean up future "upcoming" sessions for this schedule first to prevent double/wrong scheduling
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const existingSnap = await getDocs(query(
      collection(db, COLLECTIONS.SESSIONS), 
      where('scheduleId', '==', schedule.id),
      where('status', '==', 'upcoming')
    ));
    
    for (const d of existingSnap.docs) {
      const sess = d.data() as ClassSession;
      // Only wipe if it is today or in the future
      if (sess.start.startsWith(todayStr) || sess.start > todayStr) {
        await deleteDoc(doc(db, COLLECTIONS.SESSIONS, d.id));
      }
    }

    if (schedule.studentId) {
      const studentDoc = await getDoc(doc(db, COLLECTIONS.STUDENTS, schedule.studentId));
      if (studentDoc.exists()) {
        const studentData = studentDoc.data() as Student;
        if (studentData.status === 'break' || studentData.isDeleted) return;
      } else {
        return;
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
          course: schedule.course || null,
          scheduleId: schedule.id,
          start,
          end,
          status: 'upcoming',
          topic: 'Scheduled Session',
          isDeleted: false
        }), { merge: true });
      }
      current = addDays(current, 1);
    }
  }
};
