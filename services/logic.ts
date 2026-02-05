
import { Student, ClassSession, AttendanceRecord } from '../types';
import { dbService } from './db';

export const academyLogic = {
  processAttendance: async (session: ClassSession, targetStudentId: string, present: boolean) => {
    const students = await dbService.getStudents();
    const student = students.find(s => s.id === targetStudentId);
    
    if (!student) return;

    // 1. Create actual Attendance Record
    const attendance: AttendanceRecord = {
      id: Math.random().toString(36).substr(2, 9),
      sessionId: session.id,
      studentId: student.id,
      date: new Date().toISOString(),
      present,
      topicCompleted: session.topic || 'Review'
    };
    await dbService.saveAttendance(attendance);

    if (present) {
      // 2. Increment attendance count
      student.billing.classesAttended += 1;

      // 3. Move the pointer forward
      if (student.currentTopicIndex < student.assignedTopics.length) {
        student.currentTopicIndex += 1;
      }

      // 4. Fee Warning Logic
      const remaining = student.billing.totalClassesAllowed - student.billing.classesAttended;
      if (remaining <= 0) {
        student.billing.feeStatus = 'due';
      }
      
      await dbService.saveStudent(student);
      
      return {
        completedTopic: session.topic,
        warning: remaining === 1 ? `⚠️ Last class for ${student.fullName}!` : 
                 remaining <= 0 ? `🔴 Payment required for ${student.fullName}!` : null
      };
    }
    
    return { warning: null };
  },

  finalizeSession: async (session: ClassSession) => {
    const updatedSession: ClassSession = {
      ...session,
      status: 'completed'
    };
    await dbService.updateSession(updatedSession);
  }
};
