
import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../services/db';
import { Student, AttendanceRecord, LibraryResource, Announcement, Homework } from '../types';
import { 
  Award, 
  Clock, 
  CreditCard, 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Bell, 
  LogOut,
  RefreshCw,
  Zap,
  Coffee,
  Heart,
  FileText,
  Download,
  ExternalLink,
  Info,
  ChevronRight,
  ClipboardList,
  Target,
  Circle,
  Video,
  Play,
  ArrowRight,
  MousePointer2,
  History,
  TrendingUp,
  Activity,
  GraduationCap
} from 'lucide-react';
import { Logo } from './Logo';
import { format } from 'date-fns';

interface StudentPortalProps {
  studentId: string;
  onLogout: () => void;
}

type Tab = 'home' | 'homework' | 'library' | 'announcements';

export const StudentPortal: React.FC<StudentPortalProps> = ({ studentId, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [library, setLibrary] = useState<LibraryResource[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<boolean>(false);
  const [isUpdatingHw, setIsUpdatingHw] = useState<string | null>(null);
  const [activeCourseIdx, setActiveCourseIdx] = useState(0);

  const fetchData = async () => {
    setError(false);
    setIsSyncing(true);
    try {
      const sData = await dbService.getStudent(studentId);
      if (sData) {
        const primaryEnrollment = sData.enrollments?.[activeCourseIdx] || sData.enrollments?.[0];
        const [lData, aData, hData, history] = await Promise.all([
          dbService.getLibrary(true),
          dbService.getAnnouncements(),
          dbService.getHomework(primaryEnrollment?.level, sData.id),
          dbService.getAttendance(studentId)
        ]);
        setStudent(sData);
        setAttendance(history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setLibrary(lData);
        setAnnouncements(aData);
        setHomework(hData);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Portal: Fetch failed", err);
      setError(true);
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [studentId, activeCourseIdx]);

  const handleRequestReset = async () => {
    if (!student) return;
    setIsRequesting(true);
    const updatedStudent = { ...student, paymentRequested: true };
    await dbService.saveStudent(updatedStudent);
    setStudent(updatedStudent);
    setIsRequesting(false);
  };

  const toggleHomeworkStatus = async (hw: Homework) => {
    if (isUpdatingHw) return;
    setIsUpdatingHw(hw.id);
    const newStatus = hw.status === 'pending' ? 'submitted' : 'pending';
    const updatedHw: Homework = { ...hw, status: newStatus as any };
    try {
      await dbService.saveHomework(updatedHw);
      setHomework(prev => prev.map(h => h.id === hw.id ? updatedHw : h));
    } finally {
      setIsUpdatingHw(null);
    }
  };

  if (isLoading && !student) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8">
      <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse">Establishing Uplink...</p>
    </div>
  );

  if (!student) return null;

  const currentEnrollment = student.enrollments?.[activeCourseIdx] || student.enrollments?.[0];

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-32 overflow-x-hidden">
      <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none z-0"></div>
      
      <header className="relative z-20 p-6 flex justify-between items-center max-w-4xl mx-auto">
        <Logo size="md" />
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-spin' : 'bg-emerald-500 animate-pulse'}`} />
          <button onClick={onLogout} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-red-400 transition-all"><LogOut size={18} /></button>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-6">
        {activeTab === 'home' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl font-black text-3xl">
                {student.fullName.charAt(0)}
              </div>
              <h1 className="text-3xl font-black tracking-tight mb-2">Welcome Back, {student.fullName.split(' ')[0]}</h1>
              
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {student.enrollments?.map((e, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveCourseIdx(idx)}
                    className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeCourseIdx === idx ? 'bg-amber-500 text-slate-950 shadow-xl' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                  >
                    {e.course}
                  </button>
                ))}
              </div>
            </div>

            {student.meetingLink && (
               <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in">
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white"><Video size={32} /></div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900">Virtual Class</h2>
                        <p className="text-[10px] font-black uppercase text-slate-900/60 tracking-widest">{currentEnrollment?.course} Track Active</p>
                      </div>
                    </div>
                    <button onClick={() => window.open(student.meetingLink, '_blank')} className="w-full md:w-auto px-10 py-5 bg-slate-900 text-white rounded-[1.8rem] font-black text-sm uppercase shadow-xl flex items-center justify-center gap-3 active:scale-95"><Play size={18} fill="currentColor" /> Join Now</button>
                  </div>
               </div>
            )}

            <CreditCardSection student={student} isRequesting={isRequesting} onReset={handleRequestReset} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <CurrentTopicCard enrollment={currentEnrollment} />
               <RecentAttendanceCard attendance={attendance} used={student.billing.classesAttended} total={student.billing.totalClassesAllowed} />
            </div>
          </div>
        )}

        {activeTab === 'homework' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
             <SectionHeader title="Training Tasks" subtitle={`${currentEnrollment?.course} • ${currentEnrollment?.level}`} icon={Target} />
             <div className="grid grid-cols-1 gap-6">
                {homework.length === 0 ? (
                  <EmptyState icon={ClipboardList} message="All caught up! No pending tasks." />
                ) : homework.map(hw => (
                  <div key={hw.id} className={`bg-white/5 border border-white/10 rounded-[2.5rem] p-10 flex flex-col group relative ${hw.status === 'submitted' ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-5 mb-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${hw.status === 'submitted' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-amber-500'}`}><ClipboardList size={28} /></div>
                      <div>
                        <h4 className={`font-black text-2xl tracking-tight ${hw.status === 'submitted' ? 'line-through' : ''}`}>{hw.title}</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Due {format(new Date(hw.dueDate), 'MMM dd')}</p>
                      </div>
                    </div>
                    <p className="text-slate-400 text-base leading-relaxed mb-8">{hw.description}</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                       {hw.resourceLink && (
                         <button 
                           onClick={() => window.open(hw.resourceLink, '_blank')} 
                           className="flex-1 bg-amber-500 text-slate-950 py-6 rounded-[2rem] font-black uppercase text-xs tracking-wider shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-4 group/btn"
                         >
                           <div className="w-5 h-5 flex items-center justify-center">
                             <Play size={20} fill="currentColor" className="text-slate-950 group-hover/btn:scale-110 transition-transform" />
                           </div>
                           START THE ASSIGNMENT
                         </button>
                       )}
                       <button 
                         onClick={() => toggleHomeworkStatus(hw)} 
                         disabled={isUpdatingHw === hw.id} 
                         className={`flex-1 py-6 rounded-[2rem] font-black uppercase text-xs tracking-wider transition-all shadow-xl active:scale-[0.98] ${
                           hw.status === 'submitted' 
                             ? 'bg-slate-800 text-slate-400 border border-white/5' 
                             : 'bg-white text-slate-950'
                         }`}
                       >
                          {hw.status === 'submitted' ? 'UNDO SUBMISSION' : 'MARK DONE'}
                       </button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'library' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
             <SectionHeader title="Academy Library" subtitle="Knowledge Hub & Resources" icon={BookOpen} />
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {library.map(item => (
                  <div key={item.id} className="bg-white/5 border border-white/10 rounded-[3.5rem] flex flex-col overflow-hidden hover:bg-white/10 transition-all group">
                    <div className="h-64 relative overflow-hidden bg-slate-800/50">
                       {item.coverImageUrl && <img src={item.coverImageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />}
                       <div className="absolute top-6 left-6"><span className="px-4 py-1.5 bg-amber-500/90 text-slate-900 text-[10px] font-black uppercase rounded-full shadow-lg">{item.category}</span></div>
                    </div>
                    <div className="p-10 flex flex-col gap-10">
                      <div><h4 className="font-black text-2xl mb-3">{item.title}</h4><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.type.toUpperCase()} DOCUMENT</p></div>
                      <button onClick={() => window.open(item.url, '_blank')} className="flex items-center justify-center gap-3 py-6 bg-white text-slate-950 rounded-[2rem] font-black text-xs uppercase hover:bg-amber-500 transition-all">Access Asset <ArrowRight size={18} /></button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
             <SectionHeader title="Academy Feed" subtitle="Global bulletins" icon={Bell} />
             <div className="space-y-6">
                {announcements.map(ann => (
                  <div key={ann.id} className="bg-white/5 border border-white/10 p-10 rounded-[3rem] space-y-6 relative overflow-hidden group">
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${ann.priority === 'high' ? 'bg-red-500' : 'bg-amber-50'}`}></div>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${ann.priority === 'high' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}><Info size={24} /></div>
                        <h4 className="font-black text-2xl tracking-tight">{ann.title}</h4>
                      </div>
                      <p className="text-[10px] font-black text-slate-600 uppercase pt-2">{format(new Date(ann.date), 'MMM dd')}</p>
                    </div>
                    <p className="text-slate-400 text-base leading-relaxed pl-16">{ann.content}</p>
                  </div>
                ))}
             </div>
          </div>
        )}

        <footer className="py-20 flex flex-col items-center gap-4 opacity-30">
           <Heart size={20} className="text-red-500" />
           <p className="text-[8px] font-black uppercase tracking-[0.5em]">Powered by KingCompiler Engine</p>
        </footer>
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-slate-900/90 backdrop-blur-3xl border border-white/5 p-2.5 rounded-[2.5rem] flex justify-around items-center shadow-2xl z-50">
        <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={Zap} label="Home" />
        <NavButton active={activeTab === 'homework'} onClick={() => setActiveTab('homework')} icon={Target} label="Tasks" />
        <NavButton active={activeTab === 'library'} onClick={() => setActiveTab('library')} icon={BookOpen} label="Library" />
        <NavButton active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} icon={Bell} label="News" />
      </nav>
    </div>
  );
};

const NavButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 p-4 px-6 rounded-[1.8rem] transition-all duration-500 ${active ? 'bg-amber-500 text-slate-950' : 'text-slate-500'}`}>
    <Icon size={24} />
    <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${active ? 'block' : 'hidden sm:block'}`}>{label}</span>
  </button>
);

const SectionHeader = ({ title, subtitle, icon: Icon }: any) => (
  <div className="flex items-center gap-6 mb-12">
    <div className="w-20 h-20 bg-amber-500 text-slate-950 rounded-[2.2rem] flex items-center justify-center shadow-2xl shadow-amber-500/20"><Icon size={38} /></div>
    <div><h2 className="text-4xl font-black tracking-tight">{title}</h2><p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-1">{subtitle}</p></div>
  </div>
);

const EmptyState = ({ icon: Icon, message }: any) => (
  <div className="bg-white/5 border border-dashed border-white/10 py-32 px-10 rounded-[3rem] text-center"><Icon size={56} className="mx-auto mb-8 text-slate-800" /><p className="text-[12px] font-black uppercase text-slate-500 tracking-[0.3em]">{message}</p></div>
);

const CreditCardSection = ({ student, isRequesting, onReset }: any) => {
  const used = student.billing.classesAttended;
  const total = student.billing.totalClassesAllowed;
  const progress = (used / total) * 100;
  const isFinished = used >= total;
  const remaining = Math.max(0, total - used);
  return (
    <div className={`rounded-[3.5rem] p-12 border-2 transition-all duration-700 relative overflow-hidden ${isFinished ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
      <div className="flex justify-between items-start mb-10">
        <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Credit Cycle</p><h2 className="text-6xl font-black">{used}<span className="text-slate-700">/{total}</span></h2></div>
        <div className={`p-6 rounded-[2rem] ${isFinished ? 'bg-red-500 text-white' : 'bg-amber-500 text-slate-950'}`}><Zap size={32} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Classes Done</p><p className="text-2xl font-black text-white">{used}</p></div>
        <div className={`p-5 rounded-3xl border ${isFinished ? 'bg-red-500/20' : 'bg-white/5 border-white/10'}`}><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Remaining</p><p className={`text-2xl font-black ${isFinished ? 'text-red-500' : 'text-amber-500'}`}>{remaining}</p></div>
      </div>
      <div className="space-y-6">
        <div className="h-5 w-full bg-white/5 border border-white/10 rounded-full overflow-hidden p-1">
          <div className={`h-full rounded-full transition-all duration-1000 ${isFinished ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]'}`} style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
        <div className="flex justify-between items-center px-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{isFinished ? 'Inventory Depleted' : `${remaining} Sessions Available`}</p>
          {isFinished && <span className="flex items-center gap-2 text-red-400 text-[10px] font-black uppercase animate-pulse"><Bell size={12} /> Renewal Notification</span>}
        </div>
      </div>
      {isFinished && (
        <div className="mt-12 space-y-4">
          {student.paymentRequested ? (
            <div className="w-full py-6 bg-emerald-500/10 border border-emerald-500/30 rounded-[2rem] text-emerald-400 text-center"><p className="text-[12px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3"><CheckCircle2 size={20} /> Verified Receipt Logged</p></div>
          ) : (
            <button onClick={onReset} disabled={isRequesting} className="w-full py-6 bg-white text-slate-950 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-amber-500 transition-all flex items-center justify-center gap-4">{isRequesting ? <RefreshCw size={24} className="animate-spin" /> : <><CreditCard size={24} /> Report New Payment</>}</button>
          )}
        </div>
      )}
    </div>
  );
};

const CurrentTopicCard = ({ enrollment }: { enrollment?: any }) => (
  <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] flex flex-col justify-between group hover:bg-white/10 transition-all">
    <div className="space-y-8">
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform"><GraduationCap size={28} /></div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Active Unit: {enrollment?.course}</p>
          <h3 className="text-xl font-black leading-tight">{enrollment?.assignedTopics[enrollment.currentTopicIndex] || 'Final Mastery'}</h3>
        </div>
      </div>
      <p className="text-sm text-slate-400 leading-relaxed">Level: {enrollment?.level}. Mastering this unit unlocks the next certification stage in the curriculum.</p>
    </div>
    <div className="mt-10 pt-8 border-t border-white/5">
       <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]"><span>Syllabus Progress</span><span className="text-amber-500">{enrollment ? Math.round((enrollment.currentTopicIndex / (enrollment.assignedTopics.length || 1)) * 100) : 0}%</span></div>
       <div className="h-1.5 w-full bg-white/5 rounded-full mt-3 overflow-hidden"><div className="h-full bg-amber-500/30 rounded-full" style={{ width: `${enrollment ? (enrollment.currentTopicIndex / (enrollment.assignedTopics.length || 1)) * 100 : 0}%` }} /></div>
    </div>
  </div>
);

const RecentAttendanceCard = ({ attendance, used, total }: any) => (
  <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] space-y-8 hover:bg-white/10 transition-all">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3"><Activity size={16} className="text-amber-500" /><h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Recent Activity</h3></div>
      <span className="text-[9px] font-black text-white bg-white/10 px-2 py-0.5 rounded-full uppercase">{used} of {total} Sessions</span>
    </div>
    <div className="space-y-5">
      {attendance.slice(0, 5).map((log: any) => (
        <div key={log.id} className="flex items-center justify-between group/item">
          <div className="flex items-center gap-4">
            <div className={`w-2.5 h-2.5 rounded-full ${log.present ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`} />
            <div className="min-w-0"><p className="text-sm font-bold text-slate-200 truncate max-w-[140px] group-hover/item:text-white transition-colors">{log.topicCompleted}</p><p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{format(new Date(log.date), 'MMM dd')} • {log.course}</p></div>
          </div>
          <div className="text-right shrink-0"><span className={`text-[9px] font-black uppercase tracking-widest block ${log.present ? 'text-emerald-500' : 'text-red-500/60'}`}>{log.present ? 'Attended' : 'Absent'}</span></div>
        </div>
      ))}
    </div>
  </div>
);
