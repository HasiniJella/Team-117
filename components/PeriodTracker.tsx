import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PeriodCycle, PeriodLog } from '../types';
import { XIcon } from './icons';

interface PeriodTrackerProps {
  periodCycles: PeriodCycle[];
  setPeriodCycles: React.Dispatch<React.SetStateAction<PeriodCycle[]>>;
  periodLogs: PeriodLog[];
  setPeriodLogs: React.Dispatch<React.SetStateAction<PeriodLog[]>>;
}

const symptomsList = ['Cramps', 'Bloating', 'Headache', 'Fatigue', 'Acne', 'Backache', 'Nausea', 'Tender Breasts'];
const moodsList = ['Happy', 'Sad', 'Anxious', 'Irritable', 'Energetic', 'Calm', 'Moody'];

const PeriodLogModal: React.FC<{ date: Date; existingLog: PeriodLog | undefined; onSave: (log: PeriodLog) => void; onClose: () => void; }> = ({ date, existingLog, onSave, onClose }) => {
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(existingLog?.symptoms || []);
    const [selectedMoods, setSelectedMoods] = useState<string[]>(existingLog?.moods || []);
    const [notes, setNotes] = useState<string>(existingLog?.notes || '');

    const toggleItem = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
        setList(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    };
    
    const handleSave = () => {
        onSave({
            date: date.toISOString().split('T')[0],
            symptoms: selectedSymptoms,
            moods: selectedMoods,
            notes: notes
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md max-h-full overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Log for {date.toLocaleDateString()}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                        <XIcon className="h-5 w-5 text-slate-500" />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold mb-2">Symptoms</h3>
                        <div className="flex flex-wrap gap-2">
                            {symptomsList.map(symptom => (
                                <button key={symptom} onClick={() => toggleItem(symptom, selectedSymptoms, setSelectedSymptoms)} className={`px-3 py-1 text-sm rounded-full border transition-colors ${selectedSymptoms.includes(symptom) ? 'bg-violet-600 text-white border-violet-600' : 'bg-transparent border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                    {symptom}
                                </button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold mb-2">Mood</h3>
                        <div className="flex flex-wrap gap-2">
                            {moodsList.map(mood => (
                                <button key={mood} onClick={() => toggleItem(mood, selectedMoods, setSelectedMoods)} className={`px-3 py-1 text-sm rounded-full border transition-colors ${selectedMoods.includes(mood) ? 'bg-sky-500 text-white border-sky-500' : 'bg-transparent border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                    {mood}
                                </button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold mb-1">Notes</h3>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full p-2 border rounded-md dark:bg-slate-700 border-slate-300 dark:border-slate-600" placeholder="Any additional details..."></textarea>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">Cancel</button>
                    <button type="button" onClick={handleSave} className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700">Save Log</button>
                </div>
            </div>
        </div>
    );
};


export const PeriodTracker: React.FC<PeriodTrackerProps> = ({ periodCycles, setPeriodCycles, periodLogs, setPeriodLogs }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logDate, setLogDate] = useState<Date | null>(null);
  const [isLoggingMode, setIsLoggingMode] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);

  const sortedCycles = useMemo(() => [...periodCycles].sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()), [periodCycles]);

  const stats = useMemo(() => {
    if (sortedCycles.length < 2) {
        const avgPeriodLength = sortedCycles.length === 1 ?
            ((new Date(sortedCycles[0].endDate).getTime() - new Date(sortedCycles[0].startDate).getTime()) / (1000 * 60 * 60 * 24) + 1).toFixed(1)
            : 'N/A';
        return { avgCycleLength: 'N/A', avgPeriodLength };
    }
    
    let cycleDurations = 0;
    for (let i = 0; i < sortedCycles.length - 1; i++) {
      const start1 = new Date(sortedCycles[i].startDate);
      const start2 = new Date(sortedCycles[i+1].startDate);
      const diffTime = Math.abs(start2.getTime() - start1.getTime());
      cycleDurations += Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    const avgCycleLength = Math.round(cycleDurations / (sortedCycles.length - 1));

    const periodDurations = sortedCycles.reduce((acc, cycle) => {
        const start = new Date(cycle.startDate);
        const end = new Date(cycle.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        return acc + Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }, 0);
    const avgPeriodLength = (periodDurations / sortedCycles.length).toFixed(1);

    return { avgCycleLength, avgPeriodLength };
  }, [sortedCycles]);
  
  const symptomFrequency = useMemo(() => {
    const symptomCount: { [key: string]: number } = {};
    
    periodLogs.forEach(log => {
      log.symptoms.forEach(symptom => {
        symptomCount[symptom] = (symptomCount[symptom] || 0) + 1;
      });
    });
    return Object.entries(symptomCount).map(([name, count]) => ({name, count})).sort((a,b) => b.count - a.count);
  }, [periodLogs]);


  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    clickedDate.setHours(0,0,0,0);

    if (isLoggingMode) {
        if (!selectionStart) {
            setSelectionStart(clickedDate);
        } else {
            const startDate = selectionStart < clickedDate ? selectionStart : clickedDate;
            const endDate = selectionStart > clickedDate ? selectionStart : clickedDate;

            const isOverlapping = sortedCycles.some(cycle =>
                (startDate <= new Date(cycle.endDate) && endDate >= new Date(cycle.startDate))
            );

            if(isOverlapping){
                alert("Error: The selected date range overlaps with an existing period. Please choose a different range or delete the conflicting entry first.");
                setSelectionStart(null);
                return;
            }

            const newCycle: PeriodCycle = {
                id: Date.now().toString(),
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            };
            setPeriodCycles(prev => [...prev, newCycle]);
            setIsLoggingMode(false);
            setSelectionStart(null);
        }
    } else {
        setLogDate(clickedDate);
    }
  };
  
  const handleSaveLog = (log: PeriodLog) => {
    setPeriodLogs(prev => {
        const existingIndex = prev.findIndex(pLog => pLog.date === log.date);
        if(existingIndex > -1){
            const newLogs = [...prev];
            newLogs[existingIndex] = log;
            return newLogs;
        }
        return [...prev, log];
    });
  };

  const calendarDays = useMemo(() => {
    const totalDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const startingDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const daysArray = [];

    const isPeriodDay = (checkDate: Date) => {
        return periodCycles.some(cycle => {
          const start = new Date(cycle.startDate);
          start.setHours(0,0,0,0);
          const end = new Date(cycle.endDate);
          end.setHours(0,0,0,0);
          return checkDate >= start && checkDate <= end;
        });
    };
    
    const hasLog = (checkDate: Date) => {
        const dateString = checkDate.toISOString().split('T')[0];
        return periodLogs.some(log => log.date === dateString);
    }

    for (let i = 0; i < startingDay; i++) {
      daysArray.push(<div key={`empty-${i}`} className="border-r border-b border-slate-200 dark:border-slate-700"></div>);
    }

    for (let day = 1; day <= totalDays; day++) {
        const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        dayDate.setHours(0,0,0,0);
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const isToday = dayDate.getTime() === today.getTime();
        const isSelectionStart = selectionStart && selectionStart.getTime() === dayDate.getTime();
        const periodDay = isPeriodDay(dayDate);

        daysArray.push(
            <div 
                key={day} 
                onClick={() => handleDateClick(day)} 
                className={`p-1 text-center border-r border-b border-slate-200 dark:border-slate-700 cursor-pointer transition-colors duration-200 relative ${periodDay ? 'bg-red-200 dark:bg-red-800/50' : 'hover:bg-slate-100 dark:hover:bg-slate-700'} ${isSelectionStart ? 'ring-2 ring-violet-500 ring-inset' : ''}`}>
                <span className={`w-8 h-8 flex items-center justify-center rounded-full mx-auto ${isToday ? 'bg-violet-600 text-white' : ''} ${periodDay ? 'font-semibold' : ''}`}>
                    {day}
                </span>
                {hasLog(dayDate) && <div className="absolute bottom-1 right-1 w-2 h-2 bg-sky-500 rounded-full"></div>}
            </div>
        );
    }
    return daysArray;
  }, [currentDate, periodCycles, periodLogs, selectionStart, isLoggingMode]);

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const handleLogPeriodClick = () => {
    setIsLoggingMode(!isLoggingMode);
    setSelectionStart(null); // Reset selection on toggle
  };
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Period Tracker</h1>
        <button 
            onClick={handleLogPeriodClick} 
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                isLoggingMode 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-violet-600 text-white hover:bg-violet-700'
            }`}>
            {isLoggingMode ? 'Cancel Logging' : 'Log New Period'}
        </button>
      </div>
      
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md text-center">
                <h3 className="text-lg font-semibold text-slate-500 dark:text-slate-400">Avg. Cycle Length</h3>
                <p className="text-3xl font-bold">{stats.avgCycleLength} <span className="text-xl">days</span></p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Based on {sortedCycles.length} cycle(s)</p>
            </div>
             <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md text-center">
                <h3 className="text-lg font-semibold text-slate-500 dark:text-slate-400">Avg. Period Length</h3>
                <p className="text-3xl font-bold">{stats.avgPeriodLength} <span className="text-xl">days</span></p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Based on {sortedCycles.length} period(s)</p>
            </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">&lt;</button>
                <h2 className="text-xl font-semibold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">&gt;</button>
            </div>

            {isLoggingMode && (
                <div className="text-center bg-violet-100 dark:bg-violet-900/50 p-2 rounded-md mb-4 text-sm font-medium text-violet-700 dark:text-violet-300">
                    {selectionStart ? 'Now, select your period end date.' : 'Select your period start date on the calendar.'}
                </div>
            )}

            <div className="grid grid-cols-7 border-t border-l border-slate-200 dark:border-slate-700">
                {weekDays.map(day => <div key={day} className="font-bold text-center py-2 border-r border-b border-slate-200 dark:border-slate-700 text-sm">{day}</div>)}
                {calendarDays}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-sm">
                <div className="flex items-center"><div className="w-3 h-3 bg-red-200 dark:bg-red-800/50 rounded-full mr-2"></div>Period Day</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-sky-500 rounded-full mr-2"></div>Logged Day</div>
                <div className="flex items-center"><div className="w-3 h-3 ring-2 ring-violet-500 rounded-full mr-2"></div>Start Date</div>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">Symptom Frequency (All Time)</h3>
            {symptomFrequency.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={symptomFrequency} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="name" width={80} tick={{fontSize: 12}} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8b5cf6" name="Days" />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-center text-slate-500 dark:text-slate-400 py-8">Log symptoms during your period to see trends here.</p>
            )}
        </div>
      </div>


      {logDate && <PeriodLogModal 
        date={logDate} 
        onClose={() => setLogDate(null)} 
        onSave={handleSaveLog}
        existingLog={periodLogs.find(log => log.date === logDate.toISOString().split('T')[0])}
        />}
    </div>
  );
};