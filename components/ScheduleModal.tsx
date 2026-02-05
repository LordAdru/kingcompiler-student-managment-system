
import React, { useState } from 'react';
import { ClassSchedule, Student } from '../types';
import { X, Clock, Calendar, Save, Power, Users } from 'lucide-react';

interface ScheduleModalProps {
  student?: Student;
  groupId?: string;
  groupName?: string;
  schedule?: ClassSchedule | null;
  onClose: () => void;
  onSave: (schedule: ClassSchedule) => void;
}

const DAYS_OF_WEEK = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

export const ScheduleModal: React.FC<ScheduleModalProps> = ({ student, groupId, groupName, schedule, onClose, onSave }) => {
  const [formData, setFormData] = useState<ClassSchedule>(schedule || {
    id: Math.random().toString(36).substr(2, 9),
    studentId: student?.id || null,
    studentName: student?.fullName || null,
    groupId: groupId || null,
    groupName: groupName || null,
    days: [1, 3], // Mon, Wed default
    startTime: '10:00',
    endTime: '11:00',
    startDate: new Date().toISOString().split('T')[0],
    active: true
  });

  const toggleDay = (dayValue: number) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(dayValue) 
        ? prev.days.filter(d => d !== dayValue)
        : [...prev.days, dayValue].sort()
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.days.length === 0) {
      alert("Please select at least one day.");
      return;
    }
    onSave(formData);
  };

  const targetName = groupName || student?.fullName;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <form onSubmit={handleSubmit}>
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="text-2xl font-black text-slate-800">
                {schedule ? 'Edit Schedule' : 'New Schedule Slot'}
              </h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-2">
                {groupId ? <Users size={12}/> : null} {targetName}
              </p>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all shadow-sm">
              <X size={24} className="text-slate-400" />
            </button>
          </div>

          <div className="p-8 space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Recurrence Days</label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`w-12 h-12 rounded-2xl font-black text-sm transition-all border-2 ${
                      formData.days.includes(day.value)
                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20'
                        : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {day.label.charAt(0)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Start Time</label>
                <div className="relative">
                  <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="time" 
                    required 
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold text-slate-700"
                    value={formData.startTime}
                    onChange={e => setFormData({...formData, startTime: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">End Time</label>
                <div className="relative">
                  <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="time" 
                    required 
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold text-slate-700"
                    value={formData.endTime}
                    onChange={e => setFormData({...formData, endTime: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Effective Date</label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="date" 
                    required 
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold text-slate-700"
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Status</label>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, active: !formData.active})}
                  className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border-2 ${
                    formData.active 
                      ? 'bg-green-50 text-green-700 border-green-100' 
                      : 'bg-slate-50 text-slate-400 border-slate-100'
                  }`}
                >
                  <Power size={18} />
                  {formData.active ? 'ACTIVE' : 'PAUSED'}
                </button>
              </div>
            </div>
          </div>

          <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-black text-slate-400 hover:text-slate-600 uppercase text-xs tracking-widest">Cancel</button>
            <button type="submit" className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] uppercase text-xs tracking-widest">
              <Save size={18} /> Commit Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
