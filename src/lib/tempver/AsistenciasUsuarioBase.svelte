<script lang="ts">
  import { getFirestore, collection, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
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

  const asistenciasRef = collection(dbTimeRecord, 'time_record');
  const usuariosRef = collection(dbUsers, 'users');

  // Obtener usuarios una vez y almacenarlos en un mapa
  const usuariosPorUid = new Map<string, string>();
  getDocs(usuariosRef).then(usuariosSnapshot => {
    usuariosSnapshot.docs.forEach(usuarioDoc => {
      const usuario = usuarioDoc.data();
      usuariosPorUid.set(usuario.uid, usuario.username);
    });

    // Suscribirse a las actualizaciones en tiempo real de las asistencias
    onSnapshot(asistenciasRef, asistenciasSnapshot => {
      asistenciasConNombre = asistenciasSnapshot.docs.map(asistenciaDoc => {
        const asistencia = asistenciaDoc.data() as Asistencia;
        return {
          ...asistencia,
          username: usuariosPorUid.get(asistencia.userId) || 'Usuario no encontrado'
        } as Asistencia;
      });
      loading = false;
    });
  }).catch(error => {
    console.error('Error al obtener los usuarios:', error);
    loading = false;
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

