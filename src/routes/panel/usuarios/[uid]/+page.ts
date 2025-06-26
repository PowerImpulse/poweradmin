// src/routes/panel/usuarios/usuario/[uid]/+page.ts
import { doc, getDoc } from 'firebase/firestore';
import { db } from '$lib/client'; // Asegúrate que la ruta sea correcta
import type { PageLoad } from './$types';
import type { DatosUsuario } from '$lib/types'; // Importa el tipo completo
import { error } from '@sveltejs/kit'; // Para manejar errores

export const load: PageLoad = async ({ params }) => {
    const uid = params.uid; // Obtiene el 'uid' de la URL

    if (!uid) {
        throw error(400, 'UID de usuario no proporcionado');
    }

    try {
        const userDocRef = doc(db, 'users', uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            // Obtiene los datos y los castea al tipo DatosUsuario
            // Asegúrate de incluir el uid, ya que doc.data() no lo incluye
            const userData = { ...userDocSnap.data(), uid: userDocSnap.id } as DatosUsuario;

            // Convertir Timestamps de Firestore a Date si es necesario (ej. created_at, fecha_ingreso)
            // Firestore puede devolver Timestamps, ISO strings, o Date dependiendo de la config/versión
            // Es buena práctica asegurarse de que sean objetos Date o strings consistentes
            if (userData.created_at && typeof userData.created_at === 'object' && 'toDate' in userData.created_at) {
               // @ts-ignore // Firestore Timestamp tiene toDate()
               userData.created_at = userData.created_at.toDate().toISOString(); // O .toLocaleString() si prefieres
            }
             if (userData.fecha_ingreso && typeof userData.fecha_ingreso === 'object' && 'toDate' in userData.fecha_ingreso) {
               // @ts-ignore
               userData.fecha_ingreso = userData.fecha_ingreso.toDate().toISOString();
            }
             // Añade conversiones similares para otras fechas si las tienes

            return {
                usuario: userData // Pasamos los datos del usuario a la página
            };
        } else {
            // Usuario no encontrado
            throw error(404, 'Usuario no encontrado');
        }
    } catch (err: any) {
        console.error("Error al cargar datos del usuario:", err);
        // Lanza un error genérico para que SvelteKit lo maneje
        throw error(500, `Error al cargar el perfil del usuario: ${err.message}`);
    }
};