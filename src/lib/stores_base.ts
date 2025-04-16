// @ts-nocheck 
import { writable, readable } from 'svelte/store';
import { auth, dbUsers } from '$lib/client';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Estados básicos
export const user = writable(null); // Firebase Auth user
export const userData = writable(null); // Datos del documento en Firestore
export const isLoggedIn = writable(false);
export const role = writable(null);
export const loadingUser = writable(true); // Para saber si aún está cargando
export const sectionTitle = writable('');

// (opcionales)
export const theme = writable('system');
export const time = readable(new Date(), function start(set) {
  const interval = setInterval(() => set(new Date()), 1000);
  return () => clearInterval(interval);
});

// Escuchar cambios de sesión (automático al cargar app)
onAuthStateChanged(auth, async (authUser) => {
  user.set(authUser);
  isLoggedIn.set(!!authUser);

  if (authUser) {
    try {
      const ref = doc(dbUsers, 'users', authUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        userData.set(data);
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
