
import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../services/db';
import { GroupBatch, Student, ClassSchedule } from '../types';
import { Plus, Users, Trash2, Edit2, Search, X, Clock, Calendar, Check } from 'lucide-react';
import { COURSES, LEVEL_TOPICS } from '../constants';
import { ScheduleModal } from './ScheduleModal';

export const GroupBatchManager: React.FC = () => {
  const [groups, setGroups] = useState<GroupBatch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupBatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroupForSchedule, setSelectedGroupForSchedule] = useState<GroupBatch | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    const [gData, sData] = await Promise.all([
      dbService.getGroups(),
      dbService.getStudents()
    ]);
    setGroups(gData);
    setStudents(sData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Delete this batch? Students will remain in directory but group schedules will be lost.')) {
      await dbService.deleteGroup(id);
      await fetchData();
    }
  };

  const handleSaveGroup = async (group: GroupBatch) => {
    await dbService.saveGroup(group);
    await fetchData();
    setIsModalOpen(false);
    setEditingGroup(null);
  };

  const handleSaveSchedule = async (schedule: ClassSchedule) => {
    await dbService.saveSchedule(schedule);
    setSelectedGroupForSchedule(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Group Batches</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Manage multi-student classes</p>
        </div>
        <button 
          onClick={() => { setEditingGroup(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg"
        >
          <Plus size={20} />
          Create New Batch
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading batches...</p>
          </div>
        ) : groups.map((group) => (
          <div key={group.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:border-amber-200 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -translate-y-8 translate-x-8 group-hover:bg-amber-50 transition-colors"></div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-slate-800 leading-tight">{group.name}</h3>
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-1">{group.level} • {group.course}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingGroup(group); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-amber-50 transition-all"><Edit2 size={16}/></button>
                  <button onClick={() => handleDelete(group.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"><Trash2 size={16}/></button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrolled Students ({group.studentIds.length})</p>
                <div className="flex flex-wrap gap-2">
                  {group.studentIds.map(sid => {
                    const student = students.find(s => s.id === sid);
                    return student ? (
                      <span key={sid} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600">
                        {student.fullName}
                      </span>
                    ) : null;
                  })}
                  {group.studentIds.length === 0 && <p className="text-xs text-slate-400 italic">No students assigned</p>}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 flex gap-3">
                <button 
                  onClick={() => setSelectedGroupForSchedule(group)}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
                >
                  <Calendar size={14} /> Schedule
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <GroupModal 
          group={editingGroup} 
          students={students}
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveGroup} 
        />
      )}

      {selectedGroupForSchedule && (
        <ScheduleModal 
          groupId={selectedGroupForSchedule.id}
          groupName={selectedGroupForSchedule.name}
          onClose={() => setSelectedGroupForSchedule(null)}
          onSave={handleSaveSchedule}
        />
      )}
    </div>
  );
};

const GroupModal: React.FC<{ group: GroupBatch | null, students: Student[], onClose: () => void, onSave: (g: GroupBatch) => void }> = ({ group, students, onClose, onSave }) => {
  const [formData, setFormData] = useState<GroupBatch>(group || {
    id: Math.random().toString(36).substr(2, 9),
    name: '',
    course: COURSES[0],
    level: LEVEL_TOPICS[0].level,
    studentIds: [],
    active: true
  });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = useMemo(() => {
    return students.filter(s => s.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [students, searchTerm]);

  const toggleStudent = (id: string) => {
    setFormData(prev => ({
      ...prev,
      studentIds: prev.studentIds.includes(id) 
        ? prev.studentIds.filter(sid => sid !== id)
        : [...prev.studentIds, id]
    }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <div>
            <h2 className="text-2xl font-black text-slate-800">{group ? 'Edit Batch' : 'New Batch'}</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Configure group settings</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">General Info</h3>
            <div>
              <label className="text-[10px] font-bold text-slate-500 mb-2 block">Batch Name</label>
              <input 
                className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Saturday Night Blitz"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 mb-2 block">Course</label>
                <select className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold" value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})}>
                  {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 mb-2 block">Level</label>
                <select className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})}>
                  {LEVEL_TOPICS.map(lt => <option key={lt.level} value={lt.level}>{lt.level}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Add Students ({formData.studentIds.length})</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none focus:ring-1 focus:ring-amber-500" 
                  placeholder="Search directory..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto p-2 border border-slate-50 rounded-2xl bg-slate-50/30">
              {filteredStudents.map(s => {
                const isSelected = formData.studentIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleStudent(s.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between group ${
                      isSelected ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div>
                      <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-700'}`}>{s.fullName}</p>
                      <p className={`text-[9px] uppercase tracking-tighter ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>{s.level}</p>
                    </div>
                    {isSelected && <Check size={14} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-3 font-bold text-slate-400 uppercase text-xs tracking-widest">Discard</button>
          <button onClick={() => onSave(formData)} className="bg-slate-900 hover:bg-slate-800 text-white px-10 py-4 rounded-2xl font-black shadow-xl uppercase text-xs tracking-widest">Save Batch</button>
        </div>
      </div>
    </div>
  );
};
