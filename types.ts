
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

export interface Student {
  id: string;
  fullName: string;
  email?: string; // Added for student login matching
  age: number;
  whatsappNumber?: string;
  meetingLink?: string; // New: Google Meet / Zoom link
  course: string;
  level: string;
  joiningDate: string;
  collaboratorId?: string;
  status: StudentStatus;
  paymentRequested?: boolean; // New: Flag for when student says they paid
  billing: {
    type: BillingType;
    feeAmount: number;
    totalClassesAllowed: number;
    classesAttended: number;
    feeStatus: FeeStatus;
  };
  currentTopicIndex: number;
  assignedTopics: string[];
}

export interface LibraryResource {
  id: string;
  title: string;
  category: string;
  url: string;
  coverImageUrl?: string; // New: Support for cover images
  type: 'pdf' | 'link' | 'video';
  addedDate: string;
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
  studentId?: string; // If specific to a student
  level?: string; // If specific to a level
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'reviewed';
}

export interface GroupBatch {
  id: string;
  name: string;
  course: string;
  level: string;
  studentIds: string[];
  active: boolean;
}

export interface ClassSchedule {
  id: string;
  studentId?: string;
  studentName?: string;
  groupId?: string;
  groupName?: string;
  collaboratorId?: string;
  days: number[];
  startTime: string;
  endTime: string;
  startDate: string;
  active: boolean;
}

export interface ClassSession {
  id: string;
  studentId?: string;
  studentName?: string;
  groupId?: string;
  groupName?: string;
  collaboratorId?: string;
  scheduleId: string;
  start: string;
  end: string;
  status: SessionStatus;
  topic?: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  date: string;
  present: boolean;
  topicCompleted: string;
}

export interface LevelTopic {
  level: string;
  topics: string[];
}
