
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { dbService } from '../services/db';
import { academyLogic } from '../services/logic';
import { 
  Users, 
  Calendar, 
  DollarSign,
  ArrowRight,
  Zap,
  TrendingUp,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  UserCheck,
  X,
  CreditCard,
  ChevronRight,
  Volume2,
  Bell,
  Settings,
  Upload,
  Link as LinkIcon,
  Play,
  Trash2,
  HandCoins
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Student, ClassSession, GroupBatch } from '../types';
import { AttendanceModal } from './AttendanceModal';
import { Logo } from './Logo';
import { auth } from '../services/firebase';

interface DashboardProps {
  onNavigate: (view: any) => void;
  onSelectStudent: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onSelectStudent }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [groups, setGroups] = useState<GroupBatch[]>([]);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [isOverdueModalOpen, setIsOverdueModalOpen] = useState(false);
  const [isAlarmSettingsOpen, setIsAlarmSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRevenue, setShowRevenue] = useState(false);
  const [agendaView, setAgendaView] = useState<'today' | 'tomorrow'>('today');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const isAdmin = auth.currentUser?.email?.toLowerCase() === 'kingcompiler.official@gmail.com';

  const fetchInitialData = async () => {
    // Stage 1: Load from Cache (Immediate)
    const cachedStudents = await dbService.getStudents(true);
    const cachedSessions = await dbService.getSessions(true);
    const cachedGroups = await dbService.getGroups(true);
    
    setStudents(cachedStudents);
    setSessions(cachedSessions);
    setGroups(cachedGroups);
    setIsLoading(false);

    // Stage 2: Background Refresh (Silent)
    setIsSyncing(true);
    try {
      const [sData, sessData, gData] = await Promise.all([
        dbService.getStudents(false),
        dbService.getSessions(false),
        dbService.getGroups(false)
      ]);
      setStudents(sData);
      setSessions(sessData);
      setGroups(gData);
    } catch (err: any) {
      console.error("Dashboard Background Sync Failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const pendingPayments = useMemo(() => 
    students.filter(s => s.paymentRequested), 
  [students]);

  const handleConfirmPayment = async (student: Student) => {
    setIsUpdating(student.id);
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
    await fetchInitialData();
    setIsUpdating(null);
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  const getFilteredAgenda = (targetDateStr: string) => {
    const activeStudentIds = new Set(students.filter(s => s.status !== 'break').map(s => s.id));

    const rawAgenda = sessions
      .filter(s => s.start?.startsWith(targetDateStr))
      .filter(s => {
        if (s.studentId && !activeStudentIds.has(s.studentId)) return false;
        return true;
      })
      .sort((a, b) => (a.start || "").localeCompare(b.start || ""));
      
    const finalAgenda: ClassSession[] = [];
    const studentBusyMap = new Map<string, string>();

    const groupSessions = rawAgenda.filter(s => !!s.groupId);
    groupSessions.forEach(gs => {
      const timeSlot = gs.start.split('T')[1]?.substring(0, 5) || "00:00";
      const groupData = groups.find(g => g.id === gs.groupId);
      if (groupData) {
        finalAgenda.push(gs);
        groupData.studentIds.forEach(sid => {
          studentBusyMap.set(`${timeSlot}_${sid}`, 'in-group');
        });
      }
    });

    const individualSessions = rawAgenda.filter(s => !s.groupId && !!s.studentId);
    individualSessions.forEach(is => {
      const timeSlot = is.start.split('T')[1]?.substring(0, 5) || "00:00";
      const busyKey = `${timeSlot}_${is.studentId}`;
      if (!studentBusyMap.has(busyKey)) {
        finalAgenda.push(is);
        studentBusyMap.set(busyKey, 'individual');
      }
    });
    
    return finalAgenda.sort((a, b) => (a.start || "").localeCompare(b.start || ""));
  };

  const todayAgenda = useMemo(() => getFilteredAgenda(todayStr), [sessions, todayStr, groups, students]);
  const tomorrowAgenda = useMemo(() => getFilteredAgenda(tomorrowStr), [sessions, tomorrowStr, groups, students]);

  const activeAgenda = agendaView === 'today' ? todayAgenda : tomorrowAgenda;

  const stats = useMemo(() => {
    const activeStudents = students.filter(s => s.status === 'active');
    const overdueList = activeStudents.filter(s => s.billing?.feeStatus === 'due');
    const totalMonthlyRevenue = activeStudents.reduce((acc, s) => acc + (s.billing?.feeAmount || 0), 0);
    const collectedRevenue = activeStudents
      .filter(s => s.billing?.feeStatus === 'paid')
      .reduce((acc, s) => acc + (s.billing?.feeAmount || 0), 0);

    return {
      totalStudents: students.length,
      activeCount: activeStudents.length,
      todayCount: todayAgenda.length,
      tomorrowCount: tomorrowAgenda.length,
      feeDue: overdueList.length,
      overdueStudents: overdueList,
      revenue: totalMonthlyRevenue,
      collected: collectedRevenue,
      collectionRate: totalMonthlyRevenue > 0 ? Math.round((collectedRevenue / totalMonthlyRevenue) * 100) : 0
    };
  }, [students, todayAgenda, tomorrowAgenda]);

  const cards = [
    { 
      id: 'revenue',
      label: 'Monthly Revenue', 
      value: showRevenue ? `$${stats.revenue.toLocaleString()}` : '••••••', 
      icon: TrendingUp, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      isRevenue: true,
      clickable: false
    },
    { 
      id: 'today',
      label: 'Agenda Today', 
      value: stats.todayCount, 
      icon: Calendar, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50',
      clickable: false
    },
    { 
      id: 'overdue',
      label: 'Overdue Payments', 
      value: stats.feeDue, 
      icon: DollarSign, 
      color: 'text-red-600', 
      bg: 'bg-red-50',
      clickable: true
    },
    { 
      id: 'directory',
      label: isAdmin ? 'Global Directory' : 'Your Students', 
      value: stats.totalStudents, 
      icon: Users, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      clickable: false
    },
  ];

  const handleAttendance = async (studentId: string, present: boolean, homework?: { message: string, link: string }) => {
    if (!selectedSession) return;
    await academyLogic.processAttendance(selectedSession, studentId, present, homework);
  };

  const handleFinalize = async () => {
    if (!selectedSession) return;
    await academyLogic.finalizeSession(selectedSession);
    await fetchInitialData();
    setSelectedSession(null);
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">Waking Academy Cache...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="bg-slate-900 rounded-[2rem] lg:rounded-[3rem] py-8 px-6 lg:py-14 lg:px-12 text-white relative overflow-hidden shadow-2xl shadow-slate-950/20 flex items-center border border-white/5">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] lg:w-[500px] lg:h-[500px] bg-amber-500/10 rounded-full blur-[80px] lg:blur-[120px] translate-x-1/3 -translate-y-1/3"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 lg:gap-10 w-full">
          <div>
            <Logo size="md" className="mb-4 lg:mb-6" />
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                <div className={`h-2 w-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-spin' : 'bg-emerald-500 animate-pulse'}`}></div>
                <p className="text-emerald-400 font-black text-[9px] uppercase tracking-[0.2em]">
                   {isSyncing ? 'Syncing...' : 'Live Connected'}
                </p>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isAdmin ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                {isAdmin ? <ShieldCheck size={12}/> : <UserCheck size={12}/>}
                <p className="font-black text-[9px] uppercase tracking-[0.2em]">{isAdmin ? 'Admin Console' : 'Partner Access'}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => onNavigate('groups')}
              className="flex-1 lg:flex-none bg-white/5 border border-white/10 px-6 py-3 lg:px-8 lg:py-4 rounded-xl lg:rounded-2xl backdrop-blur-md hover:bg-white/10 transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Layers size={16} className="text-amber-500" /> Batches
            </button>
            <button 
              onClick={() => onNavigate('calendar')}
              className="flex-1 lg:flex-none bg-amber-500 text-slate-900 px-6 py-3 lg:px-8 lg:py-4 rounded-xl lg:rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amber-500/20 hover:bg-amber-400 transition-all active:scale-95 flex items-center justify-center"
            >
              Full Schedule
            </button>
          </div>
        </div>
      </div>

      {/* Payment Requests Warning Section */}
      {pendingPayments.length > 0 && (
        <div className="bg-emerald-50 border-2 border-emerald-100 rounded-[2.5rem] p-8 lg:p-10 animate-in bounce-in">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
              <HandCoins size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">Payment Approvals Required</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verify and reset class counts</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingPayments.map(s => (
              <div key={s.id} className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">
                    {s.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-sm leading-none mb-1">{s.fullName}</p>
                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Paid Claimed</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleConfirmPayment(s)}
                  disabled={isUpdating === s.id}
                  className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-md active:scale-90 disabled:opacity-50"
                  title="Confirm Payment & Reset Count"
                >
                  {isUpdating === s.id ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {cards.map((card, i) => (
          <div 
            key={i} 
            onClick={() => card.clickable && card.id === 'overdue' && setIsOverdueModalOpen(true)}
            className={`text-left bg-white p-6 lg:p-8 rounded-[1.5rem] lg:rounded-[2.5rem] shadow-sm border border-slate-100 transition-all duration-300 group/card relative ${card.clickable ? 'hover:border-amber-400 hover:shadow-xl hover:shadow-slate-200/50 cursor-pointer' : ''}`}
          >
            <div className="flex items-center justify-between mb-6 lg:mb-8">
              <div className={`${card.bg} p-3 lg:p-4 rounded-xl lg:rounded-2xl`}>
                <card.icon className={card.color} size={24} />
              </div>
              {card.isRevenue && (
                <div 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setShowRevenue(!showRevenue); 
                  }}
                  className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all border border-transparent hover:border-amber-100 cursor-pointer z-20"
                >
                  {showRevenue ? <EyeOff size={16} /> : <Eye size={16} />}
                </div>
              )}
              {card.clickable && (
                <ArrowRight size={16} className="text-slate-300 group-hover/card:translate-x-1 transition-transform" />
              )}
            </div>
            <p className="text-slate-400 font-bold text-[9px] lg:text-[10px] uppercase tracking-widest mb-1">{card.label}</p>
            <p className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-10 border border-slate-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 lg:mb-10">
            <div>
              <h3 className="text-lg lg:text-xl font-black text-slate-800 tracking-tight">Agenda Queue</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Deduplicated Smart View</p>
            </div>
            
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              <button 
                onClick={() => setAgendaView('today')}
                className={`px-4 lg:px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
                  agendaView === 'today' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Today
                <span className={`px-2 py-0.5 rounded-md text-[8px] ${agendaView === 'today' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {stats.todayCount}
                </span>
              </button>
              <button 
                onClick={() => setAgendaView('tomorrow')}
                className={`px-4 lg:px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
                  agendaView === 'tomorrow' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Tomorrow
                <span className={`px-2 py-0.5 rounded-md text-[8px] ${agendaView === 'tomorrow' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {stats.tomorrowCount}
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-3 lg:space-y-4">
            {activeAgenda.map((session) => (
              <div 
                key={session.id} 
                className={`p-4 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] border transition-all duration-300 flex items-center justify-between group ${
                  session.status === 'completed' 
                    ? 'bg-slate-50 border-slate-100 opacity-60' 
                    : 'bg-white border-slate-100 hover:border-amber-200 hover:shadow-xl hover:shadow-slate-200/50'
                }`}
              >
                <div className="flex items-center gap-4 lg:gap-6">
                  <div className={`w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center font-black ${
                    session.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-900 text-white shadow-lg'
                  }`}>
                    <Clock size={20} className="lg:hidden" />
                    <Clock size={24} className="hidden lg:block" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                      <h4 className="font-black text-slate-900 text-sm lg:text-lg tracking-tight truncate max-w-[150px] sm:max-w-none">
                        {session.groupId ? session.groupName : session.studentName}
                      </h4>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border inline-block w-fit ${session.groupId ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                        {session.groupId ? 'Batch' : 'Private'}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Clock size={10} /> {format(new Date(session.start), 'HH:mm')}
                    </p>
                  </div>
                </div>
                
                {session.status === 'upcoming' ? (
                  <button 
                    onClick={() => setSelectedSession(session)}
                    className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white px-5 py-3 lg:px-8 lg:py-4 rounded-xl lg:rounded-2xl transition-all shadow-xl shadow-slate-900/10 hover:bg-slate-800 active:scale-95"
                  >
                    Manage
                  </button>
                ) : (
                  <CheckCircle2 size={20} className="text-emerald-500" />
                )}
              </div>
            ))}
            {activeAgenda.length === 0 && (
              <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/30">
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No sessions found</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-10 border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <h3 className="text-lg lg:text-xl font-black text-slate-800 tracking-tight mb-8 lg:mb-10">Quick Actions</h3>
          <div className="space-y-3 flex-1">
            <QuickAction icon={Users} title="Enroll Student" onClick={() => onNavigate('students')} />
            <QuickAction icon={Layers} title="Batch Manager" onClick={() => onNavigate('groups')} />
            <QuickAction icon={Zap} title="Curriculum" onClick={() => onNavigate('curriculum')} />
            <QuickAction 
              icon={Bell} 
              title="Alarm Settings" 
              onClick={() => setIsAlarmSettingsOpen(true)} 
            />
          </div>
          <div className="mt-8 pt-8 border-t border-slate-100">
             <div className="p-5 bg-slate-900 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">Academy Engine</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Hybrid Cache Active</p>
                </div>
                <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40"></div>
             </div>
          </div>
        </div>
      </div>

      {selectedSession && (
        <AttendanceModal 
          session={selectedSession} 
          onClose={() => setSelectedSession(null)}
          onMarkAttendance={handleAttendance}
          onFinalize={handleFinalize}
        />
      )}

      {isOverdueModalOpen && (
        <OverduePaymentsModal 
          students={stats.overdueStudents}
          onClose={() => setIsOverdueModalOpen(false)}
          onViewProfile={(id) => {
            setIsOverdueModalOpen(false);
            onSelectStudent(id);
          }}
        />
      )}

      {isAlarmSettingsOpen && (
        <AlarmSettingsModal 
          onClose={() => setIsAlarmSettingsOpen(false)}
        />
      )}
    </div>
  );
};

// Helper component for Dashboard quick actions
const QuickAction: React.FC<{ icon: any, title: string, onClick: () => void }> = ({ icon: Icon, title, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-amber-200 hover:bg-amber-50 transition-all group"
  >
    <div className="flex items-center gap-3">
      <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-amber-500 group-hover:text-white transition-all">
        <Icon size={18} />
      </div>
      <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{title}</span>
    </div>
    <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
  </button>
);

// Helper component to display overdue students
const OverduePaymentsModal: React.FC<{ 
  students: Student[], 
  onClose: () => void, 
  onViewProfile: (id: string) => void 
}> = ({ students, onClose, onViewProfile }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
    <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Overdue Payments</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Students with 'Due' status</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all">
          <X size={24} className="text-slate-400" />
        </button>
      </div>
      <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4">
        {students.map(s => (
          <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">
                {s.fullName.charAt(0)}
              </div>
              <div>
                <p className="font-black text-slate-800 text-sm">{s.fullName}</p>
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Fee Due</p>
              </div>
            </div>
            <button 
              onClick={() => onViewProfile(s.id)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm"
            >
              Profile
            </button>
          </div>
        ))}
        {students.length === 0 && (
          <p className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-xs">No overdue payments found</p>
        )}
      </div>
      <div className="p-8 bg-slate-50/50 border-t border-slate-100">
        <button onClick={onClose} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Close</button>
      </div>
    </div>
  </div>
);

// Helper component for alarm sound configuration
const AlarmSettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [customAlarm, setCustomAlarm] = useState<string | null>(localStorage.getItem('academy_custom_alarm'));

  const handleTest = () => {
    academyLogic.playAcademyChime();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        academyLogic.setCustomAlarm(result);
        setCustomAlarm(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearAlarm = () => {
    academyLogic.setCustomAlarm(null);
    setCustomAlarm(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-800">Alarm Settings</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Class Reminders</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all">
            <X size={24} className="text-slate-400" />
          </button>
        </div>
        <div className="p-8 space-y-6">
          <div className="p-6 bg-slate-900 rounded-[2rem] text-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 rounded-lg text-slate-900">
                  <Volume2 size={20} />
                </div>
                <h4 className="font-black text-sm uppercase tracking-widest">Test Chime</h4>
              </div>
              <button 
                onClick={handleTest}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
              >
                <Play size={16} fill="currentColor" />
              </button>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">
              Click play to verify audio output works on this device.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Custom Sound Source</h3>
            <div className="flex items-center gap-4">
              <label className="flex-1 cursor-pointer">
                <div className="flex items-center justify-center gap-3 p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl hover:border-amber-400 hover:bg-amber-50 transition-all text-slate-500 font-bold text-xs uppercase">
                  <Upload size={18} /> {customAlarm ? 'Update Audio' : 'Upload Audio'}
                </div>
                <input type="file" className="hidden" accept="audio/*" onChange={handleFileChange} />
              </label>
              {customAlarm && (
                <button 
                  onClick={clearAlarm}
                  className="p-4 bg-red-50 text-red-500 border border-red-100 rounded-2xl hover:bg-red-100 transition-all"
                  title="Remove Custom Sound"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
            {customAlarm && (
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 px-1">
                <CheckCircle2 size={12} /> Custom Alarm Active
              </p>
            )}
          </div>
        </div>
        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Close</button>
        </div>
      </div>
    </div>
  );
};
