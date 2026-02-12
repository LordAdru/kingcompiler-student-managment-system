
import { Student, ClassSession, AttendanceRecord, Homework } from '../types';
import { dbService } from './db';

export interface AttendanceResult {
  studentId: string;
  present: boolean;
  homework?: { message: string, link: string };
}

export const academyLogic = {
  // Main entry point for playing the alarm
  playAcademyChime: () => {
    try {
      const customSound = localStorage.getItem('academy_custom_alarm');
      
      if (customSound) {
        const audio = new Audio(customSound);
        audio.play().catch(e => {
          console.warn("Academy Logic: Custom audio failed, falling back to synth.", e);
          academyLogic.playDefaultSynthChime();
        });
      } else {
        academyLogic.playDefaultSynthChime();
      }
    } catch (e) {
      console.warn("Academy Logic: Audio chime could not play.", e);
      academyLogic.playDefaultSynthChime();
    }
  },

  playDefaultSynthChime: () => {
    try {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); 
      oscillator.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1); 
      oscillator.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.3); 

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 1.5);
    } catch (e) {
      console.error("Academy Logic: Synth fallback failed.", e);
    }
  },

  setCustomAlarm: (source: string | null) => {
    if (source) {
      localStorage.setItem('academy_custom_alarm', source);
    } else {
      localStorage.removeItem('academy_custom_alarm');
    }
  },

  finalizeSessionWithAttendance: async (session: ClassSession, results: AttendanceResult[]) => {
    const students = await dbService.getStudents();

    for (const res of results) {
      const student = students.find(s => s.id === res.studentId);
      if (!student) continue;

      // 1. Save Attendance Record
      const attendance: AttendanceRecord = {
        id: `att_${session.id}_${student.id}`, // Deterministic ID to prevent duplicates
        sessionId: session.id,
        studentId: student.id,
        date: new Date().toISOString(),
        present: res.present,
        topicCompleted: session.topic || 'Review'
      };
      await dbService.saveAttendance(attendance);

      // 2. Process Billing & Topic Progress for Present Students
      if (res.present) {
        student.billing.classesAttended += 1;

        if (student.currentTopicIndex < student.assignedTopics.length) {
          student.currentTopicIndex += 1;
        }

        const remaining = student.billing.totalClassesAllowed - student.billing.classesAttended;
        if (remaining <= 0) {
          student.billing.feeStatus = 'due';
        }
        
        await dbService.saveStudent(student);

        // 3. Create/Update Homework with a deterministic ID
        if (res.homework && (res.homework.message || res.homework.link)) {
          const hwId = `hw_${session.id}_${student.id}`;
          const newHomework: Homework = {
            id: hwId,
            studentId: student.id,
            title: `Class Task: ${session.topic || 'Review'}`,
            description: res.homework.message || 'Complete the assigned task from today\'s session.',
            dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
            status: 'pending',
            level: student.level,
            resourceLink: res.homework.link || undefined
          };
          await dbService.saveHomework(newHomework);
        }
      }
    }

    // 4. Close the session
    await academyLogic.finalizeSession(session);
  },

  finalizeSession: async (session: ClassSession) => {
    const updatedSession: ClassSession = {
      ...session,
      status: 'completed'
    };
    await dbService.updateSession(updatedSession);
  }
};
