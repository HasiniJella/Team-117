import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../types';

interface ProfileProps {
    profile: UserProfile;
    setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const ProfileField: React.FC<{ label: string, value: string | number | undefined, name: keyof UserProfile, isEditing: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void, placeholder?: string, type?: string, component?: 'input' | 'textarea' | 'select' }> = ({ label, value, name, isEditing, onChange, placeholder, type = 'text', component = 'input' }) => {
    const commonProps = {
        id: name,
        name: name,
        value: value || '',
        onChange: onChange,
        placeholder: placeholder,
        className: "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
    };
    
    let editComponent;
    if (component === 'textarea') {
        editComponent = <textarea {...commonProps} rows={3} />;
    } else if (component === 'select') {
        editComponent = (
            <select {...commonProps}>
                <option value="">Select...</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
            </select>
        );
    } else {
        editComponent = <input type={type} {...commonProps} />;
    }

    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
            {isEditing ? editComponent : (
                <p className="mt-1 text-md text-slate-900 dark:text-slate-100 p-2 min-h-[42px] bg-slate-100 dark:bg-slate-700/50 rounded-md whitespace-pre-wrap">{value || 'Not set'}</p>
            )}
        </div>
    );
};


export const Profile: React.FC<ProfileProps> = ({ profile, setProfile }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempProfile, setTempProfile] = useState<UserProfile>(profile);

    useEffect(() => {
        if (!isEditing) {
            setTempProfile(profile);
        }
    }, [profile, isEditing]);

    const handleEditToggle = () => {
        if (isEditing) {
            setProfile(tempProfile);
        }
        setIsEditing(!isEditing);
    };


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const numValue = (name === 'age' || name === 'weight' || name === 'height') ? (value === '' ? undefined : parseFloat(value)) : value;
        setTempProfile(prev => ({ ...prev, [name]: numValue }));
    };

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
    
    const displayProfile = isEditing ? tempProfile : profile;
    const bmi = calculateBMI(displayProfile.weight, displayProfile.height);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">My Profile</h1>
                <button
                    onClick={handleEditToggle}
                    className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors"
                >
                    {isEditing ? 'Save Profile' : 'Edit Profile'}
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ProfileField label="Full Name" name="name" value={displayProfile.name} isEditing={isEditing} onChange={handleChange} placeholder="e.g., Jane Doe"/>
                    <ProfileField label="Age" name="age" value={displayProfile.age} isEditing={isEditing} onChange={handleChange} type="number" placeholder="e.g., 30" />
                    <ProfileField label="Gender" name="gender" value={displayProfile.gender} isEditing={isEditing} onChange={handleChange} component="select"/>
                    <ProfileField label="Blood Type" name="bloodType" value={displayProfile.bloodType} isEditing={isEditing} onChange={handleChange} placeholder="e.g., O+"/>
                    <ProfileField label="Weight (kg)" name="weight" value={displayProfile.weight} isEditing={isEditing} onChange={handleChange} type="number" placeholder="e.g., 65"/>
                    <ProfileField label="Height (cm)" name="height" value={displayProfile.height} isEditing={isEditing} onChange={handleChange} type="number" placeholder="e.g., 170"/>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Body Mass Index (BMI)</label>
                        <p className={`mt-1 text-md text-slate-900 dark:text-slate-100 p-2 min-h-[42px] rounded-md ${bmi.value ? 'bg-slate-100 dark:bg-slate-700/50' : 'text-slate-500'}`}>
                            {bmi.value ? `${bmi.value} (${bmi.category})` : 'Enter weight & height'}
                        </p>
                    </div>

                    <div className="md:col-span-2">
                        <ProfileField label="Health Goals" name="healthGoals" value={displayProfile.healthGoals} isEditing={isEditing} onChange={handleChange} component="textarea" placeholder="e.g., Lose 5kg, improve cardiovascular health, manage blood sugar."/>
                    </div>
                    <div className="md:col-span-2">
                        <ProfileField label="Known Allergies" name="allergies" value={displayProfile.allergies} isEditing={isEditing} onChange={handleChange} component="textarea" placeholder="e.g., Peanuts, Penicillin"/>
                    </div>
                    <div className="md:col-span-2">
                        <ProfileField label="Current Medications" name="medications" value={displayProfile.medications} isEditing={isEditing} onChange={handleChange} component="textarea" placeholder="e.g., Metformin 500mg daily"/>
                    </div>
                    <div className="md:col-span-2">
                        <ProfileField label="Chronic Conditions" name="conditions" value={displayProfile.conditions} isEditing={isEditing} onChange={handleChange} component="textarea" placeholder="e.g., Type 2 Diabetes, Asthma"/>
                    </div>
                </div>
            </div>
        </div>
    );
};