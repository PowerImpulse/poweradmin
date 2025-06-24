// /src/lib/client.ts
import { initializeApp,  type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app: FirebaseApp = initializeApp(firebaseConfig); 
const auth = getAuth(app);
const dbUsers = getFirestore(app);
const dbTareas = getFirestore(app);
const dbEquipos = getFirestore(app);
const dbTimeRecord = getFirestore(app);

export { app, dbUsers, dbEquipos, dbTimeRecord, auth, dbTareas };



