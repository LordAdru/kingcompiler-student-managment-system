
import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../services/db';
import { authService } from '../services/auth';
import { Student, ClassSchedule, AttendanceRecord, StudentStatus, CourseEnrollment } from '../types';
import { ScheduleModal } from './ScheduleModal';
import { format } from 'date-fns';
import { LEVEL_TOPICS } from '../constants';
import { 
  ArrowLeft, 
  Calendar, 
  CreditCard, 
  BookOpen, 
  User, 
  Activity,
  Plus,
  Trash2,
  Clock,
  Edit3,
  CheckCircle2,
  XCircle,
  TrendingUp,
  RefreshCw,
  Award,
  Phone,
  Moon,
  Zap,
  Coffee,
  Key,
  ShieldCheck,
  HandCoins,
  Handshake,
  Mail,
  Send,
  Video,
  ExternalLink,
  ChevronRight,
  GraduationCap,
  Edit2
} from 'lucide-react';

interface ProfileProps {
  studentId: string;
  onBack: () => void;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const StudentProfile: React.FC<ProfileProps> = ({ studentId, onBack }) => {
  const [student, setStudent] = useState<Student | undefined>(undefined);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ClassSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [activeCourseTab, setActiveCourseTab] = useState(0);
  const [isEditingAttendance, setIsEditingAttendance] = useState(false);
  const [manualAttendance, setManualAttendance] = useState(0);
  const [isResettingCycle, setIsResettingCycle] = useState(false);

  const fetchProfileData = async () => {
    setIsLoading(true);
    const found = await dbService.getStudent(studentId);
    setStudent(found || undefined);
    
    if (found) {
      const [foundSchedules, history] = await Promise.all([
        dbService.getSchedules(studentId),
        dbService.getAttendance(studentId)
      ]);
      setSchedules(foundSchedules);
      setAttendance(history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setManualAttendance(found.billing.classesAttended);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProfileData();
  }, [studentId]);

  const handleResetPassword = async () => {
    if (!student?.email) return;
    if (!confirm(`Send password reset link to ${student.email}?`)) return;
    
    setIsResetting(true);
    try {
      await authService.sendResetEmail(student.email);
      alert(`Instructions have been sent to ${student.email}.`);
    } catch (err: any) {
      alert("Failed to send reset email: " + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  const toggleBreakStatus = async () => {
    if (!student) return;
    setIsUpdatingStatus(true);
    const updatedStatus: StudentStatus = student.status === 'break' ? 'active' : 'break';
    const updatedStudent: Student = { ...student, status: updatedStatus };
    
    await dbService.saveStudent(updatedStudent);
    setStudent(updatedStudent);
    setIsUpdatingStatus(false);
  };

  const handleStartNewCycle = async () => {
    if (!student) return;
    if (!confirm("Confirm payment received? This will reset classes attended to 0 and mark status as PAID.")) return;

    setIsResettingCycle(true);
    const updatedStudent: Student = {
      ...student,
      paymentRequested: false,
      billing: {
        ...student.billing,
        classesAttended: 0,
        feeStatus: 'paid'
      }
    };
    
    await dbService.saveStudent(updatedStudent);
    setStudent(updatedStudent);
    setManualAttendance(0);
    setIsResettingCycle(false);
  };

  const handleSaveSchedule = async (newSchedule: ClassSchedule) => {
    await dbService.saveSchedule(newSchedule);
    await fetchProfileData();
    setIsScheduleModalOpen(false);
    setEditingSchedule(null);
  };

  const removeSchedule = async (id: string) => {
    if (!confirm('Permanently delete this schedule slot?')) return;
    await dbService.deleteSchedule(id);
    await fetchProfileData();
  };

  const saveManualAttendance = async () => {
    if (!student) return;
    const updatedStudent: Student = {
      ...student,
      billing: {
        ...student.billing,
        classesAttended: manualAttendance
      }
    };
    await dbService.saveStudent(updatedStudent);
    setStudent(updatedStudent);
    setIsEditingAttendance(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-20">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Retrieving Records...</p>
      </div>
    );
  }

  if (!student) return <div className="p-12 text-center text-slate-500">Record not found.</div>;

  const currentEnrollment = student.enrollments?.[activeCourseTab] || student.enrollments?.[0];
  const progress = (student.billing.classesAttended / student.billing.totalClassesAllowed) * 100;

  return (
    <div className="space-y-8 animate-in slide-in-from-right-8 duration-500 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl transition-all shadow-sm group">
          <ArrowLeft size={20} className="text-slate-400 group-hover:text-slate-900" />
        </button>
        <div className="flex items-center justify-between flex-1">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{student.fullName}</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Multi-Track Portfolio Tracking</p>
          </div>
          {student.status === 'break' && (
            <div className="bg-amber-100 text-amber-700 px-5 py-2 rounded-2xl border border-amber-200 flex items-center gap-2">
              <Moon size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">On Break</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <div className="flex flex-col items-center text-center mb-8">
              <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-4xl font-black text-white shadow-xl mb-4 ${
                student.status === 'break' ? 'bg-slate-400 grayscale' : 'bg-gradient-to-br from-amber-400 to-amber-600'
              }`}>
                {student.fullName.charAt(0)}
              </div>
              <h2 className="text-xl font-black text-slate-800">{student.fullName}</h2>
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                 {student.enrollments?.map((e, idx) => (
                   <span key={idx} className="text-[8px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                     {e.course}
                   </span>
                 ))}
              </div>
            </div>

            <div className="space-y-4">
              <InfoRow icon={Phone} label="WhatsApp" value={student.whatsappNumber || 'Not provided'} />
              {student.meetingLink && (
                 <InfoRow icon={Video} label="Virtual Classroom" value="Launch Live Session" onAction={() => window.open(student.meetingLink, '_blank')} isLink />
              )}
              <InfoRow icon={Calendar} label="Member Since" value={student.joiningDate} />
            </div>

            <div className="mt-8 pt-8 border-t border-slate-50 space-y-3">
              {student.email && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 flex items-center gap-4">
                    <div className="p-2 bg-amber-500 rounded-lg text-slate-900"><ShieldCheck size={16} /></div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Portal Active</p>
                      <p className="text-xs font-bold truncate">{student.email}</p>
                    </div>
                  </div>
                  <button onClick={handleResetPassword} disabled={isResetting} className="w-full py-4 bg-amber-500 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                    {isResetting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />} Reset Password
                  </button>
                </div>
              )}
              <button onClick={toggleBreakStatus} disabled={isUpdatingStatus} className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-3 border ${student.status === 'break' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'}`}>
                {student.status === 'break' ? <><Zap size={16} /> Reactivate</> : <><Coffee size={16} /> Put on Break</>}
              </button>
            </div>
          </div>

          <div className={`rounded-[2.5rem] p-8 border-2 shadow-lg transition-colors ${student.billing.feeStatus === 'due' ? 'bg-red-50 border-red-100' : 'bg-slate-900 text-white border-slate-800'}`}>
            <div className="flex items-center justify-between mb-8">
              <h3 className={`font-black text-xs uppercase tracking-widest opacity-60`}>Billing & Bank</h3>
              <CreditCard className="text-amber-500" />
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className={`text-4xl font-black ${student.billing.feeStatus === 'due' ? 'text-slate-900' : 'text-white'}`}>${student.billing.feeAmount}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-60">PER CYCLE REVENUE</p>
                </div>
                <button 
                  onClick={handleStartNewCycle}
                  disabled={isResettingCycle}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center gap-2 ${
                    student.billing.feeStatus === 'due' 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {isResettingCycle ? <RefreshCw size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                  {student.billing.feeStatus === 'due' ? 'MARK AS PAID' : 'PAID'}
                </button>
              </div>
              
              {student.billing.feeStatus === 'due' && (
                <button 
                  onClick={handleStartNewCycle}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.1em] shadow-xl shadow-red-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <RefreshCw size={14} /> Start New Cycle
                </button>
              )}

              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                  <span>Consumption</span>
                  <div className="flex items-center gap-2">
                    {isEditingAttendance ? (
                      <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                        <input 
                          type="number" 
                          className="w-12 bg-white/20 border-none rounded px-1 py-0.5 text-center font-black outline-none" 
                          value={manualAttendance} 
                          onChange={e => setManualAttendance(Number(e.target.value))} 
                        />
                        <button onClick={saveManualAttendance} className="text-emerald-400 hover:text-emerald-300"><CheckCircle2 size={14} /></button>
                        <button onClick={() => setIsEditingAttendance(false)} className="text-slate-400 hover:text-white"><XCircle size={14} /></button>
                      </div>
                    ) : (
                      <button onClick={() => setIsEditingAttendance(true)} className="flex items-center gap-1 hover:text-amber-500 transition-colors">
                        {student.billing.classesAttended} / {student.billing.totalClassesAllowed} Done <Edit2 size={10} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="h-2.5 w-full rounded-full overflow-hidden bg-white/10 p-0.5">
                  <div className={`h-full rounded-full transition-all duration-1000 ${student.billing.feeStatus === 'due' ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, progress)}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Execution Log</h3>
            <div className="space-y-6">
              {attendance.slice(0, 8).map((log) => (
                <div key={log.id} className="flex gap-4">
                  <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${log.present ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {log.present ? <CheckCircle2 size={16}/> : <XCircle size={16}/>}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{log.topicCompleted}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">
                      {format(new Date(log.date), 'MMM dd')} • {log.course}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-800">Master Schedules</h3>
              <button onClick={() => { setEditingSchedule(null); setIsScheduleModalOpen(true); }} className="flex items-center gap-2 text-[10px] font-black uppercase bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-lg hover:bg-slate-800">
                <Plus size={16} /> New Slot
              </button>
            </div>

            <div className="space-y-4">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 group">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white text-amber-600 shadow-sm"><Clock size={28} /></div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">{schedule.course || 'Master Track'}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <div className="flex gap-1">
                          {DAY_LABELS.map((day, i) => (
                            <span key={i} className={`text-[7px] font-black w-4 h-4 flex items-center justify-center rounded-md border ${schedule.days.includes(i) ? 'bg-slate-900 text-white' : 'bg-white text-slate-300'}`}>{day}</span>
                          ))}
                        </div>
                      </div>
                      <p className="font-black text-slate-800 text-lg leading-none">{schedule.startTime} — {schedule.endTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => { setEditingSchedule(schedule); setIsScheduleModalOpen(true); }} className="p-3 text-slate-400 hover:text-blue-600"><Edit3 size={20} /></button>
                    <button onClick={() => removeSchedule(schedule.id)} className="p-3 text-slate-400 hover:text-red-500"><Trash2 size={20} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 overflow-hidden">
            <div className="mb-8">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Curriculum Sync</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Multi-Track Progress Hub</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {student.enrollments?.map((e, idx) => (
                <button key={idx} onClick={() => setActiveCourseTab(idx)} className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeCourseTab === idx ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                   {e.course}
                </button>
              ))}
            </div>

            <div className="p-6 bg-slate-900 rounded-[2rem] text-white mb-8 flex items-center justify-between">
               <div className="flex items-center gap-5">
                 <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-900"><GraduationCap size={24} /></div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{currentEnrollment?.level} Syllabus</p>
                    <h4 className="text-lg font-black">{currentEnrollment?.assignedTopics[currentEnrollment.currentTopicIndex] || 'Final Mastery'}</h4>
                 </div>
               </div>
               <div className="text-right">
                  <p className="text-2xl font-black">{currentEnrollment ? Math.round((currentEnrollment.currentTopicIndex / (currentEnrollment.assignedTopics.length || 1)) * 100) : 0}%</p>
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Completed</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentEnrollment?.assignedTopics.map((topic, index) => {
                const isCompleted = index < currentEnrollment.currentTopicIndex;
                const isCurrent = index === currentEnrollment.currentTopicIndex;
                return (
                  <div key={index} className={`p-5 rounded-3xl border flex items-center gap-5 transition-all ${isCompleted ? 'bg-emerald-50/30 border-emerald-100 opacity-60' : isCurrent ? 'bg-amber-50 border-amber-300 ring-4 ring-amber-500/5' : 'bg-white border-slate-100'}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] ${isCompleted ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {isCompleted ? <CheckCircle2 size={14} /> : index + 1}
                    </div>
                    <p className={`text-xs font-bold truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}`}>{topic}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {isScheduleModalOpen && (
        <ScheduleModal 
          student={student}
          schedule={editingSchedule}
          onClose={() => { setIsScheduleModalOpen(false); setEditingSchedule(null); }}
          onSave={handleSaveSchedule}
        />
      )}
    </div>
  );
};

const InfoRow: React.FC<{ icon: any, label: string, value: string, onAction?: () => void, isLink?: boolean }> = ({ icon: Icon, label, value, onAction, isLink }) => (
  <div className={`flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors ${isLink ? 'cursor-pointer group/link' : ''}`} onClick={onAction}>
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-amber-500"><Icon size={18} /></div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className={`font-bold text-xs ${isLink ? 'text-amber-600 underline' : 'text-slate-800'}`}>{value}</p>
      </div>
    </div>
    {isLink && <ExternalLink size={14} className="text-slate-300" />}
  </div>
);
