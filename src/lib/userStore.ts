// src/lib/stores/userStore.ts
import { writable } from 'svelte/store';
import { auth } from '$lib/client';
import { onAuthStateChanged, type User } from 'firebase/auth';

interface CurrentUserData {
  user: User | null;
  loading: boolean;
  role?: string;
}

function createUserStore() {
  const { subscribe, set } = writable<CurrentUserData>({ user: null, loading: true });

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("USERSTORE: Usuario detectado. Forzando refresco del token...");
      const tokenResult = await user.getIdTokenResult(true); // true fuerza el refresco
      
      // --- ¡LÍNEA DE DEPURACIÓN CLAVE! ---
      console.log("USERSTORE: Contenido completo de los claims del token:", tokenResult.claims);
      // ------------------------------------

      const role = tokenResult.claims.role as string;

      set({ user, loading: false, role });
    } else {
      console.log("USERSTORE: No hay usuario. Sesión cerrada.");
      set({ user: null, loading: false, role: undefined });
    }
  });

  return {
    subscribe,
  };
}

export const currentUser = createUserStore();