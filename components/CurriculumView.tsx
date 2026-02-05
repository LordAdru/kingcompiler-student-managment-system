
import React, { useState } from 'react';
import { LEVEL_TOPICS } from '../constants';
import { BookOpen, ChevronRight, GraduationCap, Award, Zap, Shield, Target, Trophy, Star } from 'lucide-react';

const LEVEL_ICONS: Record<string, any> = {
  'Beginner': GraduationCap,
  'Foundation 1': Shield,
  'Foundation 2': Award,
  'Foundation 3': Star,
  'Intermediate': Zap,
  'Advance': Target,
  'Advance 2': Trophy
};

export const CurriculumView: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState(LEVEL_TOPICS[0].level);

  const currentLevelData = LEVEL_TOPICS.find(l => l.level === selectedLevel);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
      {/* Header Section - Refined for better spacing and to prevent squashing */}
      <div className="bg-slate-900 rounded-[2.5rem] py-12 px-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20 min-h-[180px] flex items-center">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] translate-x-20 -translate-y-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 w-full">
          <div>
            <h2 className="text-4xl font-black tracking-tight mb-3">Curriculum Master</h2>
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-amber-500/50"></div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Academy Syllabus v2.5 • Professional Tier</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/5 border border-white/10 px-8 py-4 rounded-[1.5rem] backdrop-blur-md">
              <p className="text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Total Levels</p>
              <p className="text-2xl font-black text-amber-500">{LEVEL_TOPICS.length}</p>
            </div>
            <div className="bg-white/5 border border-white/10 px-8 py-4 rounded-[1.5rem] backdrop-blur-md">
              <p className="text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Total Lessons</p>
              <p className="text-2xl font-black text-amber-500">
                {LEVEL_TOPICS.reduce((acc, l) => acc + l.topics.length, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Level Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-4">Select Tier</h3>
          <div className="sticky top-24 space-y-3">
            {LEVEL_TOPICS.map((level) => {
              const Icon = LEVEL_ICONS[level.level] || BookOpen;
              const isActive = selectedLevel === level.level;
              return (
                <button
                  key={level.level}
                  onClick={() => setSelectedLevel(level.level)}
                  className={`w-full group flex items-center justify-between p-5 rounded-3xl border transition-all ${
                    isActive 
                      ? 'bg-white border-amber-300 shadow-xl shadow-amber-500/5 ring-4 ring-amber-500/5' 
                      : 'bg-white border-slate-100 hover:border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl transition-all ${
                      isActive ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
                    }`}>
                      <Icon size={20} />
                    </div>
                    <div className="text-left">
                      <p className={`font-black text-sm ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                        {level.level}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-tight opacity-60">
                        {level.topics.length} Lessons
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className={`transition-transform ${isActive ? 'translate-x-1 text-amber-500' : 'opacity-0'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Syllabus Display */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
            <div className="p-10 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{selectedLevel} Syllabus</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Sequential Learning Path</p>
              </div>
              <div className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                selectedLevel.includes('Advance') ? 'bg-purple-100 text-purple-700 border border-purple-200' : 
                selectedLevel.includes('Foundation') ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}>
                {selectedLevel.includes('Advance') ? 'Elite Tier' : 'Foundation Tier'}
              </div>
            </div>

            <div className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentLevelData?.topics.map((topic, index) => (
                  <div 
                    key={index} 
                    className="group p-6 rounded-2xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-xs text-slate-400 group-hover:bg-white group-hover:text-amber-600 transition-all shadow-sm">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1 min-w-0 pt-2">
                      <p className="font-bold text-slate-700 leading-tight group-hover:text-slate-900 transition-colors">
                        {topic}
                      </p>
                    </div>
                  </div>
                ))}
                {(!currentLevelData || currentLevelData.topics.length === 0) && (
                  <div className="col-span-2 py-32 text-center">
                    <BookOpen size={64} className="mx-auto text-slate-100 mb-6" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No topics mapped for this level yet.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-auto p-10 bg-slate-50 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                <Shield size={14} className="text-amber-500" /> KingCompiler Curriculum Assurance • Version 2025.04
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
