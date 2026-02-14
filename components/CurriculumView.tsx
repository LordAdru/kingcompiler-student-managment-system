
import React, { useState, useMemo } from 'react';
import { LEVEL_TOPICS } from '../constants';
import { 
  BookOpen, 
  ChevronRight, 
  GraduationCap, 
  Award, 
  Zap, 
  Shield, 
  Target, 
  Trophy, 
  Star, 
  Code, 
  Layout, 
  MousePointer2, 
  Database, 
  Cpu, 
  Gamepad2, 
  Globe,
  Terminal
} from 'lucide-react';

const LEVEL_ICONS: Record<string, any> = {
  // Chess Icons
  'Beginner': GraduationCap,
  'Foundation 1': Shield,
  'Foundation 2': Award,
  'Foundation 3': Star,
  'Intermediate': Zap,
  'Advance': Target,
  'Advance 2': Trophy,
  
  // Coding Icons (mapped by keywords or full names)
  'Web Month 1: HTML Basics': Layout,
  'Web Month 2: HTML Forms': Terminal,
  'Web Month 3: CSS Basics': Layout,
  'Web Month 4: CSS Layouts': Globe,
  'Web Month 5: JS Intro': MousePointer2,
  'Web Month 6: JS Events': Zap,
  'Web Month 7: JS Games': Gamepad2,
  'Web Month 8: Logic Apps': Cpu,
  'Web Month 9: Advanced Logic': Terminal,
  'Web Month 10: Game Dev': Gamepad2,
  'Web Month 11: Site Building': Globe,
  'Web Month 12: Capstone': Award
};

export const CurriculumView: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState(LEVEL_TOPICS[0].level);

  const categories = useMemo(() => {
    const chess = LEVEL_TOPICS.filter(l => !l.level.toLowerCase().includes('web'));
    const coding = LEVEL_TOPICS.filter(l => l.level.toLowerCase().includes('web'));
    return { chess, coding };
  }, []);

  const currentLevelData = LEVEL_TOPICS.find(l => l.level === selectedLevel);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
      {/* Header Section */}
      <div className="bg-slate-900 rounded-[2.5rem] py-12 px-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20 min-h-[180px] flex items-center border border-white/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] translate-x-20 -translate-y-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 w-full">
          <div>
            <h2 className="text-4xl font-black tracking-tight mb-3">Curriculum Master</h2>
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-amber-500/50"></div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Multi-Disciplinary Syllabus v2.6</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/5 border border-white/10 px-8 py-4 rounded-[1.5rem] backdrop-blur-md">
              <p className="text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Disciplines</p>
              <p className="text-2xl font-black text-amber-500">2</p>
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
        {/* Sidebar with Two Sections */}
        <div className="lg:col-span-1 space-y-8">
          {/* Chess Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-4 mb-2">
              <Trophy size={14} className="text-amber-500" />
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Chess Masterclass</h3>
            </div>
            <div className="space-y-2">
              {categories.chess.map((level) => {
                const Icon = LEVEL_ICONS[level.level] || BookOpen;
                const isActive = selectedLevel === level.level;
                return (
                  <button
                    key={level.level}
                    onClick={() => setSelectedLevel(level.level)}
                    className={`w-full group flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      isActive 
                        ? 'bg-white border-amber-300 shadow-xl shadow-amber-500/5 ring-4 ring-amber-500/5' 
                        : 'bg-white border-slate-100 hover:border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl transition-all ${
                        isActive ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
                      }`}>
                        <Icon size={16} />
                      </div>
                      <div className="text-left">
                        <p className={`font-black text-[12px] leading-tight ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                          {level.level}
                        </p>
                        <p className="text-[9px] font-bold uppercase tracking-tight opacity-60">
                          {level.topics.length} Units
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={14} className={`transition-transform ${isActive ? 'translate-x-1 text-amber-500' : 'opacity-0'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Coding Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-4 mb-2">
              <Code size={14} className="text-blue-500" />
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Coding (Web Dev)</h3>
            </div>
            <div className="space-y-2">
              {categories.coding.map((level) => {
                const Icon = LEVEL_ICONS[level.level] || Code;
                const isActive = selectedLevel === level.level;
                return (
                  <button
                    key={level.level}
                    onClick={() => setSelectedLevel(level.level)}
                    className={`w-full group flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      isActive 
                        ? 'bg-white border-blue-300 shadow-xl shadow-blue-500/5 ring-4 ring-blue-500/5' 
                        : 'bg-white border-slate-100 hover:border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl transition-all ${
                        isActive ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
                      }`}>
                        <Icon size={16} />
                      </div>
                      <div className="text-left">
                        <p className={`font-black text-[12px] leading-tight ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                          {level.level.replace('Web ', '')}
                        </p>
                        <p className="text-[9px] font-bold uppercase tracking-tight opacity-60">
                          {level.topics.length} Units
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={14} className={`transition-transform ${isActive ? 'translate-x-1 text-blue-500' : 'opacity-0'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Display */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
            <div className="p-10 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{selectedLevel} Syllabus</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Guided Curriculum Tracker</p>
              </div>
              <div className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm border ${
                selectedLevel.toLowerCase().includes('web') 
                  ? 'bg-blue-100 text-blue-700 border-blue-200' 
                  : 'bg-amber-100 text-amber-700 border-amber-200'
              }`}>
                {selectedLevel.toLowerCase().includes('web') ? 'Coding Track' : 'Chess Track'}
              </div>
            </div>

            <div className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentLevelData?.topics.map((topic, index) => {
                  const isCoding = selectedLevel.toLowerCase().includes('web');
                  return (
                    <div 
                      key={index} 
                      className="group p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/30 transition-all flex items-start gap-4"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-xs text-slate-400 group-hover:bg-white transition-all shadow-sm ${
                        isCoding ? 'group-hover:text-blue-600' : 'group-hover:text-amber-600'
                      }`}>
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div className="flex-1 min-w-0 pt-2">
                        <p className="font-bold text-slate-700 leading-tight group-hover:text-slate-900 transition-colors">
                          {topic}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="mt-auto p-10 bg-slate-50 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                <Shield size={14} className="text-slate-400" /> 
                KingCompiler Core Engine • Dynamic Curriculum Node
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
