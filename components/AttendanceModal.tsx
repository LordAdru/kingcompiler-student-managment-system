
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
  Plus,
  Link as LinkIcon,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw
} from 'lucide-react';
import { ClassSession, Student, GroupBatch } from '../types';
import { dbService } from '../services/db';
import { AttendanceResult } from '../services/logic';

interface AttendanceModalProps {
  session: ClassSession;
  onClose: () => void;
  onFinalize: (results: AttendanceResult[]) => void;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({ session, onClose, onFinalize }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [group, setGroup] = useState<GroupBatch | null>(null);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});
  const [processedMap, setProcessedMap] = useState<Record<string, boolean>>({});
  const [homeworkData, setHomeworkData] = useState<Record<string, { message: string, link: string }>>({});
  const [expandedHw, setExpandedHw] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);

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
    setAttendanceMap(prev => ({ ...prev, [studentId]: present }));
    setProcessedMap(prev => ({ ...prev, [studentId]: true }));
    if (present) {
      setExpandedHw(prev => ({ ...prev, [studentId]: true }));
    }
  };

  const updateHomework = (studentId: string, field: 'message' | 'link', value: string) => {
    setHomeworkData(prev => ({ 
      ...prev, 
      [studentId]: {
        ...(prev[studentId] || { message: '', link: '' }),
        [field]: value
      }
    }));
  };

  const handleCommitFinalize = async () => {
    const totalStudents = students.length;
    const processedCount = Object.keys(processedMap).length;
    
    if (processedCount < totalStudents) {
      if (!confirm(`You haven't marked attendance for ${totalStudents - processedCount} student(s). Proceed anyway?`)) {
        return;
      }
    }

    setIsFinishing(true);
    const results: AttendanceResult[] = Object.keys(processedMap).map(sid => ({
      studentId: sid,
      present: attendanceMap[sid],
      homework: homeworkData[sid]
    }));

    await onFinalize(results);
    setIsFinishing(false);
  };

  const isBatch = !!session.groupId;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-[#0f172a] rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[95vh] border border-white/10">
        
        <div className="p-8 sm:p-10 relative shrink-0">
          <button onClick={onClose} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors p-2 bg-white/5 rounded-full">
            <X size={24} />
          </button>
          
          <div className="flex items-center gap-5 mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-white shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <Plus size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white truncate max-w-[300px] tracking-tight">
                {isBatch ? session.groupName : session.studentName}
              </h2>
              <p className="text-slate-400 text-xs font-bold tracking-[0.2em] uppercase">
                {isBatch ? 'BATCH SESSION' : 'PRIVATE SESSION'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/5 rounded-[1.5rem] p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Time Slot</p>
              <p className="text-white font-black text-sm">
                {format(new Date(session.start), 'EEE, HH:mm')} - {format(new Date(session.end), 'HH:mm')}
              </p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-[1.5rem] p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Status</p>
              <p className="text-amber-500 font-black text-sm uppercase tracking-widest">{session.status}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 sm:p-10 pt-0 space-y-8 bg-white rounded-t-[3rem]">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pt-6">
              <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                ENROLLED STUDENTS
              </h3>
            </div>
            
            <div className="space-y-4">
              {isLoading ? (
                 <div className="flex flex-col items-center justify-center py-10 gap-3">
                   <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accessing records...</p>
                 </div>
              ) : students.map((s) => {
                const hasProcessed = processedMap[s.id];
                const isPresent = attendanceMap[s.id];
                const isExpanded = expandedHw[s.id];
                const remaining = s.billing.totalClassesAllowed - s.billing.classesAttended;
                const isDue = s.billing.feeStatus === 'due' || remaining <= 1;

                return (
                  <div key={s.id} className={`rounded-[2rem] border transition-all overflow-hidden ${
                    hasProcessed ? (isPresent ? 'bg-emerald-50/30 border-emerald-100' : 'bg-red-50/30 border-red-100') : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-300 shadow-sm">
                          {s.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 flex items-center gap-2">
                            {s.fullName}
                            {isDue && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Payment Warning"/>}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">SESSIONS: {s.billing.classesAttended}/{s.billing.totalClassesAllowed}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleToggle(s.id, false)}
                          className={`p-3 rounded-xl transition-all ${!isPresent && hasProcessed ? 'bg-red-500 text-white shadow-lg' : 'bg-white text-slate-300 border border-slate-200 hover:text-red-500'}`}
                        >
                          <UserX size={20} />
                        </button>
                        <button 
                          onClick={() => handleToggle(s.id, true)}
                          className={`p-3 rounded-xl transition-all ${isPresent && hasProcessed ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white text-slate-300 border border-slate-200 hover:text-emerald-500'}`}
                        >
                          <UserCheck size={20} />
                        </button>
                      </div>
                    </div>

                    {isPresent && (
                      <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-300">
                        <button 
                          onClick={() => setExpandedHw(prev => ({ ...prev, [s.id]: !isExpanded }))}
                          className="w-full flex items-center justify-between py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest border-t border-slate-200/50 mt-2"
                        >
                          <span className="flex items-center gap-2"><Plus size={12}/> Assign Homework</span>
                          {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                        </button>
                        
                        {isExpanded && (
                          <div className="space-y-4 pt-4">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Resource Link / PDF / Img</label>
                              <div className="relative">
                                <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                  type="text" 
                                  placeholder="Paste link to book/image..."
                                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                                  value={homeworkData[s.id]?.link || ''}
                                  onChange={e => updateHomework(s.id, 'link', e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Assignment Message</label>
                              <div className="relative">
                                <MessageSquare size={14} className="absolute left-3 top-3 text-slate-400" />
                                <textarea 
                                  rows={2}
                                  placeholder="What should the student do?"
                                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                                  value={homeworkData[s.id]?.message || ''}
                                  onChange={e => updateHomework(s.id, 'message', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {session.status === 'upcoming' && (
          <div className="p-8 bg-white border-t border-slate-100 shrink-0">
             <button 
               onClick={handleCommitFinalize}
               disabled={isFinishing}
               className="w-full py-6 bg-[#0f172a] hover:bg-slate-800 text-white rounded-[1.8rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-slate-950/40 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
             >
               {isFinishing ? <RefreshCw className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}
               {isFinishing ? 'PROCESSING...' : 'FINALIZE SESSION'}
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
