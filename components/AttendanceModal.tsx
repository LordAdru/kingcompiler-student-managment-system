
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  XCircle, 
  Info, 
  AlertTriangle,
  CheckCircle2,
  Users,
  UserCheck,
  UserX,
  Plus
} from 'lucide-react';
import { ClassSession, Student, GroupBatch } from '../types';
import { dbService } from '../services/db';

interface AttendanceModalProps {
  session: ClassSession;
  onClose: () => void;
  onMarkAttendance: (studentId: string, present: boolean) => void;
  onFinalize: () => void;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({ session, onClose, onMarkAttendance, onFinalize }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [group, setGroup] = useState<GroupBatch | null>(null);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});
  const [processedMap, setProcessedMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      setIsLoading(true);
      const allStudents = await dbService.getStudents();
      if (session.groupId) {
        const allGroups = await dbService.getGroups();
        const foundGroup = allGroups.find(g => g.id === session.groupId);
        setGroup(foundGroup || null);
        if (foundGroup) {
          setStudents(allStudents.filter(s => foundGroup.studentIds.includes(s.id)));
        }
      } else if (session.studentId) {
        const foundStudent = allStudents.find(s => s.id === session.studentId);
        if (foundStudent) setStudents([foundStudent]);
      }
      setIsLoading(false);
    };
    loadDetails();
  }, [session]);

  const handleToggle = (studentId: string, present: boolean) => {
    onMarkAttendance(studentId, present);
    setAttendanceMap(prev => ({ ...prev, [studentId]: present }));
    setProcessedMap(prev => ({ ...prev, [studentId]: true }));
  };

  const isBatch = !!session.groupId;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        <div className={`p-10 ${session.status === 'completed' ? 'bg-slate-100 text-slate-800' : 'bg-slate-900 text-white'} relative shrink-0`}>
          <button onClick={onClose} className="absolute top-8 right-8 opacity-40 hover:opacity-100 transition-opacity">
            <XCircle size={32} />
          </button>
          
          <div className="flex items-center gap-5 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center font-black text-white shadow-lg shadow-amber-500/30">
              {isBatch ? <Users size={32}/> : <Plus size={32}/>}
            </div>
            <div>
              <h2 className="text-2xl font-black truncate max-w-[300px]">{isBatch ? session.groupName : session.studentName}</h2>
              <p className="opacity-60 text-sm font-bold tracking-wide uppercase">{isBatch ? 'Group Batch' : 'Private Session'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Time Slot</p>
              <p className="font-bold text-sm">
                {format(new Date(session.start), 'EEE, HH:mm')} - {format(new Date(session.end), 'HH:mm')}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Status</p>
              <p className="font-bold text-sm uppercase">{session.status}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-8">
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Info size={14} className="text-amber-500"/> Enrolled Students
            </h3>
            
            <div className="space-y-3">
              {isLoading ? (
                 <p className="text-center py-4 text-slate-400 animate-pulse">Fetching members...</p>
              ) : students.map((s) => {
                const hasProcessed = processedMap[s.id];
                const isPresent = attendanceMap[s.id];
                const remaining = s.billing.totalClassesAllowed - s.billing.classesAttended;
                const isDue = s.billing.feeStatus === 'due' || remaining <= 1;

                return (
                  <div key={s.id} className={`p-5 rounded-3xl border transition-all flex items-center justify-between ${
                    hasProcessed ? (isPresent ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200') : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center font-black text-slate-400">
                        {s.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 flex items-center gap-2">
                          {s.fullName}
                          {isDue && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Payment Warning"/>}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Sessions: {s.billing.classesAttended}/{s.billing.totalClassesAllowed}</p>
                      </div>
                    </div>

                    {session.status === 'upcoming' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleToggle(s.id, false)}
                          className={`p-3 rounded-xl transition-all ${!isPresent && hasProcessed ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-white text-slate-300 hover:text-red-500 hover:border-red-200 border border-slate-100'}`}
                        >
                          <UserX size={18} />
                        </button>
                        <button 
                          onClick={() => handleToggle(s.id, true)}
                          className={`p-3 rounded-xl transition-all ${isPresent && hasProcessed ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white text-slate-300 hover:text-emerald-500 hover:border-emerald-200 border border-slate-100'}`}
                        >
                          <UserCheck size={18} />
                        </button>
                      </div>
                    )}
                    {session.status === 'completed' && (
                       <span className="text-[10px] font-black uppercase text-slate-400">Attendance Archived</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {session.status === 'upcoming' && (
          <div className="p-8 bg-slate-50 border-t border-slate-100">
             <button 
               onClick={onFinalize}
               className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
             >
               <CheckCircle2 size={18} /> Finalize Session
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
