
export type BillingType = 'monthly' | 'per_class';
export type FeeStatus = 'paid' | 'due' | 'blocked';
export type SessionStatus = 'upcoming' | 'completed' | 'cancelled';
export type UserRole = 'admin' | 'collaborator';
export type StudentStatus = 'active' | 'break';

export interface AppUser {
  uid: string;
  email: string | null;
  role: UserRole;
  displayName?: string;
}

export interface Student {
  id: string;
  fullName: string;
  age: number;
  whatsappNumber?: string;
  course: string;
  level: string;
  joiningDate: string;
  collaboratorId?: string; // ID of the partner who referred the student
  status: StudentStatus; // Added status field
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
  collaboratorId?: string; // Filter for collaborator users
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
