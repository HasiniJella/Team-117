import React from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import { SparklesIcon } from '@/components/icons';

export const Login: React.FC = () => {
  const { signIn } = useFirebase();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-10 text-center border border-slate-200 dark:border-slate-700">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200 dark:shadow-none mb-8">
            <SparklesIcon className="h-10 w-10" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Vitalis</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg">Your Personal Health Sanctuary</p>
        
        <div className="space-y-4">
            <button
            onClick={signIn}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-white border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 font-semibold py-4 px-6 rounded-2xl transition-all duration-200 shadow-sm"
            >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-6 w-6" />
            <span>Continue with Google</span>
            </button>
        </div>
        
        <p className="mt-8 text-sm text-slate-400 dark:text-slate-500">
            Securely store and manage your health records in one place.
        </p>
      </div>
    </div>
  );
};
