
import React, { useState, useMemo, useEffect } from 'react';
import { dbService } from '../services/db';
import { Student, ClassSchedule, BillingType, FeeStatus, AppUser } from '../types';
import { Plus, Search, Trash2, UserPlus, Eye, Edit2, Clock, Calendar, X, ListOrdered, Phone, Share2, CreditCard } from 'lucide-react';
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

export const StudentManager: React.FC<StudentManagerProps> = ({ onSelectStudent }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [collaborators, setCollaborators] = useState<AppUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.whatsappNumber && s.whatsappNumber.includes(searchTerm))
    );
  }, [students, searchTerm]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure? This will delete the student and all their schedules.')) {
      await dbService.deleteStudent(id);
      await fetchData();
    }
  };

  const handleSave = async (student: Student, schedules: any[], deletedScheduleIds: string[]) => {
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
        days: sch.days,
        startTime: sch.startTime,
        endTime: sch.endTime,
        startDate: student.joiningDate,
        active: sch.active ?? true
      };
      await dbService.saveSchedule(schedule);
    }

    await fetchData();
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search directory..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { setEditingStudent(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-lg text-sm"
        >
          <UserPlus size={18} />
          Enroll Student
        </button>
      </div>

      <div className="hidden lg:block bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <LoadingState />
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Info</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrollment</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Partner/Source</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
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
              {filteredStudents.length === 0 && <EmptyState />}
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
            {filteredStudents.length === 0 && <EmptyState />}
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

const LoadingState = () => (
  <div className="p-20 text-center">
    <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading records...</p>
  </div>
);

const EmptyState = () => (
  <div className="p-20 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
    No records found.
  </div>
);

const StudentTableRow = ({ student, collaboratorName, onSelect, onEdit, onDelete }: any) => (
  <tr className="hover:bg-slate-50/50 transition-colors group">
    <td className="px-8 py-5">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
          {student.fullName.charAt(0)}
        </div>
        <div>
          <p className="font-bold text-slate-800 leading-tight">{student.fullName}</p>
          <p className="text-xs text-slate-500 mt-1">Age: {student.age} • Joined {student.joiningDate}</p>
        </div>
      </div>
    </td>
    <td className="px-8 py-5">
      <p className="text-sm font-bold text-slate-700">{student.course}</p>
      <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Lvl: {student.level}</p>
    </td>
    <td className="px-8 py-5">
      <div className="flex items-center gap-2">
        <Share2 size={12} className="text-slate-300" />
        <p className="text-xs font-bold text-slate-600">{collaboratorName}</p>
      </div>
    </td>
    <td className="px-8 py-5">
      <div className="flex items-center gap-3">
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
          student.billing.feeStatus === 'paid' ? 'bg-green-100 text-green-700' : 
          student.billing.feeStatus === 'due' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
        }`}>
          {student.billing.feeStatus}
        </span>
      </div>
    </td>
    <td className="px-8 py-5">
      <div className="flex items-center justify-end gap-2">
        <button onClick={() => onSelect(student.id)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Eye size={18} /></button>
        <button onClick={() => onEdit(student)} className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"><Edit2 size={18} /></button>
        <button onClick={() => onDelete(student.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
      </div>
    </td>
  </tr>
);

const StudentCard = ({ student, onSelect, onEdit, onDelete }: any) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center font-black text-white">
          {student.fullName.charAt(0)}
        </div>
        <div>
          <p className="font-bold text-slate-800 leading-tight">{student.fullName}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{student.level}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onEdit(student)} className="p-2 text-slate-400"><Edit2 size={18} /></button>
        <button onClick={() => onDelete(student.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
      </div>
    </div>
    <button 
      onClick={() => onSelect(student.id)}
      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
    >
      View Full Profile
    </button>
  </div>
);

const StudentModal: React.FC<{ 
  student: Student | null, 
  collaborators: AppUser[],
  onClose: () => void, 
  onSave: (s: Student, schedules: any[], deletedIds: string[]) => void 
}> = ({ student, collaborators, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Student>>(student || {
    id: Math.random().toString(36).substr(2, 9),
    fullName: '',
    age: 18,
    whatsappNumber: '',
    course: COURSES[0],
    level: LEVEL_TOPICS[0].level,
    collaboratorId: '',
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
    const finalStudent = {
      ...formData,
      assignedTopics: currentLevelTopics
    } as Student;
    onSave(finalStudent, initialSchedules, deletedScheduleIds);
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
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Identification</h3>
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
