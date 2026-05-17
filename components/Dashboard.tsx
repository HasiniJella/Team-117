import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { HealthLog, UserProfile } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { HeartIcon, MoonIcon, ShoeIcon, ActivityIcon, SunIcon } from './icons';

interface DashboardProps {
  healthLogs: HealthLog[];
  profile: UserProfile;
  theme: 'light' | 'dark';
  setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
}

const MetricCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex items-center space-x-4">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
        </div>
    </div>
);

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const fullDate = dataPoint.fullDate;
    
    const renderedPayload = payload.map((pld: any) => {
        if (pld.value === null || pld.value === undefined) {
            return null;
        }
        let unit = '';
        if (pld.name === 'Heart Rate') unit = ' bpm';
        if (pld.name.includes('BP')) unit = ' mmHg';
        if (pld.name === 'Sleep') unit = ' hrs';
        
        return (
            <div key={pld.dataKey} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: pld.color }}></div>
                  <span className="text-slate-600 dark:text-slate-300">{pld.name}:</span>
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{`${pld.value}${unit}`}</span>
            </div>
        )
    }).filter(Boolean);

    return (
      <div className="bg-white dark:bg-slate-700 p-3 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl text-sm min-w-[180px]">
        <p className="font-bold text-slate-800 dark:text-slate-100 mb-2">{fullDate || label}</p>
        {renderedPayload.length > 0 ? (
            <div className="space-y-1">
                {renderedPayload}
            </div>
        ) : (
            <p className="text-slate-500 dark:text-slate-400">No data for this day.</p>
        )}
      </div>
    );
  }
  return null;
};


export const Dashboard: React.FC<DashboardProps> = ({ healthLogs, profile, theme, setTheme }) => {
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
    const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
    const themeMenuRef = useRef<HTMLDivElement>(null);

    const handleSetTheme = (newTheme: 'light' | 'dark') => {
        setTheme(newTheme);
        setIsThemeMenuOpen(false);
    };

    // Close theme menu on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
        if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
            setIsThemeMenuOpen(false);
        }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [themeMenuRef]);

    const chartData = useMemo(() => {
        if (healthLogs.length === 0) return [];

        const logsByDate = healthLogs.reduce((acc, log) => {
            // Assuming log.date is "YYYY-MM-DD"
            acc[log.date] = log;
            return acc;
        }, {} as { [key: string]: HealthLog });

        const sortedLogs = [...healthLogs].sort((a, b) => a.date.localeCompare(b.date));
        
        // All dates are handled as UTC to avoid timezone issues.
        const today = new Date(new Date().toISOString().split('T')[0]); // Today at UTC midnight

        let startDate: Date;

        if (timeRange === '7d') {
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 6);
        } else if (timeRange === '30d') {
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 29);
        } else { // 'all'
            startDate = new Date(sortedLogs[0].date);
        }
        
        const data = [];
        // Loop from the calculated start date to today
        for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
            const dateString = d.toISOString().split('T')[0];
            const log = logsByDate[dateString];

            data.push({
                name: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
                fullDate: d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }),
                'Heart Rate': log?.heartRate || null,
                'Sleep': log?.sleepHours || null,
                'Steps': log?.steps || null,
                'Systolic BP': log?.systolicBP || null,
                'Diastolic BP': log?.diastolicBP || null,
            });
        }

        return data;
    }, [healthLogs, timeRange]);

    const latestLog = healthLogs.length > 0 ? healthLogs[0] : null;

    const calculateBMI = (weight?: number, height?: number) => {
        if (!weight || !height) return { value: null, category: 'N/A' };

        const heightInMeters = height / 100;
        const bmi = weight / (heightInMeters * heightInMeters);
        let category = 'N/A';
        if (bmi < 18.5) category = 'Underweight';
        else if (bmi >= 18.5 && bmi <= 24.9) category = 'Normal';
        else if (bmi >= 25 && bmi <= 29.9) category = 'Overweight';
        else if (bmi >= 30) category = 'Obese';
        return { value: bmi.toFixed(1), category };
    };
    
    const bmi = calculateBMI(profile.weight, profile.height);

    if (healthLogs.length === 0) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-semibold mb-2">Welcome to your Health Dashboard!</h2>
                <p className="text-slate-500 dark:text-slate-400">Log your first health metric using the '+' button to see your data here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
                <div className="flex items-center space-x-2">
                    <div className="flex space-x-1 bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
                        {(['7d', '30d', 'all'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                    timeRange === range
                                        ? 'bg-white dark:bg-slate-800 text-violet-600 shadow'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                                }`}
                            >
                                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : 'All Time'}
                            </button>
                        ))}
                    </div>
                     <div ref={themeMenuRef} className="relative">
                        <button
                            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                            aria-label="Toggle theme"
                        >
                            {theme === 'light' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                        </button>
                        {isThemeMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-36 bg-white dark:bg-slate-800 rounded-md shadow-lg border dark:border-slate-700 z-10">
                                <button onClick={() => handleSetTheme('light')} className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-600">
                                    <SunIcon className="h-5 w-5"/> Light
                                </button>
                                <button onClick={() => handleSetTheme('dark')} className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-600">
                                    <MoonIcon className="h-5 w-5"/> Dark
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    title="Heart Rate" 
                    value={latestLog?.heartRate ? `${latestLog.heartRate} bpm` : 'N/A'} 
                    icon={<HeartIcon className="h-6 w-6 text-white"/>}
                    color="bg-red-500"
                />
                <MetricCard 
                    title="Blood Pressure" 
                    value={latestLog?.systolicBP && latestLog?.diastolicBP ? `${latestLog.systolicBP}/${latestLog.diastolicBP}` : 'N/A'} 
                    icon={<ActivityIcon className="h-6 w-6 text-white"/>}
                    color="bg-sky-500"
                />
                <MetricCard 
                    title="Sleep" 
                    value={latestLog?.sleepHours ? `${latestLog.sleepHours} hrs` : 'N/A'}
                    icon={<MoonIcon className="h-6 w-6 text-white"/>}
                    color="bg-indigo-500"
                />
                <MetricCard 
                    title="Steps" 
                    value={latestLog?.steps ? `${latestLog.steps}` : 'N/A'}
                    icon={<ShoeIcon className="h-6 w-6 text-white"/>}
                    color="bg-emerald-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">Vitals Overview</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line type="monotone" dataKey="Heart Rate" stroke="#ef4444" strokeWidth={2} dot={{r:4}} activeDot={{r:8}} connectNulls/>
                            <Line type="monotone" dataKey="Systolic BP" stroke="#38bdf8" strokeWidth={2} connectNulls/>
                            <Line type="monotone" dataKey="Diastolic BP" stroke="#0ea5e9" strokeWidth={2} connectNulls/>
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex flex-col justify-center items-center text-center">
                     <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-100">Body Mass Index (BMI)</h3>
                     {bmi.value ? (
                        <>
                            <p className="text-5xl font-bold text-violet-600 dark:text-violet-400">{bmi.value}</p>
                            <p className="font-semibold text-slate-600 dark:text-slate-300">{bmi.category}</p>
                        </>
                     ) : (
                        <p className="text-slate-500 dark:text-slate-400">Add weight and height in your profile to see BMI.</p>
                     )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">Sleep Hours</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="Sleep" fill="#6366f1" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                 <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">Steps Taken</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line type="monotone" dataKey="Steps" stroke="#10b981" strokeWidth={2} connectNulls />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};