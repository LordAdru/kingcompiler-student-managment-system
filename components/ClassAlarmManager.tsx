
import React, { useState, useEffect, useCallback } from 'react';
import { dbService } from '../services/db';
import { academyLogic } from '../services/logic';
import { ClassSession } from '../types';
import { Bell, Clock, X, ExternalLink } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';

export const ClassAlarmManager: React.FC = () => {
  const [activeAlarm, setActiveAlarm] = useState<ClassSession | null>(null);
  const [dismissedSessionIds, setDismissedSessionIds] = useState<Set<string>>(new Set());

  const checkSchedules = useCallback(async () => {
    const sessions = await dbService.getSessions();
    const now = new Date();
    
    const upcomingAlarm = sessions.find(session => {
      if (session.status !== 'upcoming' || dismissedSessionIds.has(session.id)) return false;
      
      const sessionStart = new Date(session.start);
      const diff = differenceInMinutes(sessionStart, now);
      
      // Trigger alarm if session starts in exactly 10 minutes (or 9-10 window)
      return diff === 10 || diff === 9;
    });

    if (upcomingAlarm && !activeAlarm) {
      setActiveAlarm(upcomingAlarm);
      academyLogic.playAcademyChime();
    }
  }, [dismissedSessionIds, activeAlarm]);

  useEffect(() => {
    checkSchedules();
    const interval = setInterval(checkSchedules, 45000);
    return () => clearInterval(interval);
  }, [checkSchedules]);

  const dismissAlarm = () => {
    if (activeAlarm) {
      setDismissedSessionIds(prev => new Set(prev).add(activeAlarm.id));
      setActiveAlarm(null);
    }
  };

  if (!activeAlarm) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-right-10 duration-500">
      <div className="bg-slate-900 border border-white/10 p-6 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-80 relative overflow-hidden ring-4 ring-amber-500/20">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl animate-pulse"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-900 shadow-lg shadow-amber-500/20 animate-bounce">
                <Bell size={20} />
              </div>
              <div>
                <h4 className="text-white font-black text-xs uppercase tracking-widest leading-none">Class Reminder</h4>
                <p className="text-amber-500 font-bold text-[9px] uppercase tracking-widest mt-1">Starting in 10 min</p>
              </div>
            </div>
            <button 
              onClick={dismissAlarm}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
              <p className="text-white font-black text-sm tracking-tight mb-1 truncate">
                {activeAlarm.groupId ? activeAlarm.groupName : activeAlarm.studentName}
              </p>
              <div className="flex items-center gap-2 text-slate-400">
                <Clock size={12} />
                <p className="text-[10px] font-bold uppercase tracking-widest">
                  {format(new Date(activeAlarm.start), 'HH:mm')} Sharp
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={dismissAlarm}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border border-white/10"
              >
                Dismiss
              </button>
              <button 
                onClick={dismissAlarm}
                className="flex-[2] py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                Acknowledge <ExternalLink size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
