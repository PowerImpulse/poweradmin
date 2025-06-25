import { writable, readable } from 'svelte/store';
import { auth, db } from '$lib/client';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Tipado del documento en Firestore
export interface UserData {
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer' | string; // ajusta según tus roles
  created_at: string;
  isBlocked: boolean;
  uid: string;
}

// === STORES PRINCIPALES ===
export const user = writable<User | null>(null);

// userData con persistencia local

let initialUserData = null;

if (typeof window !== 'undefined') {
  const localUserData = localStorage.getItem('userData');
  initialUserData = localUserData ? JSON.parse(localUserData) : null;
}

export const userData = writable<UserData | null>(initialUserData);

if (typeof window !== 'undefined') {
  userData.subscribe((value) => {
    if (value) {
      localStorage.setItem('userData', JSON.stringify(value));
    } else {
      localStorage.removeItem('userData');
    }
  });
}

export const isLoggedIn = writable<boolean>(false);
export const role = writable<UserData['role'] | null>(null);
export const loadingUser = writable<boolean>(true);
export const sectionTitle = writable<string>('');

// Opcional: tema y reloj en tiempo real
export const theme = writable('system');
export const time = readable(new Date(), function start(set) {
  const interval = setInterval(() => set(new Date()), 1000);
  return () => clearInterval(interval);
});

// === ESCUCHAR CAMBIOS EN LA SESIÓN ===
onAuthStateChanged(auth, async (authUser) => {
  user.set(authUser);
  isLoggedIn.set(!!authUser);

  if (authUser) {
    try {
      const ref = doc(db, 'users', authUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        userData.set(data as UserData);
        role.set(data.role ?? null);
      } else {
        userData.set(null);
        role.set(null);
      }
    } catch (err) {
      console.error('Error al obtener datos del usuario:', err);
      userData.set(null);
      role.set(null);
    }
  } else {
    userData.set(null);
    role.set(null);
  }

  loadingUser.set(false);
});

// === MÉTODO PARA CERRAR SESIÓN ===
export async function logout() {
  await signOut(auth);
  user.set(null);
  userData.set(null);
  isLoggedIn.set(false);
  role.set(null);
}
