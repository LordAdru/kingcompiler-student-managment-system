
import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { dbService } from '../services/db';
import { academyLogic } from '../services/logic';
import { ClassSession, Student } from '../types';
import { Calendar as CalendarIcon, Layers } from 'lucide-react';
import { AttendanceModal } from './AttendanceModal';

export const CalendarView: React.FC = () => {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const calendarRef = useRef<any>(null);

  const fetchData = async () => {
    setIsLoading(true);
    const [sData, stData] = await Promise.all([
      dbService.getSessions(),
      dbService.getStudents()
    ]);
    setSessions(sData);
    setStudents(stData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const events = sessions.map(session => {
    let color = '#0f172a'; // Slate-900 default for groups
    
    if (session.status === 'completed') {
      color = '#10b981'; // Green
    } else if (session.studentId) {
      color = '#3b82f6'; // Blue for individuals
      const student = students.find(s => s.id === session.studentId);
      if (student) {
        const remaining = student.billing.totalClassesAllowed - student.billing.classesAttended;
        if (remaining <= 0 || student.billing.feeStatus === 'due') {
          color = '#ef4444'; // Red
        } else if (remaining === 1) {
          color = '#f59e0b'; // Amber
        }
      }
    }

    return {
      id: session.id,
      title: session.groupId ? `BATCH: ${session.groupName}` : session.studentName,
      start: session.start,
      end: session.end,
      backgroundColor: color,
      extendedProps: { session }
    };
  });

  const handleAttendance = async (studentId: string, present: boolean, homework?: { message: string, link: string }) => {
    if (!selectedSession) return;
    const result = await academyLogic.processAttendance(selectedSession, studentId, present, homework);
    if (result?.warning) {
      console.log(result.warning);
    }
  };

  const handleFinalize = async () => {
    if (!selectedSession) return;
    await academyLogic.finalizeSession(selectedSession);
    await fetchData();
    setSelectedSession(null);
  };

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 rounded-2xl text-white">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Academy Calendar</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Master Weekly Schedule</p>
          </div>
        </div>
        <div className="flex gap-6 text-[9px] font-black uppercase tracking-widest text-slate-400">
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-900 rounded-full"></div> Batch</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> Individual</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div> Completed</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full"></div> Alert</div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden p-6">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Building Schedule View...</p>
          </div>
        ) : (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'timeGridWeek,timeGridDay'
            }}
            events={events}
            eventClick={(info) => {
              setSelectedSession(info.event.extendedProps.session);
            }}
            allDaySlot={false}
            slotMinTime="08:00:00"
            slotMaxTime="22:00:00"
            height="100%"
            expandRows={true}
            nowIndicator={true}
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
          />
        )}
      </div>

      {selectedSession && (
        <AttendanceModal 
          session={selectedSession} 
          onClose={() => setSelectedSession(null)}
          onMarkAttendance={handleAttendance}
          onFinalize={handleFinalize}
        />
      )}
    </div>
  );
};
