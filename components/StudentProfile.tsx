
import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../services/db';
import { Student, ClassSchedule, AttendanceRecord, StudentStatus } from '../types';
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
  Coffee
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

  const fetchProfileData = async () => {
    setIsLoading(true);
    const allStudents = await dbService.getStudents();
    const found = allStudents.find(s => s.id === studentId);
    setStudent(found);
    
    if (found) {
      const [foundSchedules, history] = await Promise.all([
        dbService.getSchedules(studentId),
        dbService.getAttendance(studentId)
      ]);
      setSchedules(foundSchedules);
      setAttendance(history);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProfileData();
  }, [studentId]);

  const masterSyllabus = useMemo(() => {
    if (!student) return [];
    return LEVEL_TOPICS.find(lt => lt.level === student.level)?.topics || [];
  }, [student?.level]);

  const toggleBreakStatus = async () => {
    if (!student) return;
    setIsUpdatingStatus(true);
    // Explicitly type the literal values to avoid string-widening issues
    const updatedStatus: StudentStatus = student.status === 'break' ? 'active' : 'break';
    const updatedStudent: Student = { ...student, status: updatedStatus };
    
    await dbService.saveStudent(updatedStudent);
    setStudent(updatedStudent);
    setIsUpdatingStatus(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-20">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Retrieving Student Records...</p>
      </div>
    );
  }

  if (!student) return <div className="p-12 text-center text-slate-500">Student not found.</div>;

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

  const progress = (student.billing.classesAttended / student.billing.totalClassesAllowed) * 100;
  const currentTopic = masterSyllabus[student.currentTopicIndex] || (student.currentTopicIndex >= masterSyllabus.length ? "Course Completed" : "Topic Not Found");
  const projectedAnnual = student.billing.feeAmount * 12;

  return (
    <div className="space-y-8 animate-in slide-in-from-right-8 duration-500 pb-20">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl transition-all shadow-sm group"
        >
          <ArrowLeft size={20} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
        </button>
        <div className="flex items-center justify-between flex-1">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{student.fullName}</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Profile & Master Syllabus Tracking</p>
          </div>
          {student.status === 'break' && (
            <div className="bg-amber-100 text-amber-700 px-5 py-2 rounded-2xl border border-amber-200 flex items-center gap-2 animate-pulse">
              <Moon size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Currently on Break</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <div className="flex flex-col items-center text-center mb-8">
              <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-4xl font-black text-white shadow-xl mb-4 transition-all ${
                student.status === 'break' ? 'bg-slate-400 shadow-slate-400/20 grayscale' : 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/20'
              }`}>
                {student.status === 'break' ? <Moon size={48} /> : student.fullName.charAt(0)}
              </div>
              <h2 className="text-xl font-black text-slate-800">{student.fullName}</h2>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full mt-3 border border-amber-100">
                {student.level} Tier
              </span>
            </div>

            <div className="space-y-4">
              <InfoRow icon={User} label="Age" value={`${student.age} Years`} />
              <InfoRow icon={Phone} label="WhatsApp" value={student.whatsappNumber || 'Not provided'} />
              <InfoRow icon={BookOpen} label="Enrolled Course" value={student.course} />
              <InfoRow icon={Calendar} label="Member Since" value={student.joiningDate} />
              <InfoRow icon={Activity} label="Active Lesson" value={currentTopic} />
            </div>

            <div className="mt-8 pt-8 border-t border-slate-50">
              <button
                onClick={toggleBreakStatus}
                disabled={isUpdatingStatus}
                className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 border shadow-sm ${
                  student.status === 'break'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                    : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                }`}
              >
                {isUpdatingStatus ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : student.status === 'break' ? (
                  <><Zap size={16} /> Reactivate Student</>
                ) : (
                  <><Coffee size={16} /> Put on Break</>
                )}
              </button>
            </div>
          </div>

          <div className={`rounded-[2.5rem] p-8 border-2 shadow-lg transition-all ${
            student.billing.feeStatus === 'due' 
              ? 'bg-red-50 border-red-100 shadow-red-500/5' 
              : 'bg-slate-900 border-slate-800 shadow-slate-950/20 text-white'
          }`}>
            <div className="flex items-center justify-between mb-8">
              <h3 className={`font-black text-xs uppercase tracking-widest ${student.billing.feeStatus === 'due' ? 'text-red-500' : 'text-slate-400'}`}>
                Finance & Credits
              </h3>
              <CreditCard className={student.billing.feeStatus === 'due' ? 'text-red-500' : 'text-amber-500'} />
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className={`text-4xl font-black ${student.billing.feeStatus === 'due' ? 'text-slate-900' : 'text-white'}`}>
                    ${student.billing.feeAmount}
                  </p>
                  <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${student.billing.feeStatus === 'due' ? 'text-slate-500' : 'text-slate-400'}`}>
                    PER CYCLE REVENUE
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    student.billing.feeStatus === 'due' ? 'bg-red-500 text-white' : 'bg-green-500/20 text-green-400 border border-green-500/30'
                  }`}>
                    {student.billing.feeStatus}
                  </span>
                </div>
              </div>

              <div className={`p-4 rounded-2xl flex items-center gap-3 ${student.billing.feeStatus === 'due' ? 'bg-slate-100' : 'bg-white/5 border border-white/10'}`}>
                <TrendingUp size={16} className="text-emerald-500" />
                <div className="min-w-0">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${student.billing.feeStatus === 'due' ? 'text-slate-400' : 'text-slate-500'}`}>Projected Annual</p>
                  <p className={`font-bold text-sm ${student.billing.feeStatus === 'due' ? 'text-slate-800' : 'text-white'}`}>${projectedAnnual.toLocaleString()}/Year</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className={student.billing.feeStatus === 'due' ? 'text-slate-400' : 'text-slate-500'}>Session Consumption</span>
                  <span className={student.billing.feeStatus === 'due' ? 'text-slate-800' : 'text-white'}>
                    {student.billing.classesAttended} / {student.billing.totalClassesAllowed} Used
                  </span>
                </div>
                <div className={`h-2.5 w-full rounded-full overflow-hidden border ${student.billing.feeStatus === 'due' ? 'bg-white border-slate-100' : 'bg-white/5 border-white/10'}`}>
                  <div 
                    className={`h-full transition-all duration-1000 ${student.billing.feeStatus === 'due' ? 'bg-red-500' : 'bg-amber-50'}`}
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Recent Activity</h3>
            <div className="space-y-6">
              {attendance.map((log) => (
                <div key={log.id} className="flex gap-4">
                  <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${log.present ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {log.present ? <CheckCircle2 size={16}/> : <XCircle size={16}/>}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{log.topicCompleted}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                      {format(new Date(log.date), 'MMM dd, yyyy')} • {log.present ? 'Attended' : 'Absent'}
                    </p>
                  </div>
                </div>
              ))}
              {attendance.length === 0 && (
                <p className="text-center py-4 text-xs font-bold text-slate-300 uppercase tracking-widest">No history recorded yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-800">Class Schedules</h3>
              <button 
                onClick={() => { setEditingSchedule(null); setIsScheduleModalOpen(true); }}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white hover:bg-slate-800 px-6 py-3 rounded-2xl transition-all shadow-lg active:scale-95"
              >
                <Plus size={16} /> New Slot
              </button>
            </div>

            <div className="space-y-4">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-amber-200 transition-all group">
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
                      schedule.active ? 'bg-white text-amber-600' : 'bg-slate-200 text-slate-400'
                    }`}>
                      <Clock size={28} />
                    </div>
                    <div>
                      <div className="flex gap-1.5 mb-2">
                        {DAY_LABELS.map((day, i) => (
                          <span key={i} className={`text-[8px] font-black w-5 h-5 flex items-center justify-center rounded-lg border transition-colors ${
                            schedule.days.includes(i) 
                              ? 'bg-slate-900 text-white border-slate-900' 
                              : 'bg-white text-slate-300 border-slate-100'
                          }`}>
                            {day}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-black text-slate-800 text-lg tracking-tight leading-none">
                          {schedule.startTime} — {schedule.endTime}
                        </p>
                        {!schedule.active && (
                          <span className="bg-slate-200 text-slate-500 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                            Paused
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => { setEditingSchedule(schedule); setIsScheduleModalOpen(true); }}
                      className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                    >
                      <Edit3 size={20} />
                    </button>
                    <button 
                      onClick={() => removeSchedule(schedule.id)}
                      className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
              {schedules.length === 0 && (
                <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                  <div className="bg-slate-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Calendar size={32} />
                  </div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active class schedules found.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Curriculum Progression</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Direct Master Syllabus Sync</p>
              </div>
              <div className="bg-amber-100 p-2.5 rounded-2xl">
                <Award className="text-amber-600" size={24} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {masterSyllabus.map((topic, index) => {
                const isCompleted = index < student.currentTopicIndex;
                const isCurrent = index === student.currentTopicIndex;
                const isLocked = index > student.currentTopicIndex;

                return (
                  <div key={index} className={`p-5 rounded-3xl border flex items-center gap-5 transition-all group ${
                    isCompleted ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' :
                    isCurrent ? 'bg-amber-50 border-amber-300 text-amber-900 ring-4 ring-amber-500/10' :
                    'bg-slate-50/50 border-slate-100 text-slate-400'
                  }`}>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs transition-all ${
                      isCompleted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' :
                      isCurrent ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 scale-110' :
                      'bg-slate-200 text-slate-500'
                    }`}>
                      {isCompleted ? <CheckCircle2 size={16} /> : index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${isLocked ? 'opacity-60' : 'opacity-100'}`}>
                        {topic}
                      </p>
                      {isCurrent && (
                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 mt-1 flex items-center gap-1.5">
                          <RefreshCw size={10} className="animate-spin" /> Next Up
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {masterSyllabus.length === 0 && (
                <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No topics mapped for {student.level}</p>
                </div>
              )}
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

const InfoRow: React.FC<{ icon: any, label: string, value: string }> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-amber-500 transition-colors">
      <Icon size={18} />
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
      <p className="font-bold text-slate-800">{value}</p>
    </div>
  </div>
);
