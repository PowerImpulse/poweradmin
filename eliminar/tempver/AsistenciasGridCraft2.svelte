<script lang="ts">
  import { getFirestore, collection, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
  import { dbTimeRecord, dbUsers } from '$lib/client';
  import { BarLoader } from 'svelte-loading-spinners';
  import { Grid, GridFooter, type PagingData, type GridColumn  } from '@mediakular/gridcraft'; 

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
    email?:string;
    createdAt?: Timestamp;
    startImagePath: string;
    endImagePath: string;
  }

  let asistenciasConNombre: Asistencia[] = [];

  let selectedRows:Asistencia[] = [];
  let showCheckboxes = true;
  
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
  let paging = {
    itemsPerPage: 15,
    currentPage: 1,
    itemsPerPageOptions: [10, 15, 20, 50]
} as PagingData;
</script>

{#if loading}
  <BarLoader />
{:else}



  <ul>
   
    <Grid
    data={asistenciasConNombre} {paging} bind:selectedRows 
    columns={[ 
      { key: 'description', title: 'Descripción' },
      { key: 'username', title: 'Usuario' },
      { key: 'startTime', title: 'Entrada'},
 
    ]}
    
  />
  <GridFooter bind:paging />
  
  </ul>
{/if}
