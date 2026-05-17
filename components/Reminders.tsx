import React, { useState } from 'react';
import type { MedicationReminder } from '../types';
import { PlusIcon, TrashIcon, XIcon, PlayIcon } from './icons';

interface RemindersProps {
  medications: MedicationReminder[];
  setMedications: React.Dispatch<React.SetStateAction<MedicationReminder[]>>;
  reminderSound: string;
  setReminderSound: React.Dispatch<React.SetStateAction<string>>;
}

const sounds: { [key: string]: string } = {
  'Beep': 'data:audio/wav;base64,UklGRkIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQwAAACAAAD//w==',
  'Chime': 'data:audio/wav;base64,UklGRlAIAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAACACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIA=',
  'Bell': 'data:audio/wav;base64,UklGRlAIAABXQVZFZm10IBAAAAABAAEAOYoAAHONAQACABAAZGF0YQAACACIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIg=',
  'Harp': 'data:audio/wav;base64,UklGRjwAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YSAgAAAAAAD/AIA/wD6APwA+gD+APgA+QD5APkA+QD5APgA+AD7APwA/AD8AP0A/QD9AP4A/gD+AP8A/wD//P/9//3//f/8//v/+v/5//j/+P/4//z//f/9//4A/wAD//7/+v/1//v//P/9AP8C'
};

const ReminderModal: React.FC<{ onClose: () => void; onSave: (reminder: Omit<MedicationReminder, 'id' | 'active'>) => void }> = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [time, setTime] = useState('09:00');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!name.trim() || !dosage.trim() || !time.trim()) {
            alert("Please fill in all fields.");
            return;
        }
        onSave({ name, dosage, time });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">New Reminder</h2>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="medName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Medication Name</label>
                <input id="medName" type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 border-slate-300 dark:border-slate-600" placeholder="e.g., Ibuprofen" />
              </div>
              <div>
                <label htmlFor="dosage" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Dosage</label>
                <input id="dosage" type="text" value={dosage} onChange={(e) => setDosage(e.target.value)} className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 border-slate-300 dark:border-slate-600" placeholder="e.g., 200mg" />
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Time</label>
                <input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
              </div>
               <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700">Add Reminder</button>
              </div>
            </form>
          </div>
        </div>
    );
};


export const Reminders: React.FC<RemindersProps> = ({ medications, setMedications, reminderSound, setReminderSound }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSaveReminder = (reminder: Omit<MedicationReminder, 'id' | 'active'>) => {
        const newReminder: MedicationReminder = {
            ...reminder,
            id: Date.now().toString(),
            active: true
        };
        setMedications(prev => [...prev, newReminder].sort((a,b) => a.time.localeCompare(b.time)));
    };
    
    const toggleReminder = (id: string) => {
        setMedications(meds => meds.map(med => med.id === id ? { ...med, active: !med.active } : med));
    };

    const deleteReminder = (id: string) => {
        setMedications(meds => meds.filter(med => med.id !== id));
    };
    
    const playSound = (sound: string) => {
        try {
            const audio = new Audio(sound);
            audio.play().catch(e => console.error("Audio play failed:", e));
        } catch (e) {
            console.error("Failed to create audio object:", e)
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Medication Reminders</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors"
                >
                    <PlusIcon className="h-5 w-5" />
                    <span>New Reminder</span>
                </button>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                 <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">Reminder Settings</h2>
                <div className="flex items-center gap-4">
                    <label htmlFor="sound-select" className="text-sm font-medium text-slate-700 dark:text-slate-300">Alert Sound:</label>
                    <select 
                        id="sound-select"
                        value={Object.keys(sounds).find(key => sounds[key] === reminderSound) || 'Beep'}
                        onChange={(e) => {
                            const soundKey = e.target.value;
                            setReminderSound(sounds[soundKey]);
                            playSound(sounds[soundKey]);
                        }}
                        className="p-2 border rounded-md dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                    >
                        {Object.keys(sounds).map(soundName => (
                            <option key={soundName} value={soundName}>{soundName}</option>
                        ))}
                    </select>
                    <button onClick={() => playSound(reminderSound)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-violet-600 dark:text-violet-400" title="Preview sound">
                       <PlayIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Current Reminders</h2>
                {medications.length > 0 ? (
                    <ul className="space-y-3">
                        {medications.map(med => (
                            <li key={med.id} className={`p-4 rounded-lg shadow-sm flex items-center justify-between transition-colors ${med.active ? 'bg-white dark:bg-slate-800' : 'bg-slate-200 dark:bg-slate-700/50'}`}>
                                <div>
                                    <p className={`text-2xl font-mono ${med.active ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>{med.time}</p>
                                    <p className={`font-semibold ${med.active ? 'text-slate-900 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>{med.name}</p>
                                    <p className={`text-sm ${med.active ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>{med.dosage}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label htmlFor={`toggle-${med.id}`} className="flex items-center cursor-pointer">
                                        <div className="relative">
                                            <input type="checkbox" id={`toggle-${med.id}`} className="sr-only" checked={med.active} onChange={() => toggleReminder(med.id)} />
                                            <div className="block bg-slate-300 dark:bg-slate-600 w-12 h-6 rounded-full"></div>
                                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${med.active ? 'translate-x-6 bg-violet-500' : ''}`}></div>
                                        </div>
                                    </label>
                                    <button onClick={() => deleteReminder(med.id)} className="p-2 text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" title="Delete reminder">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-slate-500 dark:text-slate-400 py-8">No medication reminders set.</p>
                )}
            </div>

            {isModalOpen && <ReminderModal onClose={() => setIsModalOpen(false)} onSave={handleSaveReminder} />}
        </div>
    );
};
