// src/routes/usuarios/[uid]/+page.ts
import { dbUsers } from '$lib/client';
import { doc, getDoc } from 'firebase/firestore';
import type { PageLoad } from './$types';
import type { DatosUsuario } from '$lib/types'; // Ajusta la ruta a tu archivo de tipos
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
  const uid = params.uid; // Obtiene el 'uid' de la URL

  if (!uid) {
    throw error(400, 'UID de usuario no proporcionado');
  }

  try {
   
    const userDocRef = doc(dbUsers, 'users', uid); // Referencia al documento usando uid como ID
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data() as DatosUsuario; // Asegúrate que los datos coinciden
       // Convierte Timestamps de Firestore a strings o Date si es necesario aquí
       const processedData = {
        ...userData,
        // Procesa otras fechas si las tienes como Timestamps
       };

      return {
        profileUser: processedData // Pasa los datos a la página .svelte
      };
    } else {
      // Usuario no encontrado con ese UID como ID de documento
      throw error(404, 'Usuario no encontrado');
    }
  } catch (err: any) {
    console.error("Error fetching user profile: ", err);
    // Podrías lanzar errores más específicos basados en err.code si es de Firebase
     throw error(500, 'Error al cargar el perfil del usuario');
  }
};