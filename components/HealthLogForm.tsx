import React, { useState } from 'react';
import type { HealthLog } from '../types';

interface HealthLogFormProps {
  onSubmit: (log: Omit<HealthLog, 'id'>) => void;
  onClose: () => void;
}

const InputField: React.FC<{label: string, type: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder?: string}> = 
  ({ label, type, value, onChange, placeholder }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400"
      />
    </div>
);


export const HealthLogForm: React.FC<HealthLogFormProps> = ({ onSubmit, onClose }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [heartRate, setHeartRate] = useState('');
  const [systolicBP, setSystolicBP] = useState('');
  const [diastolicBP, setDiastolicBP] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [steps, setSteps] = useState('');
  const [symptoms, setSymptoms] = useState('');


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      date,
      heartRate: heartRate ? parseInt(heartRate) : undefined,
      systolicBP: systolicBP ? parseInt(systolicBP) : undefined,
      diastolicBP: diastolicBP ? parseInt(diastolicBP) : undefined,
      sleepHours: sleepHours ? parseFloat(sleepHours) : undefined,
      steps: steps ? parseInt(steps) : undefined,
      symptoms,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg max-h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">New Health Log</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Heart Rate (bpm)" type="number" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} placeholder="e.g., 70" />
            <InputField label="Sleep (hours)" type="number" value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} placeholder="e.g., 7.5" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Blood Pressure</label>
            <div className="grid grid-cols-2 gap-4">
              <input type="number" value={systolicBP} onChange={(e) => setSystolicBP(e.target.value)} placeholder="Systolic (e.g., 120)" className="w-full px-3 py-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600" />
              <input type="number" value={diastolicBP} onChange={(e) => setDiastolicBP(e.target.value)} placeholder="Diastolic (e.g., 80)" className="w-full px-3 py-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600" />
            </div>
          </div>

          <InputField label="Steps" type="number" value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="e.g., 10000" />
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Symptoms/Notes</label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={3}
              placeholder="e.g., Headache, feeling tired"
              className="w-full px-3 py-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700">
              Save Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};