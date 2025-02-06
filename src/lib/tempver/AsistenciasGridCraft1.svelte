<script lang="ts">
  import { collection, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
  import { dbTimeRecord, dbUsers } from '$lib/client';
  import { BarLoader } from 'svelte-loading-spinners';
  import { Grid, GridFooter, type PagingData, type GridColumn } from '@mediakular/gridcraft'; 
  import AsistenciaInfoEntrada from '../asistencias/AsistenciaInfoEntrada.svelte';
  import AsistenciaInfoSalida from '../asistencias/AsistenciaInfoSalida.svelte';

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
    email?: string;
    createdAt?: Timestamp;
    startImagePath: string;
    endImagePath: string;
    infoEntrada: {
      imageUrl: string;
      startLatitude: number;
      startLongitude: number;
      startLocation: string;
    }
    infoSalida:{
    endImageUrl: string;
    endLatitude: number;
    endLongitude: number;
    endLocation: string;

    }
  }

  let asistenciasConNombre: Asistencia[] = [];
  let selectedRows: Asistencia[] = [];
  let showCheckboxes = true;
  let loading = true;

  const asistenciasRef = collection(dbTimeRecord, 'time_record');
  const usuariosRef = collection(dbUsers, 'users');

  const usuariosPorUid = new Map<string, string>();
  getDocs(usuariosRef).then(usuariosSnapshot => {
    usuariosSnapshot.docs.forEach(usuarioDoc => {
      const usuario = usuarioDoc.data();
      usuariosPorUid.set(usuario.uid, usuario.username);
    });

    onSnapshot(asistenciasRef, asistenciasSnapshot => {
      asistenciasConNombre = asistenciasSnapshot.docs.map(asistenciaDoc => {
        const asistencia = asistenciaDoc.data() as Asistencia;
        return {
          ...asistencia,
          username: usuariosPorUid.get(asistencia.userId) || 'Usuario no encontrado',
          formattedStartTime: new Date(asistencia.startTime.toDate()).toLocaleDateString('es-MX', {
            year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'
          }),
          formattedEndTime: new Date(asistencia.endTime.toDate()).toLocaleDateString('es-MX', {
            year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'
          }),
         
        } as Asistencia;
      });
      loading = false;
    });
  }).catch(error => {
    console.error('Error al obtener los usuarios:', error);
    loading = false;
  });

  let paging = {
    itemsPerPage: 10,
    currentPage: 1,
    itemsPerPageOptions: [10, 20, 100]
  } as PagingData;
</script>

{#if loading}
  <BarLoader />
{:else}

    <Grid
      data={asistenciasConNombre}
      {paging}
      bind:selectedRows
      columns={[
        { key: 'description', title: 'Descripción' },
        { key: 'username', title: 'Usuario' },
        { key: 'formattedStartTime', title: 'Entrada' },
        { key: 'formattedEndTime', title: 'Salida' },
        { 
          key: 'infoEntrada', 
          title: 'Ubicación Entrada', 
          renderComponent: AsistenciaInfoEntrada, 
          accessor: (row) => row  
        },
        { 
          key: 'infoSalida', 
          title: 'Ubicación Salida', 
          renderComponent: AsistenciaInfoSalida, 
          accessor: (row) => row 
        },
      ]}
    />
    <GridFooter bind:paging />

{/if}


