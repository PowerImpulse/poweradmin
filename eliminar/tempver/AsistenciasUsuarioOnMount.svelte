<script lang="ts">
    import { onMount } from 'svelte';
    import { getAuth, onAuthStateChanged } from 'firebase/auth';
    import { getFirestore, collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
    import { dbTimeRecord, dbUsers } from '$lib/client';
    import { BarLoader } from 'svelte-loading-spinners';
  
    interface Asistencia {
      uid: string;
      userId: string;
      description: string;
      startTime: Timestamp;
      endTime: Timestamp;
      imageUrl: string;
      startLatitude: number;
      startLongitude: number;
      startLocation: string;
      endImageUrl: string;
      endLatitude: number;
      endLongitude: number;
      endLocation: string;
      username?: string;
      createdAt?: Timestamp;
      startImagePath: string;
      endImagePath: string;
    }
  
    let asistenciasConNombre: Asistencia[] = [];
    let loading = true;
  
    onMount(async () => {
      try {
        const asistenciasRef = collection(dbTimeRecord, 'time_record');
        const asistenciasSnapshot = await getDocs(asistenciasRef);
  
        // Crear un mapa para almacenar los usuarios por su UID para mejorar el rendimiento
        const usuariosPorUid = new Map<string, string>();
  
        // Obtener los nombres de usuario de forma más eficiente
        const usuariosRef = collection(dbUsers, 'users');
        const usuariosSnapshot = await getDocs(usuariosRef);
        usuariosSnapshot.docs.forEach(usuarioDoc => {
          const usuario = usuarioDoc.data();
          usuariosPorUid.set(usuario.uid, usuario.username);
        });
  
        // Iterar sobre cada asistencia y obtener el username del mapa
        asistenciasConNombre = asistenciasSnapshot.docs.map(asistenciaDoc => {
          const asistencia = asistenciaDoc.data() as Asistencia;
          return {
            ...asistencia,
            username: usuariosPorUid.get(asistencia.userId) || 'Usuario no encontrado' // Asigna 'Usuario no encontrado' si no se encuentra el usuario
          } as Asistencia;
        });
        
        loading = false;
      } catch (error) {
        console.error('Error al obtener las asistencias:', error);
        // Puedes mostrar un mensaje de error al usuario o realizar alguna otra acción
        loading = false; // Detener el loader en caso de error también
      }
    });
  </script>
  
  {#if loading}
    <BarLoader />
  {:else}
    <ul>
      {#each asistenciasConNombre as asistencia}
        <li>
          Descripción: {asistencia.description}
          Usuario: {asistencia.username || 'No se encontró el usuario'}
        </li>
      {/each}
    </ul>
  {/if}
  