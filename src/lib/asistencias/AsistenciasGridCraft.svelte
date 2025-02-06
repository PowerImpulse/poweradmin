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
  let filteredData: Asistencia[] = []; // Variable para almacenar los datos filtrados

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
          startTimeDate: asistencia.startTime.toDate(), // Objeto Date para startTime
          endTimeDate: asistencia.endTime.toDate(), // Objeto Date para endTime
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
      columns: ["username", "description"],
      filter: (row: any, colKey: string) => { 
        const search = (val: string | null) => val != undefined && val.toString().toLocaleLowerCase().includes(textSearch.toLocaleLowerCase());
        return search(row);
      }, 
      active: (textSearch && textSearch.length > 0) ? true : false
    },
    {
      key: 'date-range-filter',
      columns: ['startTimeDate'], // Usamos startTimeDate para el filtro
      filter: (row: any, colKey: string) => {
        if (!startDate && !endDate) return true;

        const cellDate = row[colKey]; // Fecha de la celda (startTimeDate)
        const startDateObj = startDate ? new Date(startDate) : null; // Fecha de inicio
        const endDateObj = endDate ? new Date(endDate) : null; // Fecha de fin

        // Verificar si la fecha de la celda está dentro del rango
        return (
          (!startDateObj || cellDate >= startDateObj) &&
          (!endDateObj || cellDate <= endDateObj)
        );
      },
      active: !!startDate || !!endDate
    }
  ];

  function convertToCSV(data: Asistencia[]): string {
    const headers = [
      "Descripción",
      "Usuario",
      "Email",
      "Entrada",
      "Salida",
      "Ubicación Entrada",
      "Latitud Entrada",
      "Longitud Entrada",
      "Imagen Entrada",
      "Ubicación Salida",
      "Latitud Salida",
      "Longitud Salida",
      "Imagen Salida"
    ];

    const rows = data.map(asistencia => [
      asistencia.description || "", // Descripción
      asistencia.username || "", // Usuario
      asistencia.email || "", // Email
      asistencia.formattedStartTime || "", // Entrada
      asistencia.formattedEndTime || "", // Salida
      asistencia.infoEntrada?.startLocation || "N/A", // Ubicación Entrada
      asistencia.infoEntrada?.startLatitude?.toString() || "N/A", // Latitud Entrada
      asistencia.infoEntrada?.startLongitude?.toString() || "N/A", // Longitud Entrada
      asistencia.infoEntrada?.imageUrl || "N/A", // Imagen Entrada
      asistencia.infoSalida?.endLocation || "N/A", // Ubicación Salida
      asistencia.infoSalida?.endLatitude?.toString() || "N/A", // Latitud Salida
      asistencia.infoSalida?.endLongitude?.toString() || "N/A", // Longitud Salida
      asistencia.infoSalida?.endImageUrl || "N/A" // Imagen Salida
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(field => `"${field}"`).join(","))
    ].join("\n");

    return csvContent;
  }

  function downloadCSV(data: Asistencia[], filename: string) {
    const csvContent = convertToCSV(data);
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); // UTF-8 con BOM
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }
</script>

{#if loading}
  <BarLoader />
{:else}
  <div class="bg-slate-2 p-4 mb-2">
    <input class="w-80 p-1" type="text" placeholder="Filtra por usuario o descripción" bind:value={textSearch} />
    <button
      on:click={() => downloadCSV(filteredData, 'asistencias_filtradas.csv')}
      class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      Exportar datos filtrados a CSV
    </button>
    <div class="bg-slate-2 mb-2">
      <input class="w-80 p-1 ml-2" type="date" bind:value={startDate} placeholder="Fecha de inicio" />
      <input class="w-80 p-1 ml-2" type="date" bind:value={endDate} placeholder="Fecha de fin" />
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
    bind:filters
  />
  <GridFooter bind:paging />
{/if}