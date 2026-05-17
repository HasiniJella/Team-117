import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { HealthLog, PeriodCycle, MedicationReminder, MedicalDocument, UserProfile, PeriodLog as PeriodLogType, AnalysisResult } from './types';
import { Dashboard } from './components/Dashboard';
import { PeriodTracker } from './components/PeriodTracker';
import { Chatbot } from './components/Chatbot';
import { DietChatbot } from './components/DietChatbot';
import { Reminders } from './components/Reminders';
import { MedicalDocs } from './components/MedicalDocs';
import { HealthLogForm } from './components/HealthLogForm';
import { Profile } from './components/Profile';
import { Login } from './src/components/Login';
import { useFirebase } from './src/contexts/FirebaseContext';
import { useFirestoreSync } from './src/hooks/useFirestoreSync';
import { useFirestoreDocument } from './src/hooks/useFirestoreDocument';
import { ChartIcon, CalendarIcon, MessageSquareIcon, BellIcon, FileTextIcon, PlusIcon, UserIcon, MenuIcon, BowlIcon, SunIcon, MoonIcon, XIcon, SparklesIcon } from './components/icons';

type View = 'dashboard' | 'tracker' | 'chatbot' | 'reminders' | 'documents' | 'profile' | 'dietChatbot';

const App: React.FC = () => {
  const { user, signOut } = useFirebase();
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Firestore Hooks
  const { data: healthLogs, addItem: addHealthLog } = useFirestoreSync<HealthLog>('healthLogs');
  const { data: periodCycles, addItem: addPeriodCycle, removeItem: removePeriodCycle } = useFirestoreSync<PeriodCycle>('periodCycles');
  const { data: periodLogs, addItem: addPeriodLog } = useFirestoreSync<PeriodLogType>('periodLogs');
  const { data: medications, addItem: addMedication, updateItem: updateMedication, removeItem: removeMedication } = useFirestoreSync<MedicationReminder>('medications');
  const { data: documents, addItem: addDoc, removeItem: removeDoc } = useFirestoreSync<Omit<MedicalDocument, 'data'>>('documents');
  const { data: profile, saveData: saveProfile, updateData: updateProfile } = useFirestoreDocument<UserProfile>('users', user?.uid || '', {});
  
  // Remains in LocalStorage or session for UI state
  const [documentData, setDocumentData] = useState<Record<string, string>>({}); // Session-only as documents are huge
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const [analysisResults, setAnalysisResults] = useLocalStorage<{ [docId: string]: { analysis?: AnalysisResult; isLoading: boolean } }>('analysisResults', {});
  const [triggeredToday, setTriggeredToday] = useLocalStorage<Record<string, string>>('triggeredReminders', {});
  const [reminderSound, setReminderSound] = useLocalStorage<string>('reminderSound', 'data:audio/wav;base64,UklGRkIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQwAAACAAAD//w==');

  const [activeNotification, setActiveNotification] = useState<MedicationReminder | null>(null);

  // Document management
  const addDocument = async (doc: MedicalDocument) => {
    const { data, ...metadata } = doc;
    const docWithUploadTime = { ...metadata, uploadedAt: new Date().toISOString() };
    await addDoc(docWithUploadTime);
    if (data) {
        setDocumentData(prev => ({ ...prev, [doc.id]: data }));
    }
  };

  const deleteDocument = async (id: string) => {
    await removeDoc(id);
    setDocumentData(prev => {
        const newData = { ...prev };
        delete newData[id];
        return newData;
    });
    setAnalysisResults(prev => {
        const newResults = { ...prev };
        delete newResults[id];
        return newResults;
    });
  };
  
  // Reminder check effect
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      if (triggeredToday.date !== todayStr) {
        setTriggeredToday({ date: todayStr });
      }

      const dueMedication = medications.find(med => {
        return med.active && med.time === currentTime && !triggeredToday[med.id];
      });

      if (dueMedication) {
        setActiveNotification(dueMedication);
        setTriggeredToday(prev => ({ ...prev, [dueMedication.id]: currentTime }));
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [medications, triggeredToday, setTriggeredToday]);

  // Sound playing effect
  useEffect(() => {
    if (activeNotification) {
      const audio = new Audio(reminderSound);
      audio.play().catch(e => console.error("Audio play failed:", e));
    }
  }, [activeNotification, reminderSound]);


  // Theme logic
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleSetTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    setIsThemeMenuOpen(false);
  };

   useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [themeMenuRef]);
  
  const handleAddHealthLog = useCallback(async (log: Omit<HealthLog, 'id'>) => {
    const newLog = { ...log, id: Date.now().toString() };
    await addHealthLog(newLog);
    setIsLogModalOpen(false);
  }, [addHealthLog]);

  if (!user) {
    return <Login />;
  }

  const navItems: { view: View, label: string, icon: React.FC<any> }[] = [
    { view: 'dashboard', label: 'Dashboard', icon: ChartIcon },
    { view: 'tracker', label: 'Period Tracker', icon: CalendarIcon },
    { view: 'dietChatbot', label: 'AI Diet Planner', icon: BowlIcon },
    { view: 'chatbot', label: 'AI Health Guide', icon: MessageSquareIcon },
    { view: 'reminders', label: 'Med Reminders', icon: BellIcon },
    { view: 'documents', label: 'Medical Docs', icon: FileTextIcon },
    { view: 'profile', label: 'Profile', icon: UserIcon },
  ];

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard healthLogs={healthLogs} profile={profile} theme={theme} setTheme={setTheme} />;
      case 'tracker':
        return <PeriodTracker 
          periodCycles={periodCycles} 
          setPeriodCycles={((update: any) => {
            if (typeof update === 'function') {
                const newList = update(periodCycles);
                const added = newList.filter((n: any) => !periodCycles.find(o => o.id === n.id));
                const removed = periodCycles.filter(o => !newList.find((n: any) => n.id === o.id));
                added.forEach((a: any) => addPeriodCycle(a));
                removed.forEach((r: any) => removePeriodCycle(r.id));
            } else {
                // Bulk set - complex for Firestore subcollections without batching, 
                // but usually this is called with prev => ...
            }
          }) as any}
          periodLogs={periodLogs}
          setPeriodLogs={((update: any) => {
            if (typeof update === 'function') {
                const newList = update(periodLogs);
                const added = newList.filter((n: any) => !periodLogs.find(o => o.date === n.date));
                // PeriodLog uses 'date' as key in blueprint/types
                added.forEach((a: any) => addPeriodLog(a));
            }
          }) as any}
        />;
      case 'dietChatbot':
        const latestDoc = documents.length > 0 ? { ...documents[0], data: documentData[documents[0].id] } : undefined;
        return <DietChatbot profile={profile} documents={latestDoc ? [latestDoc] : []} periodCycles={periodCycles} periodLogs={periodLogs} analysisResults={analysisResults} healthLogs={healthLogs} />;
      case 'reminders':
        return <Reminders medications={medications} setMedications={((val: any) => {
            if (typeof val === 'function') {
                const nextMeds = val(medications);
                // Find changed ones
                nextMeds.forEach((m: any) => {
                    const old = medications.find(o => o.id === m.id);
                    if (!old) addMedication(m);
                    else if (JSON.stringify(old) !== JSON.stringify(m)) updateMedication(m.id, m);
                });
                medications.forEach((m: any) => {
                    if (!nextMeds.find((n: any) => n.id === m.id)) removeMedication(m.id);
                });
            }
        }) as any} reminderSound={reminderSound} setReminderSound={setReminderSound}/>;
      case 'documents':
        return <MedicalDocs documents={documents} documentData={documentData} addDocument={addDocument} deleteDocument={deleteDocument} setMedications={((val: any) => {
             if (typeof val === 'function') {
                const nextMeds = val(medications);
                nextMeds.forEach((m: any) => {
                    if (!medications.find(o => o.id === m.id)) addMedication(m);
                });
            }
        }) as any} analysisResults={analysisResults} setAnalysisResults={setAnalysisResults} />;
      case 'profile':
        return <Profile profile={profile} setProfile={((val: any) => {
            if (typeof val === 'function') {
                updateProfile(val(profile));
            } else {
                saveProfile(val);
            }
        }) as any} />;
      case 'chatbot':
        return <Chatbot />;
      default:
        return <Dashboard healthLogs={healthLogs} profile={profile} theme={theme} setTheme={setTheme} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 font-sans">
      {/* Sidebar */}
       <aside className={`bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
         <div className={`flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'} p-4 h-16 border-b border-slate-200 dark:border-slate-700`}>
          {isSidebarOpen && <h1 className="text-xl font-bold text-violet-600">Vitalis</h1>}
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700">
             {isSidebarOpen ? <XIcon className="h-6 w-6"/> : <MenuIcon className="h-6 w-6"/> }
           </button>
         </div>
        <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
          {navItems.map(({ view, label, icon: Icon }) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`w-full flex items-center p-3 rounded-md text-sm font-medium transition-colors ${isSidebarOpen ? '' : 'justify-center'} ${
                activeView === view
                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="h-6 w-6" />
              {isSidebarOpen && <span className="ml-3">{label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
           <div ref={themeMenuRef} className="relative">
                <button
                    onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                    className={`w-full flex items-center p-3 rounded-md text-sm font-medium transition-colors ${isSidebarOpen ? '' : 'justify-center'} hover:bg-slate-100 dark:hover:bg-slate-700`}
                >
                    {theme === 'light' ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
                    {isSidebarOpen && <span className="ml-3">Theme</span>}
                </button>
                {isThemeMenuOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-slate-700 rounded-md shadow-lg border dark:border-slate-600 overflow-hidden">
                        <button onClick={() => handleSetTheme('light')} className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-600">
                            <SunIcon className="h-5 w-5"/> Light
                        </button>
                        <button onClick={() => handleSetTheme('dark')} className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-600">
                            <MoonIcon className="h-5 w-5"/> Dark
                        </button>
                    </div>
                )}
           </div>
           {isSidebarOpen && (
             <div className="flex items-center gap-3 p-3 rounded-md bg-slate-50 dark:bg-slate-700/50">
               <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
                 {user.photoURL ? <img src={user.photoURL} alt="" className="rounded-full h-8 w-8" /> : <UserIcon className="h-5 w-5 text-violet-600" />}
               </div>
               <div className="flex-1 overflow-hidden">
                 <p className="text-xs font-semibold truncate text-slate-900 dark:text-white">{user.displayName}</p>
                 <button onClick={signOut} className="text-[10px] text-violet-600 hover:underline">Log out</button>
               </div>
             </div>
           )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex justify-end items-center p-4 h-16 bg-white dark:bg-slate-800/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
          <button onClick={() => setIsLogModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors">
            <PlusIcon className="h-5 w-5" />
            <span>Add Health Log</span>
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {renderView()}
        </main>
      </div>
      
      {/* Reminder Notification Modal */}
      {activeNotification && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8 max-w-sm w-full text-center">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-violet-100 dark:bg-violet-900 mb-4">
                      <BellIcon className="h-8 w-8 text-violet-600 dark:text-violet-400 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Medication Reminder</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-2">It's time to take your medication:</p>
                  <p className="text-2xl font-semibold text-violet-700 dark:text-violet-300 mt-4">
                      {activeNotification.name}
                  </p>
                   <p className="text-md text-slate-600 dark:text-slate-300">
                      {activeNotification.dosage}
                  </p>
                  <button
                      onClick={() => setActiveNotification(null)}
                      className="mt-6 w-full px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
                  >
                      Dismiss
                  </button>
              </div>
          </div>
      )}

      {/* Health Log Modal */}
      {isLogModalOpen && <HealthLogForm onSubmit={handleAddHealthLog} onClose={() => setIsLogModalOpen(false)} />}
    </div>
  );
};

export default App;
