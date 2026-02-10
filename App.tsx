
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { StudentManager } from './components/StudentManager';
import { GroupBatchManager } from './components/GroupBatchManager';
import { CalendarView } from './components/CalendarView';
import { StudentProfile } from './components/StudentProfile';
import { CurriculumView } from './components/CurriculumView';
import { PartnerManager } from './components/PartnerManager';
import { ClassAlarmManager } from './components/ClassAlarmManager';
import { LoginPage } from './components/LoginPage';
import { StudentPortal } from './components/StudentPortal';
import { LibraryManager } from './components/LibraryManager';
import { AnnouncementManager } from './components/AnnouncementManager';
import { HomeworkManager } from './components/HomeworkManager';
import { authService } from './services/auth';
import { AppUser } from './types';

type View = 'dashboard' | 'students' | 'groups' | 'calendar' | 'curriculum' | 'student-profile' | 'partners' | 'library' | 'announcements' | 'homework-admin';

const App: React.FC = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((currentUser) => {
      setUser(currentUser);
      setIsInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = (adminUser: AppUser) => {
    setUser(adminUser);
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    await authService.signOut();
    setUser(null);
  };

  const navigateToProfile = (studentId: string) => {
    setSelectedStudentId(studentId);
    setCurrentView('student-profile');
  };

  const handleNavigate = (view: View) => {
    setCurrentView(view);
    setSelectedStudentId(null);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">Waking up database...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (user.role === 'student' && user.studentId) {
    return <StudentPortal studentId={user.studentId} onLogout={handleLogout} />;
  }

  return (
    <div className="h-full">
      <Layout 
        user={user}
        onNavigate={handleNavigate} 
        currentView={currentView}
        onLogout={handleLogout}
      >
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
          {currentView === 'dashboard' && (
            <Dashboard 
              onNavigate={handleNavigate} 
              onSelectStudent={navigateToProfile} 
            />
          )}
          {currentView === 'students' && (
            <StudentManager onSelectStudent={navigateToProfile} />
          )}
          {currentView === 'groups' && (
            <GroupBatchManager />
          )}
          {currentView === 'partners' && (
            <PartnerManager />
          )}
          {currentView === 'library' && (
            <LibraryManager />
          )}
          {currentView === 'announcements' && (
            <AnnouncementManager />
          )}
          {currentView === 'homework-admin' && (
            <HomeworkManager />
          )}
          {currentView === 'calendar' && <CalendarView />}
          {currentView === 'curriculum' && <CurriculumView />}
          {currentView === 'student-profile' && selectedStudentId && (
            <StudentProfile 
              studentId={selectedStudentId} 
              onBack={() => setCurrentView('students')} 
            />
          )}
        </div>
      </Layout>
      <ClassAlarmManager />
    </div>
  );
};

export default App;
