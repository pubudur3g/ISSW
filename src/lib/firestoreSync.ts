import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

// Helper to strip undefined values so Firestore does not reject writes
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeForFirestore) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(data as Record<string, any>)) {
      if (val !== undefined) {
        cleaned[key] = sanitizeForFirestore(val);
      }
    }
    return cleaned as T;
  }
  return data;
}

// Helper to push a document to Firestore
export async function saveToFirestore<T extends { id: string }>(
  collectionName: string,
  data: T
): Promise<void> {
  if (!data || !data.id) return;
  try {
    const docRef = doc(db, collectionName, data.id);
    const sanitized = sanitizeForFirestore(data);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${data.id}`);
  }
}

// Helper to remove a document from Firestore
export async function deleteFromFirestore(
  collectionName: string,
  id: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
  }
}

// Subscribe to real-time updates for a collection
export function subscribeToCollection<T extends { id: string }>(
  collectionName: string,
  storageKey: string,
  onUpdate?: (items: T[]) => void
): () => void {
  const colRef = collection(db, collectionName);

  const unsubscribe = onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        return;
      }
      const items: T[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as T);
      });

      // Update localStorage
      localStorage.setItem(storageKey, JSON.stringify(items));
      
      // Dispatch custom event so UI components re-render immediately
      window.dispatchEvent(new Event('cleanstock_data_updated'));

      if (onUpdate) {
        onUpdate(items);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionName);
    }
  );

  return unsubscribe;
}

// Initialize Firestore with local seed data if cloud collections are empty or missing default items
export async function initializeFirestoreFromLocal(
  collectionName: string,
  storageKey: string,
  defaultItems: any[]
): Promise<void> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const existingIds = new Set<string>();
    snapshot.forEach((docSnap) => existingIds.add(docSnap.id));

    for (const item of defaultItems) {
      if (item && item.id && !existingIds.has(item.id)) {
        const sanitized = sanitizeForFirestore(item);
        await setDoc(doc(db, collectionName, item.id), sanitized, { merge: true });
      }
    }
  } catch (err) {
    console.error(`Error initializing collection ${collectionName}:`, err);
  }
}
