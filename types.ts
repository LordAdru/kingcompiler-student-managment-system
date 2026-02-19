
export type BillingType = 'monthly' | 'per_class';
export type FeeStatus = 'paid' | 'due' | 'blocked';
export type SessionStatus = 'upcoming' | 'completed' | 'cancelled';
export type UserRole = 'admin' | 'collaborator' | 'student';
export type StudentStatus = 'active' | 'break';

export interface AppUser {
  uid: string;
  email: string | null;
  role: UserRole;
  displayName?: string;
  studentId?: string; // Links user to a student record if role is 'student'
}

export interface CourseEnrollment {
  course: string;
  level: string;
  currentTopicIndex: number;
  assignedTopics: string[];
}

export interface Student {
  id: string;
  fullName: string;
  email?: string;
  age: number;
  whatsappNumber?: string;
  meetingLink?: string;
  joiningDate: string;
  collaboratorId?: string;
  status: StudentStatus;
  paymentRequested?: boolean;
  isDeleted?: boolean; // New: Soft delete support
  enrollments: CourseEnrollment[]; // New: Supports multiple courses
  billing: {
    type: BillingType;
    feeAmount: number;
    totalClassesAllowed: number;
    classesAttended: number;
    feeStatus: FeeStatus;
  };
  // Legacy fields for backward compatibility during transitions
  course: string;
  level: string;
  currentTopicIndex: number;
  assignedTopics: string[];
}

export type LibraryGenre = 'Chess' | 'Python' | 'Web Dev' | 'AI' | 'Game Dev';
export type LibraryLevel = 'Beginner' | 'Intermediate' | 'Advance';

export interface LibraryResource {
  id: string;
  title: string;
  genre: LibraryGenre;
  level: LibraryLevel;
  category: string; // Internal category tag
  url: string;
  coverImageUrl?: string;
  type: 'pdf' | 'link' | 'video';
  addedDate: string;
  storageSource: 'cloud' | 'local'; // New: Identifies if file is in browser DB
  localAssetId?: string; // New: Links to IndexedDB record
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
}

export interface Homework {
  id: string;
  studentId?: string;
  level?: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'reviewed';
  resourceLink?: string;
  attachmentUrl?: string;
}

export interface GroupBatch {
  id: string;
  name: string;
  course: string;
  level: string;
  studentIds: string[];
  active: boolean;
  isDeleted?: boolean; // New: Soft delete support
}

export interface ClassSchedule {
  id: string;
  studentId?: string;
  studentName?: string;
  groupId?: string;
  groupName?: string;
  collaboratorId?: string;
  course: string; // Specific course this schedule slot is for
  days: number[];
  startTime: string;
  endTime: string;
  startDate: string;
  active: boolean;
  isDeleted?: boolean; // New: Soft delete support
}

export interface ClassSession {
  id: string;
  studentId?: string;
  studentName?: string;
  groupId?: string;
  groupName?: string;
  collaboratorId?: string;
  course: string; // Specific course this session is for
  scheduleId: string;
  start: string;
  end: string;
  status: SessionStatus;
  topic?: string;
  isDeleted?: boolean; // New: Soft delete support
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  date: string;
  present: boolean;
  topicCompleted: string;
  course: string; // Track which course progress was affected
}

export interface LevelTopic {
  level: string;
  topics: string[];
}
