import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, getRedirectResult   } from 'firebase/auth';
import { auth, signInWithGoogle, logout } from '../lib/firebase';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<any>;
  signOut: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

// Uses PropsWithChildren instead of manually defining children strings
export const FirebaseProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log("Successfully logged in via redirect:", result.user);
        }
      })
      .catch((error) => {
        console.error("Redirect login resolution error:", error);
      });
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    signIn: signInWithGoogle,
    signOut: logout,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {!loading && children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
