import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy,
  updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirebase } from '../contexts/FirebaseContext';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export function useFirestoreSync<T extends { id: string }>(collectionName: string) {
  const { user } = useFirebase();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const path = user ? `users/${user.uid}/${collectionName}` : null;

  useEffect(() => {
    if (!path) {
      setData([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, path), orderBy('uploadedAt', 'desc')); // Default order
    // Note: Some collections might not have 'uploadedAt', so we might need a more flexible query structure.
    // For now, let's use a simpler onSnapshot and sort in memory if needed, or handle specific collection requirements.

    const unsubscribe = onSnapshot(collection(db, path), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));
      setData(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [path]);

  const addItem = async (item: T) => {
    if (!path) return;
    try {
      await setDoc(doc(db, path, item.id), item);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${path}/${item.id}`);
    }
  };

  const updateItem = async (id: string, updates: Partial<T>) => {
    if (!path) return;
    try {
      await updateDoc(doc(db, path, id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${path}/${id}`);
    }
  };

  const removeItem = async (id: string) => {
    if (!path) return;
    try {
      await deleteDoc(doc(db, path, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
    }
  };

  return { data, setData, addItem, updateItem, removeItem, loading };
}
