import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
const firebaseConfig = {
  apiKey: "AIzaSyBlBURFnqoXb3ZhGms7gDWNp0Nu-P_QSZM",
  authDomain: "you-love-nta.firebaseapp.com",
  projectId: "you-love-nta",
  storageBucket: "you-love-nta.firebasestorage.app",
  messagingSenderId: "121180158299",
  appId: "1:121180158299:web:ccea3fe67bcfff9150827e",
  measurementId: "G-0NTDSFVKYC"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Enable automated anonymous authentication on boot for rules support
signInAnonymously(auth).catch((err) => {
  console.warn("Automated anonymous sign-in skipped/failed:", err);
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
