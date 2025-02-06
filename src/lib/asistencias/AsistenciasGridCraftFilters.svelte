<script lang="ts">
  import { collection, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
  import { dbTimeRecord, dbUsers } from '$lib/client';
  import { BarLoader } from 'svelte-loading-spinners';
  import { Grid, GridFooter, type PagingData, type GridColumn, type GridFilter } from '@mediakular/gridcraft'; 
  import AsistenciaInfoEntrada from '$lib/asistencias/AsistenciaInfoEntrada.svelte';
  import AsistenciaInfoSalida from '$lib/asistencias/AsistenciaInfoSalida.svelte';
  import type { Usuario, Asistencia } from '$lib/types' 


  let asistenciasConNombre: Asistencia[] = [];
  let selectedRows: Asistencia[] = [];
  let showCheckboxes = true;
  let loading = true;

  const asistenciasRef = collection(dbTimeRecord, 'time_record');
  const usuariosRef = collection(dbUsers, 'users');

  let startDate: string = "";
  let endDate: string = "";

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


// FILTERS
  let textSearch = "";
  let filters: GridFilter[];
  $: filters = [ 
  {
            key: "text-search",
            columns: ["username", "description", "formattedStartTime", "infoEntrada", "infoSalida" ],
            filter: (row: any, colKey: string) => { 
                const search = (val: string | null) => val != undefined && val.toString().toLocaleLowerCase().includes(textSearch.toLocaleLowerCase());
                return search(row)
            }, 
            active:true
        },
        {
    key: 'date-range-filter',
    columns: ['formattedStartTime', 'formattedEndTime'],
    filter: (row: any, colKey: string) => {
      if (!startDate && !endDate) return true;

      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      const cellDate = new Date(row);
      return (!startDate || cellDate >= startDateObj) && (!endDate || cellDate <= endDateObj);
    },
    active: !!startDate || !!endDate
  }
];

</script>

{#if loading}
  <BarLoader />
{:else}
<div class="flex bg-slate-2 p-4 mb-2 ">
<input class="w-80 p-1" type="text" placeholder="Filtra por usuario o descripción" bind:value={textSearch} />
<div><input type="date" bind:value={startDate} placeholder="Fecha de inicio" class="p-1" />
<input type="date" bind:value={endDate} placeholder="Fecha de fin" class="p-1" />
</div>

</div>

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
          accessor: (row) => ({
          endImageUrl: row.endImageUrl,
          endLatitude: row.endLatitude,
          endLongitude: row.endLongitude,
          endLocation: row.endLocation
        })
        },
      ]}
    bind:filters  />
    <GridFooter bind:paging />

{/if}

<div class="py-8 text-center">
  Tabla de asistencias
</div>


