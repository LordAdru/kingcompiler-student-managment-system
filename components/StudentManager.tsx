
import React, { useState, useMemo, useEffect } from 'react';
import { dbService } from '../services/db';
import { authService } from '../services/auth';
import { Student, ClassSchedule, AppUser, StudentStatus, CourseEnrollment } from '../types';
import { 
  Search, 
  Trash2, 
  UserPlus, 
  Eye, 
  Edit2, 
  Clock, 
  X, 
  Share2, 
  CreditCard, 
  Moon, 
  UserCheck, 
  Users as UsersIcon, 
  Key, 
  ShieldCheck, 
  Check, 
  GraduationCap,
  Plus,
  Layers,
  Sparkles,
  History,
  Copy,
  CheckCircle2,
  EyeOff
} from 'lucide-react';
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
  const [createdCreds, setCreatedCreds] = useState<{ email: string, pass: string, name: string } | null>(null);

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
    if (authConfig?.email) {
      student.email = authConfig.email.toLowerCase();
    }

    await dbService.saveStudent(student);
    
    for (const id of deletedScheduleIds) {
      await dbService.deleteSchedule(id);
    }

    for (const sch of schedules) {
      const schedule: ClassSchedule = {
        id: sch.id,
        studentId: student.id,
        studentName: student.fullName,
        collaboratorId: student.collaboratorId,
        course: sch.course,
        days: sch.days,
        startTime: sch.startTime,
        endTime: sch.endTime,
        startDate: student.joiningDate,
        active: sch.active ?? true
      };
      await dbService.saveSchedule(schedule);
    }

    if (authConfig) {
      try {
        await authService.adminCreateUserAccount(
          authConfig.email, 
          authConfig.pass, 
          student.fullName, 
          'student', 
          student.id
        );
        setCreatedCreds({ email: authConfig.email, pass: authConfig.pass, name: student.fullName });
      } catch (err: any) {
        if (!err.message.includes('already registered')) {
          console.error("Failed to create student auth:", err);
          alert("Portal activation issue: " + err.message);
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
        <TabButton active={activeTab === 'active'} onClick={() => setActiveTab('active')} label="Active" count={counts.active} icon={UserCheck} />
        <TabButton active={activeTab === 'break'} onClick={() => setActiveTab('break')} label="On Break" count={counts.break} icon={Moon} />
        <TabButton active={activeTab === 'all'} onClick={() => setActiveTab('all')} label="All Directory" count={counts.all} icon={UsersIcon} />
      </div>

      <div className="hidden lg:block bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <LoadingState />
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Info</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Tracks</th>
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
        {isLoading ? <LoadingState /> : filteredStudents.map(s => (
          <StudentCard key={s.id} student={s} onSelect={onSelectStudent} onEdit={(s) => { setEditingStudent(s); setIsModalOpen(true); }} onDelete={handleDelete} />
        ))}
      </div>

      {isModalOpen && (
        <StudentModal 
          student={editingStudent} 
          collaborators={collaborators}
          onClose={() => { setIsModalOpen(false); setEditingStudent(null); }} 
          onSave={handleSave} 
        />
      )}

      {createdCreds && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 bg-slate-900 text-white flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                <ShieldCheck size={32} />
              </div>
              <h2 className="text-2xl font-black">Student Portal Active</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Secure access established for {createdCreds.name}</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Access Email</p>
                    <p className="font-bold text-slate-800">{createdCreds.email}</p>
                  </div>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(createdCreds.email); alert('Email copied!'); }}
                    className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                  >
                    <Copy size={18} />
                  </button>
                </div>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Security Key</p>
                    <p className="font-bold text-slate-800">{createdCreds.pass}</p>
                  </div>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(createdCreds.pass); alert('Password copied!'); }}
                    className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                  >
                    <Copy size={18} />
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setCreatedCreds(null)}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
              >
                Close & Finish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TabButton = ({ active, onClick, label, count, icon: Icon }: any) => (
  <button onClick={onClick} className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 shrink-0 ${active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
    <Icon size={14} className={active ? 'text-amber-500' : ''} />
    {label}
    <span className={`px-2 py-0.5 rounded-md text-[8px] ${active ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>{count}</span>
  </button>
);

const LoadingState = () => (
  <div className="p-20 text-center">
    <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Syncing Records...</p>
  </div>
);

const EmptyState = ({ tab }: { tab: string }) => (
  <div className="p-24 text-center">
    <div className="bg-slate-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-200"><UsersIcon size={40} /></div>
    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No students found</p>
  </div>
);

const StudentTableRow = ({ student, collaboratorName, onSelect, onEdit, onDelete }: any) => (
  <tr className={`hover:bg-slate-50/50 transition-colors group ${student.status === 'break' ? 'bg-slate-50/20' : ''}`}>
    <td className="px-8 py-6">
      <div className="flex items-center gap-5">
        <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center font-black transition-all ${student.status === 'break' ? 'bg-slate-200 text-slate-400' : 'bg-white border border-slate-100 text-slate-400 group-hover:bg-amber-100 group-hover:text-amber-600 shadow-sm'}`}>
          {student.status === 'break' ? <Moon size={20} /> : student.fullName.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-black text-slate-800 leading-tight">{student.fullName}</p>
            {student.status === 'break' && <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1"><Moon size={8} /> Break</span>}
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Age: {student.age} • Since {student.joiningDate}</p>
        </div>
      </div>
    </td>
    <td className="px-8 py-6">
      <div className="flex flex-wrap gap-2">
        {student.enrollments?.map((e: CourseEnrollment, i: number) => (
          <span key={i} className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase border border-amber-100">{e.course}</span>
        ))}
      </div>
    </td>
    <td className="px-8 py-6">
      <div className="flex items-center gap-2">
        <Share2 size={12} className="text-slate-300" />
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{collaboratorName}</p>
      </div>
    </td>
    <td className="px-8 py-6">
      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${student.billing.feeStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{student.billing.feeStatus}</span>
    </td>
    <td className="px-8 py-6 text-right">
      <div className="flex items-center justify-end gap-2">
        <button onClick={() => onSelect(student.id)} className="p-2 text-slate-400 hover:text-slate-900"><Eye size={18} /></button>
        <button onClick={() => onEdit(student)} className="p-2 text-slate-400 hover:text-amber-600"><Edit2 size={18} /></button>
        <button onClick={() => onDelete(student.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={18} /></button>
      </div>
    </td>
  </tr>
);

const StudentCard = ({ student, onSelect, onEdit, onDelete }: any) => (
  <div className={`bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6 ${student.status === 'break' ? 'opacity-70' : ''}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black ${student.status === 'break' ? 'bg-slate-200 text-slate-400' : 'bg-amber-500 text-white'}`}>
          {student.status === 'break' ? <Moon size={24} /> : student.fullName.charAt(0)}
        </div>
        <div>
          <p className="font-black text-slate-900 text-lg leading-tight">{student.fullName}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {student.enrollments?.map((e: any, i: number) => <span key={i} className="text-[8px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 uppercase">{e.course}</span>)}
          </div>
        </div>
      </div>
      <div className="flex gap-1">
        <button onClick={() => onEdit(student)} className="p-2 text-slate-400"><Edit2 size={18} /></button>
        <button onClick={() => onDelete(student.id)} className="p-2 text-slate-400"><Trash2 size={18} /></button>
      </div>
    </div>
    <button onClick={() => onSelect(student.id)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all">Profile</button>
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
    collaboratorId: '',
    status: 'active',
    joiningDate: new Date().toISOString().split('T')[0],
    enrollments: [{
      course: COURSES[0],
      level: LEVEL_TOPICS[0].level,
      currentTopicIndex: 0,
      assignedTopics: LEVEL_TOPICS[0].topics
    }],
    billing: {
      type: 'monthly',
      feeAmount: 500,
      totalClassesAllowed: 8,
      classesAttended: 0,
      feeStatus: 'paid'
    }
  });

  const [initialSchedules, setInitialSchedules] = useState<Array<{
    id: string;
    course: string;
    days: number[];
    startTime: string;
    endTime: string;
    active?: boolean;
  }>>(student ? [] : [{
    id: Math.random().toString(36).substr(2, 9),
    course: COURSES[0],
    days: [1],
    startTime: '10:00',
    endTime: '11:00',
    active: true
  }]);

  const [deletedScheduleIds, setDeletedScheduleIds] = useState<string[]>([]);
  const [enableAccess, setEnableAccess] = useState(false);
  const [studentPassword, setStudentPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (student) {
      dbService.getSchedules(student.id).then(data => {
        setInitialSchedules(data.map(d => ({
          id: d.id,
          course: d.course || (student.enrollments?.[0]?.course || COURSES[0]),
          days: d.days,
          startTime: d.startTime,
          endTime: d.endTime,
          active: d.active
        })));
      });
    }
  }, [student]);

  const addEnrollment = () => {
    const newEnrollment: CourseEnrollment = {
      course: COURSES[0],
      level: LEVEL_TOPICS[0].level,
      currentTopicIndex: 0,
      assignedTopics: LEVEL_TOPICS[0].topics
    };
    setFormData(prev => ({ ...prev, enrollments: [...(prev.enrollments || []), newEnrollment] }));
  };

  const removeEnrollment = (index: number) => {
    if ((formData.enrollments?.length || 0) <= 1) return;
    setFormData(prev => ({ ...prev, enrollments: prev.enrollments?.filter((_, i) => i !== index) }));
  };

  const updateEnrollment = (index: number, field: keyof CourseEnrollment, value: any) => {
    setFormData(prev => {
      const updated = [...(prev.enrollments || [])];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'level') {
        updated[index].assignedTopics = LEVEL_TOPICS.find(lt => lt.level === value)?.topics || [];
        updated[index].currentTopicIndex = 0;
      }
      return { ...prev, enrollments: updated };
    });
  };

  const addSlot = () => {
    setInitialSchedules(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      course: formData.enrollments?.[0]?.course || COURSES[0],
      days: [],
      startTime: '10:00',
      endTime: '11:00',
      active: true
    }]);
  };

  const removeSlot = (id: string) => {
    if (initialSchedules.length <= 1) return;
    if (student) setDeletedScheduleIds(prev => [...prev, id]);
    setInitialSchedules(prev => prev.filter(s => s.id !== id));
  };

  const toggleDay = (slotId: string, dayValue: number) => {
    setInitialSchedules(prev => prev.map(s => {
      if (s.id !== slotId) return s;
      return { ...s, days: s.days.includes(dayValue) ? s.days.filter(d => d !== dayValue) : [...s.days, dayValue].sort() };
    }));
  };

  const updateSchedule = (slotId: string, field: string, value: any) => {
    setInitialSchedules(prev => prev.map(s => s.id === slotId ? { ...s, [field]: value } : s));
  };

  const updateBilling = (field: keyof Student['billing'], value: any) => {
    setFormData(prev => ({ ...prev, billing: { ...(prev.billing as any), [field]: value } }));
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.enrollments?.length === 0) return alert("Select at least one track.");
    onSave(formData as Student, initialSchedules, deletedScheduleIds, enableAccess ? { email: formData.email!, pass: studentPassword } : undefined);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[95vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
            <div><h2 className="text-2xl font-black text-slate-800">{student ? 'Update Portfolio' : 'New Enrollment'}</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Multi-Disciplinary Records</p></div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
          </div>

          <div className="flex-1 p-8 space-y-10 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2"><Sparkles size={14} className="text-amber-500" /> Identity Info</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input required type="text" placeholder="Full Name" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:ring-4 focus:ring-amber-500/10 outline-none" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                <select className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:ring-4 focus:ring-amber-500/10 outline-none" value={formData.collaboratorId} onChange={e => setFormData({...formData, collaboratorId: e.target.value})}>
                  <option value="">Direct / Academy Self</option>
                  {collaborators.map(c => <option key={c.uid} value={c.uid}>{c.displayName || c.email}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="tel" placeholder="WhatsApp Contact" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:ring-4 focus:ring-amber-500/10 outline-none" value={formData.whatsappNumber} onChange={e => setFormData({...formData, whatsappNumber: e.target.value})} />
                <input required type="date" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:ring-4 focus:ring-amber-500/10 outline-none" value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2"><GraduationCap size={16} className="text-amber-500" /> Academic Tracks</h3>
                <button type="button" onClick={addEnrollment} className="flex items-center gap-2 bg-amber-500 text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-amber-500/20 active:scale-95 transition-all"><Plus size={14} /> Add Another Course</button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {formData.enrollments?.map((enrollment, idx) => (
                  <div key={idx} className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-4 relative group">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Track #{idx + 1}</p>
                      {formData.enrollments!.length > 1 && <button type="button" onClick={() => removeEnrollment(idx)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <select className="w-full px-5 py-3 rounded-xl bg-white border border-slate-200 font-black text-xs text-slate-700 outline-none focus:border-amber-500" value={enrollment.course} onChange={e => updateEnrollment(idx, 'course', e.target.value)}>
                        {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <select className="w-full px-5 py-3 rounded-xl bg-white border border-slate-200 font-black text-xs text-slate-700 outline-none focus:border-amber-500" value={enrollment.level} onChange={e => updateEnrollment(idx, 'level', e.target.value)}>
                        {LEVEL_TOPICS.map(lt => <option key={lt.level} value={lt.level}>{lt.level}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2"><Clock size={16} className="text-amber-500" /> Scheduling</h3>
                <button type="button" onClick={addSlot} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all">+ Add Time Slot</button>
              </div>
              <div className="space-y-4">
                {initialSchedules.map((slot) => (
                  <div key={slot.id} className="p-6 rounded-[2.5rem] bg-slate-900 text-white space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <select className="bg-transparent text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 outline-none" value={slot.course} onChange={e => updateSchedule(slot.id, 'course', e.target.value)}>
                        {formData.enrollments?.map(e => <option key={e.course} value={e.course} className="bg-slate-900">{e.course}</option>)}
                      </select>
                      <button type="button" onClick={() => removeSlot(slot.id)} className="text-red-400/60 hover:text-red-400"><Trash2 size={16} /></button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <button key={day.value} type="button" onClick={() => toggleDay(slot.id, day.value)} className={`w-9 h-9 rounded-xl font-black text-[10px] border transition-all ${slot.days.includes(day.value) ? 'bg-amber-500 border-amber-500 text-slate-900 shadow-lg shadow-amber-500/20' : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/30'}`}>{day.label}</button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="time" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold outline-none focus:border-amber-500" value={slot.startTime} onChange={e => updateSchedule(slot.id, 'startTime', e.target.value)} />
                      <input type="time" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold outline-none focus:border-amber-500" value={slot.endTime} onChange={e => updateSchedule(slot.id, 'endTime', e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-amber-50 border-2 border-amber-100 space-y-6">
              <h3 className="text-[10px] font-black text-amber-800 uppercase tracking-[0.2em] flex items-center gap-2"><CreditCard size={16} /> Financial Sync</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-amber-700/60 uppercase px-1">Cycle Fee Amount</label><input type="number" className="w-full px-5 py-3 rounded-xl bg-white border border-amber-200 font-black text-sm text-slate-700 outline-none" value={formData.billing?.feeAmount} onChange={e => updateBilling('feeAmount', Number(e.target.value))} /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-amber-700/60 uppercase px-1">Fee Status</label><select className="w-full px-5 py-3 rounded-xl bg-white border border-amber-200 font-black text-sm text-slate-700 outline-none" value={formData.billing?.feeStatus} onChange={e => updateBilling('feeStatus', e.target.value)}><option value="paid">PAID</option><option value="due">DUE</option></select></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-amber-700/60 uppercase px-1 flex items-center gap-2">Total Classes Allowed</label><input type="number" className="w-full px-5 py-3 rounded-xl bg-white border border-amber-200 font-black text-sm text-slate-700 outline-none" value={formData.billing?.totalClassesAllowed} onChange={e => updateBilling('totalClassesAllowed', Number(e.target.value))} /></div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-amber-700/60 uppercase px-1 flex items-center gap-2"><History size={12} /> Classes Used (Manual Adjust)</label>
                  <input type="number" className="w-full px-5 py-3 rounded-xl bg-white border border-amber-200 font-black text-sm text-slate-700 outline-none" value={formData.billing?.classesAttended} onChange={e => updateBilling('classesAttended', Number(e.target.value))} />
                  <p className="text-[8px] font-bold text-amber-600/60 uppercase px-1">Modify this if attendance was missed.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1"><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Key size={16} className="text-blue-500" /> Digital Identity</h3>{!student?.email && <button type="button" onClick={() => setEnableAccess(!enableAccess)} className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border transition-all ${enableAccess ? 'bg-blue-500 text-white border-blue-500 shadow-lg' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{enableAccess ? 'Portal Enabled' : 'Enable Portal Access'}</button>}</div>
              {(enableAccess || student?.email) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-4">
                  <div className="relative group">
                    <input 
                      type="email" 
                      placeholder="Access Email" 
                      className="w-full px-6 py-4 pr-12 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:ring-4 focus:ring-blue-500/10 outline-none" 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      disabled={!!student?.email} 
                    />
                    <button 
                      type="button"
                      onClick={() => copyToClipboard(formData.email || '', 'Email')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-500 transition-colors"
                      title="Copy Email"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                  {!student?.email && (
                    <div className="relative group">
                      <input 
                        type={showPass ? "text" : "password"} 
                        placeholder="Access Key (Min 6)" 
                        className="w-full px-6 py-4 pr-20 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:ring-4 focus:ring-blue-500/10 outline-none" 
                        value={studentPassword} 
                        onChange={e => setStudentPassword(e.target.value)} 
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button 
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="p-2 text-slate-400 hover:text-slate-600"
                        >
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button 
                          type="button"
                          onClick={() => copyToClipboard(studentPassword, 'Password')}
                          className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                          title="Copy Password"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4 shrink-0">
            <button type="button" onClick={onClose} className="px-6 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">Discard</button>
            <button type="submit" className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-slate-900/20 active:scale-[0.98] transition-all">Secure Finalize</button>
          </div>
        </form>
      </div>
    </div>
  );
};
