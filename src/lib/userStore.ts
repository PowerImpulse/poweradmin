import { writable } from 'svelte/store';
import { auth } from '$lib/client'; // Importa tu instancia de auth
import { onAuthStateChanged, type User } from 'firebase/auth';

interface CurrentUserData {
  user: User | null;
  loading: boolean;
  role?: string; // Aquí guardaremos el rol
}

function createUserStore() {
  const { subscribe, set } = writable<CurrentUserData>({ user: null, loading: true });

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Si el usuario inicia sesión, obtenemos su token de ID para leer los claims
      const tokenResult = await user.getIdTokenResult(true); // true fuerza el refresco
      const role = tokenResult.claims.role as string; // Leemos el rol del token

      set({ user, loading: false, role });
    } else {
      // Si el usuario cierra sesión
      set({ user: null, loading: false, role: undefined });
    }
  });

  return {
    subscribe,
  };
}

export const currentUser = createUserStore();