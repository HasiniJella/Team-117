import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirebase } from '../contexts/FirebaseContext';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export function useFirestoreDocument<T>(collectionName: string, docId: string, defaultValue: T) {
  const { user } = useFirebase();
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  const path = user ? `${collectionName}/${user.uid}` : null; // Mapping users/{userId}

  useEffect(() => {
    if (!path) {
      setData(defaultValue);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, path), (snapshot) => {
      if (snapshot.exists()) {
        setData(snapshot.data() as T);
      } else {
        setData(defaultValue);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [path]);

  const saveData = async (newData: T) => {
    if (!path) return;
    try {
      await setDoc(doc(db, path), newData as any);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const updateData = async (updates: Partial<T>) => {
    if (!path) return;
    try {
      await updateDoc(doc(db, path), updates as any);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  return { data, setData, saveData, updateData, loading };
}
