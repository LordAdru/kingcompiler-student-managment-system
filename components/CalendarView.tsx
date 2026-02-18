
import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { dbService } from '../services/db';
import { academyLogic, AttendanceResult } from '../services/logic';
import { ClassSession, Student } from '../types';
import { Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { AttendanceModal } from './AttendanceModal';
import { format } from 'date-fns';

export const CalendarView: React.FC = () => {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
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
    let title = session.groupId ? `BATCH: ${session.groupName}` : session.studentName;
    
    if (session.status === 'completed') {
      color = '#10b981'; // Green
    } else if (session.studentId) {
      color = '#3b82f6'; // Blue for individuals
      title = `${session.studentName} [${session.studentId}]`;
      
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
      title: title,
      start: session.start,
      end: session.end,
      backgroundColor: color,
      editable: session.status === 'upcoming', // Only allow moving upcoming sessions
      extendedProps: { session }
    };
  });

  const handleFinalize = async (results: AttendanceResult[]) => {
    if (!selectedSession) return;
    await academyLogic.finalizeSessionWithAttendance(selectedSession, results);
    await fetchData();
    setSelectedSession(null);
  };

  const handleEventChange = async (changeInfo: any) => {
    const { event } = changeInfo;
    const session = event.extendedProps.session as ClassSession;
    
    setIsUpdating(true);
    try {
      const updatedSession: ClassSession = {
        ...session,
        start: format(event.start, "yyyy-MM-dd'T'HH:mm:ss"),
        end: format(event.end, "yyyy-MM-dd'T'HH:mm:ss")
      };
      
      await dbService.updateSession(updatedSession);
      setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
    } catch (err) {
      console.error("Reschedule failed:", err);
      alert("Failed to sync reschedule to cloud. Reverting...");
      changeInfo.revert();
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500 relative">
      {isUpdating && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <RefreshCw size={16} className="animate-spin text-amber-500" />
          <span className="text-[10px] font-black uppercase tracking-widest">Rescheduling Master...</span>
        </div>
      )}

      <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 rounded-2xl text-white">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Academy Calendar</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Interactive Schedule Management</p>
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
            editable={true}
            eventDrop={handleEventChange}
            eventResize={handleEventChange}
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
          onFinalize={handleFinalize}
        />
      )}
    </div>
  );
};
