
import { Student, ClassSession, AttendanceRecord } from '../types';
import { dbService } from './db';

export const academyLogic = {
  // Shared audio engine for alarms and notifications
  playAcademyChime: () => {
    try {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Professional 3-tone rising sequence (C5 -> E5 -> G5)
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      oscillator.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      oscillator.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.3); // G5

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 1.5);
    } catch (e) {
      console.warn("Academy Logic: Audio chime could not play.", e);
    }
  },

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
