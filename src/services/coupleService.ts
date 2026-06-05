import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/firebase';
import { generateCoupleId } from '../utils/generateCoupleId';

export interface CoupleData {
  profile: any;
  cycles: any[];
  aiResult: any | null;
  settings: any | null;
  updatedAt?: any;
}

/**
 * Creates a new couple document on Firestore with initial state.
 * Generates a random couple ID (LOVE-XXXXXX).
 * Saves the newly created code into localStorage.
 */
export async function createCouple(initialData: CoupleData): Promise<string> {
  let coupleId = '';
  let exists = true;
  let attempts = 0;

  // Try generating a unique room ID that doesn't conflict (max 5 retries for extreme safety)
  while (exists && attempts < 5) {
    coupleId = generateCoupleId();
    attempts++;
    try {
      const docRef = doc(db, 'couples', coupleId);
      const snapshot = await getDoc(docRef);
      exists = snapshot.exists();
    } catch (err) {
      console.warn("Retrying couple code availability: ", err);
      exists = false; // default to false so we try to set it, which will fail if permissions deny
    }
  }

  const path = `couples/${coupleId}`;
  try {
    const docRef = doc(db, 'couples', coupleId);
    await setDoc(docRef, {
      profile: initialData.profile,
      cycles: initialData.cycles,
      aiResult: initialData.aiResult || null,
      settings: initialData.settings || null,
      updatedAt: serverTimestamp()
    });

    localStorage.setItem('youlove_couple_id', coupleId);
    return coupleId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Joins an existing couple room.
 * Fetches data to verify its existence, then saves the ID to localStorage.
 */
export async function joinCouple(coupleId: string): Promise<CoupleData> {
  const sanitizedId = coupleId.trim().toUpperCase();
  if (!sanitizedId.startsWith('LOVE-') || sanitizedId.length < 11) {
    throw new Error('Mã liên kết không hợp lệ. Phải bắt đầu bằng: LOVE- và có dạng LOVE-XXXXXX');
  }

  const data = await loadCouple(sanitizedId);
  localStorage.setItem('youlove_couple_id', sanitizedId);
  return data;
}

/**
 * Loads couple data once from Firestore.
 */
export async function loadCouple(coupleId: string): Promise<CoupleData> {
  const path = `couples/${coupleId}`;
  try {
    const docRef = doc(db, 'couples', coupleId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error(`Không tìm thấy phòng liên kết: ${coupleId}. Vui lòng kiểm tra lại mã số.`);
    }
    const data = docSnap.data() as any;
    return {
      profile: data.profile,
      cycles: data.cycles || [],
      aiResult: data.aiResult || null,
      settings: data.settings || null,
      updatedAt: data.updatedAt
    };
  } catch (error: any) {
    if (error.message && error.message.includes('Không tìm thấy phòng liên kết')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Saves/updates couple data to Firestore.
 */
export async function saveCouple(coupleId: string, data: Partial<CoupleData>): Promise<void> {
  const path = `couples/${coupleId}`;
  try {
    const docRef = doc(db, 'couples', coupleId);
    await setDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Subscribes to real-time changes in the couple room.
 */
export function subscribeCouple(coupleId: string, callback: (data: CoupleData) => void): () => void {
  const path = `couples/${coupleId}`;
  const docRef = doc(db, 'couples', coupleId);

  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data() as any;
      callback({
        profile: data.profile,
        cycles: data.cycles || [],
        aiResult: data.aiResult || null,
        settings: data.settings || null,
        updatedAt: data.updatedAt
      });
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });

  return unsubscribe;
}

/**
 * Generates copyable url sharing link.
 */
export function generateShareLink(coupleId: string): string {
  return `https://hiepngoanne2060-star.github.io/YouLove/?room=${coupleId}`;
}
