
import React, { useState, useMemo, useEffect } from 'react';
import { dbService } from '../services/db';
import { authService } from '../services/auth';
import { Student, ClassSchedule, BillingType, FeeStatus, AppUser, StudentStatus } from '../types';
import { Plus, Search, Trash2, UserPlus, Eye, Edit2, Clock, Calendar, X, ListOrdered, Phone, Share2, CreditCard, Moon, UserCheck, Users as UsersIcon, Key, ShieldCheck, Lock, EyeOff, Copy, Check, Video } from 'lucide-react';
import { COURSES, LEVEL_TOPICS } from '../constants';

interface StudentManagerProps {
  onSelectStudent: (id: string) => void;
}

const DAYS_OF_WEEK = [
  { label: 'S', value: 0 },
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
];

type FilterTab = 'active' | 'break' | 'all';

export const StudentManager: React.FC<StudentManagerProps> = ({ onSelectStudent }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [collaborators, setCollaborators] = useState<AppUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    const [sData, cData] = await Promise.all([
      dbService.getStudents(),
      dbService.getCollaborators()
    ]);
    setStudents(sData);
    setCollaborators(cData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const counts = useMemo(() => ({
    all: students.length,
    active: students.filter(s => s.status === 'active').length,
    break: students.filter(s => s.status === 'break').length,
  }), [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = 
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.whatsappNumber && s.whatsappNumber.includes(searchTerm));
      
      const matchesTab = 
        activeTab === 'all' || 
        (activeTab === 'active' && s.status === 'active') ||
        (activeTab === 'break' && s.status === 'break');

      return matchesSearch && matchesTab;
    });
  }, [students, searchTerm, activeTab]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure? This will delete the student and all their schedules.')) {
      await dbService.deleteStudent(id);
      await fetchData();
    }
  };

  const handleSave = async (student: Student, schedules: any[], deletedScheduleIds: string[], authConfig?: { email: string, pass: string }) => {
    // 1. Ensure email is attached to student record for portal matching
    if (authConfig?.email) {
      student.email = authConfig.email.toLowerCase();
    }

    // 2. Save Student Record
    await dbService.saveStudent(student);
    
    // 3. Handle Schedules
    for (const id of deletedScheduleIds) {
      await dbService.deleteSchedule(id);
    }

    for (const sch of schedules) {
      const schedule: ClassSchedule = {
        id: sch.id,
        studentId: student.id,
        studentName: student.fullName,
        collaboratorId: student.collaboratorId,
        days: sch.days,
        startTime: sch.startTime,
        endTime: sch.endTime,
        startDate: student.joiningDate,
        active: sch.active ?? true
      };
      await dbService.saveSchedule(schedule);
    }

    // 4. Handle Account Creation
    if (authConfig) {
      try {
        await authService.adminCreateUserAccount(
          authConfig.email, 
          authConfig.pass, 
          student.fullName, 
          'student', 
          student.id
        );
      } catch (err: any) {
        // If account already exists, we don't alert as an error because the student 
        // record is already saved and linked via email.
        if (err.message.includes('already registered')) {
          console.info("Portal account already exists. Record linked via email.");
        } else {
          console.error("Failed to create student auth:", err);
          alert("Record saved, but portal activation encountered an issue: " + err.message);
        }
      }
    }

    await fetchData();
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-6">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search directory..."
            className="w-full pl-12 pr-4 py-4 rounded-[1.5rem] border border-slate-200 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all shadow-sm bg-white font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { setEditingStudent(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-[1.5rem] font-black transition-all shadow-xl shadow-slate-900/10 active:scale-95 text-xs uppercase tracking-widest"
        >
          <UserPlus size={18} />
          Enroll Student
        </button>
      </div>

      <div className="flex p-1.5 bg-slate-100 rounded-[1.5rem] w-fit overflow-x-auto max-w-full custom-scrollbar">
        <TabButton 
          active={activeTab === 'active'} 
          onClick={() => setActiveTab('active')} 
          label="Active" 
          count={counts.active}
          icon={UserCheck}
        />
        <TabButton 
          active={activeTab === 'break'} 
          onClick={() => setActiveTab('break')} 
          label="On Break" 
          count={counts.break}
          icon={Moon}
        />
        <TabButton 
          active={activeTab === 'all'} 
          onClick={() => setActiveTab('all')} 
          label="All Directory" 
          count={counts.all}
          icon={UsersIcon}
        />
      </div>

      <div className="hidden lg:block bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <LoadingState />
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Info</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrollment</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Partner/Source</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => {
                const coll = collaborators.find(c => c.uid === student.collaboratorId);
                return (
                  <StudentTableRow 
                    key={student.id} 
                    student={student} 
                    collaboratorName={coll?.displayName || coll?.email?.split('@')[0] || 'Direct'}
                    onSelect={onSelectStudent} 
                    onEdit={(s) => { setEditingStudent(s); setIsModalOpen(true); }} 
                    onDelete={handleDelete} 
                  />
                );
              })}
              {filteredStudents.length === 0 && <EmptyState tab={activeTab} />}
            </tbody>
          </table>
        )}
      </div>

      <div className="lg:hidden space-y-4">
        {isLoading ? (
          <LoadingState />
        ) : (
          <>
            {filteredStudents.map((student) => (
              <StudentCard key={student.id} student={student} onSelect={onSelectStudent} onEdit={(s) => { setEditingStudent(s); setIsModalOpen(true); }} onDelete={handleDelete} />
            ))}
            {filteredStudents.length === 0 && <EmptyState tab={activeTab} />}
          </>
        )}
      </div>

      {isModalOpen && (
        <StudentModal 
          student={editingStudent} 
          collaborators={collaborators}
          onClose={() => { setIsModalOpen(false); setEditingStudent(null); }} 
          onSave={handleSave} 
        />
      )}
    </div>
  );
};

const TabButton = ({ active, onClick, label, count, icon: Icon }: any) => (
  <button 
    onClick={onClick}
    className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 shrink-0 ${
      active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
    }`}
  >
    <Icon size={14} className={active ? 'text-amber-500' : ''} />
    {label}
    <span className={`px-2 py-0.5 rounded-md text-[8px] ${active ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>
      {count}
    </span>
  </button>
);

const LoadingState = () => (
  <div className="p-20 text-center">
    <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading records...</p>
  </div>
);

const EmptyState = ({ tab }: { tab: string }) => (
  <div className="p-24 text-center">
    <div className="bg-slate-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-200">
      <Search size={40} />
    </div>
    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
      {tab === 'break' ? 'No students are currently on break' : 
       tab === 'active' ? 'No active students found' : 
       'No student records in directory'}
    </p>
  </div>
);

const StudentTableRow = ({ student, collaboratorName, onSelect, onEdit, onDelete }: any) => (
  <tr className={`hover:bg-slate-50/50 transition-colors group ${student.status === 'break' ? 'bg-slate-50/20' : ''}`}>
    <td className="px-8 py-6">
      <div className="flex items-center gap-5">
        <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center font-black transition-all ${
          student.status === 'break' 
            ? 'bg-slate-200 text-slate-400' 
            : 'bg-white border border-slate-100 text-slate-400 group-hover:bg-amber-100 group-hover:border-amber-200 group-hover:text-amber-600 shadow-sm'
        }`}>
          {student.status === 'break' ? <Moon size={20} /> : student.fullName.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-black text-slate-800 leading-tight">{student.fullName}</p>
            {student.status === 'break' && (
              <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1">
                <Moon size={8} /> Break
              </span>
            )}
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Age: {student.age} • Since {student.joiningDate}</p>
        </div>
      </div>
    </td>
    <td className="px-8 py-6">
      <p className="text-sm font-black text-slate-700 tracking-tight">{student.course}</p>
      <p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">Level: {student.level}</p>
    </td>
    <td className="px-8 py-6">
      <div className="flex items-center gap-2">
        <Share2 size={12} className="text-slate-300" />
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{collaboratorName}</p>
      </div>
    </td>
    <td className="px-8 py-6">
      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
        student.billing.feeStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
        student.billing.feeStatus === 'due' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-100'
      }`}>
        {student.billing.feeStatus}
      </span>
    </td>
    <td className="px-8 py-6">
      <div className="flex items-center justify-end gap-3">
        <button onClick={() => onSelect(student.id)} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200"><Eye size={18} /></button>
        <button onClick={() => onEdit(student)} className="p-3 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all border border-transparent hover:border-amber-100"><Edit2 size={18} /></button>
        <button onClick={() => onDelete(student.id)} className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"><Trash2 size={18} /></button>
      </div>
    </td>
  </tr>
);

const StudentCard = ({ student, onSelect, onEdit, onDelete }: any) => (
  <div className={`bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 ${student.status === 'break' ? 'opacity-70' : ''}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black ${
          student.status === 'break' ? 'bg-slate-200 text-slate-400' : 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
        }`}>
          {student.status === 'break' ? <Moon size={24} /> : student.fullName.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-black text-slate-900 text-lg leading-tight tracking-tight">{student.fullName}</p>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{student.level}</p>
        </div>
      </div>
      <div className="flex gap-1">
        <button onClick={() => onEdit(student)} className="p-3 text-slate-400 hover:bg-slate-50 rounded-xl"><Edit2 size={18} /></button>
        <button onClick={() => onDelete(student.id)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={18} /></button>
      </div>
    </div>
    
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center gap-2 text-slate-400">
        <Clock size={12} />
        <p className="text-[10px] font-bold uppercase tracking-widest">{student.course}</p>
      </div>
      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
        student.billing.feeStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
      }`}>
        {student.billing.feeStatus}
      </span>
    </div>

    <button 
      onClick={() => onSelect(student.id)}
      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 active:scale-[0.98] transition-all"
    >
      Manage Profile
    </button>
  </div>
);

const StudentModal: React.FC<{ 
  student: Student | null, 
  collaborators: AppUser[],
  onClose: () => void, 
  onSave: (s: Student, schedules: any[], deletedIds: string[], authConfig?: { email: string, pass: string }) => void 
}> = ({ student, collaborators, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Student>>(student || {
    id: Math.random().toString(36).substr(2, 9),
    fullName: '',
    email: '',
    age: 18,
    whatsappNumber: '',
    meetingLink: '',
    course: COURSES[0],
    level: LEVEL_TOPICS[0].level,
    collaboratorId: '',
    status: 'active',
    joiningDate: new Date().toISOString().split('T')[0],
    billing: {
      type: 'monthly',
      feeAmount: 500,
      totalClassesAllowed: 8,
      classesAttended: 0,
      feeStatus: 'paid'
    },
    currentTopicIndex: 0,
    assignedTopics: LEVEL_TOPICS[0].topics
  });

  const [initialSchedules, setInitialSchedules] = useState<Array<{
    id: string;
    days: number[];
    startTime: string;
    endTime: string;
    active?: boolean;
  }>>(student ? [] : [{
    id: Math.random().toString(36).substr(2, 9),
    days: [1],
    startTime: '10:00',
    endTime: '11:00',
    active: true
  }]);

  const [deletedScheduleIds, setDeletedScheduleIds] = useState<string[]>([]);
  const [isSchedulesLoading, setIsSchedulesLoading] = useState(!!student);
  
  const [enableAccess, setEnableAccess] = useState(false);
  const [studentPassword, setStudentPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (student) {
      dbService.getSchedules(student.id).then(data => {
        setInitialSchedules(data.map(d => ({
          id: d.id,
          days: d.days,
          startTime: d.startTime,
          endTime: d.endTime,
          active: d.active
        })));
        setIsSchedulesLoading(false);
      });
    }
  }, [student]);

  const currentLevelTopics = useMemo(() => {
    return LEVEL_TOPICS.find(lt => lt.level === formData.level)?.topics || [];
  }, [formData.level]);

  const copyCreds = () => {
    const text = `KingCompiler Academy\n\nLogin Email: ${formData.email}\nPassword: ${studentPassword}\n\nLogin at: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addSlot = () => {
    setInitialSchedules(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      days: [],
      startTime: '10:00',
      endTime: '11:00',
      active: true
    }]);
  };

  const removeSlot = (id: string) => {
    if (initialSchedules.length <= 1) {
      alert("At least one schedule slot is required.");
      return;
    }
    if (student) setDeletedScheduleIds(prev => [...prev, id]);
    setInitialSchedules(prev => prev.filter(s => s.id !== id));
  };

  const toggleDay = (slotId: string, dayValue: number) => {
    setInitialSchedules(prev => prev.map(s => {
      if (s.id !== slotId) return s;
      return {
        ...s,
        days: s.days.includes(dayValue) 
          ? s.days.filter(d => d !== dayValue)
          : [...s.days, dayValue].sort()
      };
    }));
  };

  const updateTime = (slotId: string, field: 'startTime' | 'endTime', value: string) => {
    setInitialSchedules(prev => prev.map(s => {
      if (s.id !== slotId) return s;
      return { ...s, [field]: value };
    }));
  };

  const updateBilling = (field: keyof Student['billing'], value: any) => {
    setFormData(prev => ({
      ...prev,
      billing: {
        ...(prev.billing || {
          type: 'monthly',
          feeAmount: 500,
          totalClassesAllowed: 8,
          classesAttended: 0,
          feeStatus: 'paid'
        }),
        [field]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialSchedules.some(s => s.days.length === 0)) {
      alert("Please select at least one day for all schedule slots.");
      return;
    }
    if (enableAccess && (!formData.email || studentPassword.length < 6)) {
      alert("Please provide a valid email and a password of at least 6 characters for portal access.");
      return;
    }

    const finalStudent: Student = {
      ...formData,
      status: (formData.status as StudentStatus) || 'active',
      assignedTopics: currentLevelTopics
    } as Student;

    const authConfig = enableAccess ? { email: formData.email!, pass: studentPassword } : undefined;
    
    onSave(finalStudent, initialSchedules, deletedScheduleIds, authConfig);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[95vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30 shrink-0">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800">{student ? 'Update Profile' : 'New Enrollment'}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure student & schedules</p>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X size={24} className="text-slate-400" />
            </button>
          </div>

          <div className="flex-1 p-6 sm:p-8 space-y-8 overflow-y-auto">
            {/* Account Access Creation Section */}
            <div className={`bg-slate-900 rounded-[2rem] p-6 text-white space-y-4 transition-all ${enableAccess ? 'ring-4 ring-amber-500/20' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${student?.email || enableAccess ? 'bg-amber-500 text-slate-900' : 'bg-white/10 text-slate-500'}`}>
                    <Key size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm tracking-tight">{student?.email ? 'Manage Account' : 'Portal Credentials'}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      {student?.email ? 'Account Active' : 'Enable Student Dashboard'}
                    </p>
                  </div>
                </div>
                {!student?.email && (
                  <button 
                    type="button"
                    onClick={() => setEnableAccess(!enableAccess)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${enableAccess ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20' : 'bg-white/10 text-slate-400'}`}
                  >
                    {enableAccess ? 'Disable Access' : 'Enable Access'}
                  </button>
                )}
              </div>

              {(enableAccess || student?.email) && (
                <div className="space-y-4 pt-2 animate-in slide-in-from-top-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Portal Email</label>
                        <input 
                          required 
                          type="email" 
                          placeholder="student@example.com"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50" 
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                          disabled={!!student?.email}
                        />
                     </div>
                     {!student?.email && (
                       <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Temporary Password</label>
                          <div className="relative">
                            <input 
                              required 
                              type={showPass ? "text" : "password"}
                              placeholder="Min 6 characters"
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:ring-1 focus:ring-amber-500 pr-10" 
                              value={studentPassword}
                              onChange={e => setStudentPassword(e.target.value)}
                            />
                            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                              {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                            </button>
                          </div>
                       </div>
                     )}
                  </div>
                  {!student?.email && (
                    <button 
                      type="button"
                      onClick={copyCreds}
                      className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                    >
                      {copied ? <><Check size={14} className="text-emerald-500" /> Copied!</> : <><Copy size={14} /> Copy Credentials for WhatsApp</>}
                    </button>
                  )}
                  {student?.email && (
                    <p className="text-[9px] text-slate-500 font-bold italic">
                      Student already has an account. To change password, go to their full profile.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Identity & Status</h3>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, status: 'active'})}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${formData.status === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, status: 'break'})}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${formData.status === 'break' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400'}`}
                  >
                    On Break
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">Full Name</label>
                  <input required type="text" className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-amber-500 transition-all" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">Collaborator / Source</label>
                  <select 
                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-700"
                    value={formData.collaboratorId}
                    onChange={e => setFormData({...formData, collaboratorId: e.target.value})}
                  >
                    <option value="">Direct / Self</option>
                    {collaborators.map(c => (
                      <option key={c.uid} value={c.uid}>{c.displayName || c.email}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">WhatsApp</label>
                  <input type="tel" className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-amber-500 transition-all" value={formData.whatsappNumber} onChange={e => setFormData({...formData, whatsappNumber: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">Joining Date</label>
                  <input required type="date" className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-amber-500 transition-all" value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} />
                </div>
              </div>
              {/* Meeting Link Field */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1 flex items-center gap-2">
                  <Video size={12} className="text-amber-500" /> Virtual Classroom (Meeting Link)
                </label>
                <input 
                  type="url" 
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-amber-500 transition-all font-bold text-slate-600" 
                  value={formData.meetingLink} 
                  onChange={e => setFormData({...formData, meetingLink: e.target.value})} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">Target Course</label>
                <select className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold" value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})}>
                  {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">Skill Level</label>
                <select className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value, currentTopicIndex: 0})}>
                  {LEVEL_TOPICS.map(lt => <option key={lt.level} value={lt.level}>{lt.level}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <CreditCard size={14} className="text-amber-500"/> Financial Configuration
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">Fee Amount ($)</label>
                  <input 
                    required 
                    type="number" 
                    className="w-full px-5 py-3 rounded-2xl bg-amber-50/30 border border-amber-100 focus:ring-2 focus:ring-amber-500 font-bold text-slate-700 outline-none transition-all" 
                    value={formData.billing?.feeAmount} 
                    onChange={e => updateBilling('feeAmount', Number(e.target.value))} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">Classes / Cycle</label>
                  <input 
                    required 
                    type="number" 
                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-amber-500 font-bold text-slate-700 outline-none transition-all" 
                    value={formData.billing?.totalClassesAllowed} 
                    onChange={e => updateBilling('totalClassesAllowed', Number(e.target.value))} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">Fee Status</label>
                  <select 
                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500" 
                    value={formData.billing?.feeStatus} 
                    onChange={e => updateBilling('feeStatus', e.target.value)}
                  >
                    <option value="paid">Paid</option>
                    <option value="due">Due</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Schedule Slots</h3>
                <button type="button" onClick={addSlot} className="text-[10px] font-black text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">Add Slot</button>
              </div>
              <div className="space-y-4">
                {isSchedulesLoading ? (
                  <div className="py-10 text-center bg-slate-50 rounded-3xl animate-pulse">Loading Slots...</div>
                ) : initialSchedules.map((slot, idx) => (
                  <div key={slot.id} className="p-5 rounded-[2rem] bg-slate-900 text-white space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Slot #{idx + 1}</span>
                      <button type="button" onClick={() => removeSlot(slot.id)} className="text-red-400"><Trash2 size={16} /></button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {DAYS_OF_WEEK.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(slot.id, day.value)}
                          className={`w-8 h-8 rounded-lg font-black text-[10px] border ${
                            slot.days.includes(day.value) ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white/5 border-white/10 text-slate-500'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="time" className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-bold" value={slot.startTime} onChange={e => updateTime(slot.id, 'startTime', e.target.value)} />
                      <input type="time" className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-bold" value={slot.endTime} onChange={e => updateTime(slot.id, 'endTime', e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
            <button type="button" onClick={onClose} className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px]">Cancel</button>
            <button type="submit" className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px]">Save Record</button>
          </div>
        </form>
      </div>
    </div>
  );
};
