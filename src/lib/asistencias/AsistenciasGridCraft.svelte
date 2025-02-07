<script lang="ts">
  import {
    collection,
    onSnapshot,
    getDocs,
    Timestamp,
    where,
    query,
    Query,
  } from "firebase/firestore";
  import { dbTimeRecord, dbUsers } from "$lib/client";
  import { BarLoader } from "svelte-loading-spinners";
  import {
    Grid,
    GridFooter,
    type PagingData,
    type GridColumn,
    type GridFilter,
  } from "@mediakular/gridcraft";
  import AsistenciaInfoEntrada from "$lib/asistencias/AsistenciaInfoEntrada.svelte";
  import AsistenciaInfoSalida from "$lib/asistencias/AsistenciaInfoSalida.svelte";
  import type { Usuario, Asistencia } from "$lib/types";
  import { exportToCSV } from "$lib/helpers/exportToCSV";

  let asistenciasConNombre: Asistencia[] = [];
  let selectedRows: Asistencia[] = [];
  let showCheckboxes = true;
  let loading = true;
  let errorMessage = "";

  const asistenciasRef = collection(dbTimeRecord, "time_record");
  const usuariosRef = collection(dbUsers, "users");

  let startDate: string = "";
  let endDate: string = "";

  const usuariosPorUid = new Map<string, string>();

  getDocs(usuariosRef)
    .then((usuariosSnapshot) => {
      usuariosSnapshot.docs.forEach((usuarioDoc) => {
        const usuario = usuarioDoc.data();
        usuariosPorUid.set(usuario.uid, usuario.username);
      });

      cargarAsistencias();
    })
    .catch((error) => {
      console.error("Error al obtener los usuarios:", error);
      loading = false;
    });

  const cargarAsistencias = () => {
    let asistenciasQuery: Query = collection(dbTimeRecord, "time_record");

    if (startDate || endDate) {
      const startTimestamp = startDate
        ? Timestamp.fromDate(new Date(startDate))
        : null;
      const endTimestamp = endDate
        ? Timestamp.fromDate(new Date(endDate))
        : null;

      const filtros = [];
      if (startTimestamp)
        filtros.push(where("startTime", ">=", startTimestamp));
      if (endTimestamp) filtros.push(where("startTime", "<=", endTimestamp));

      asistenciasQuery = query(asistenciasQuery, ...filtros);
    }

    onSnapshot(asistenciasQuery, (asistenciasSnapshot) => {
      asistenciasConNombre = asistenciasSnapshot.docs.map((asistenciaDoc) => {
        const asistencia = asistenciaDoc.data() as Asistencia;
        return {
          ...asistencia,
          username:
            usuariosPorUid.get(asistencia.userId) || "Usuario no encontrado",
          formattedStartTime: new Date(
            asistencia.startTime.toDate()
          ).toLocaleDateString("es-MX", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
          }),
          formattedEndTime: new Date(
            asistencia.endTime.toDate()
          ).toLocaleDateString("es-MX", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
          }),
        } as Asistencia;
      });
      loading = false;
    });
  };

  $: if (startDate || endDate) {
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      errorMessage =
        "La fecha de fin no puede ser menor que la fecha de inicio.";
    } else {
      errorMessage = "";
      loading = true;
      cargarAsistencias();
    }
  }

  let paging = {
    itemsPerPage: 10,
    currentPage: 1,
    itemsPerPageOptions: [10, 20, 100],
  } as PagingData;

  // FILTERS
  let textSearch = "";
  let filters: GridFilter[];
  $: filters = [
    {
      key: "text-search",
      columns: ["username", "description", "formattedStartTime"],
      filter: (row: any, colKey: string) => {
        const search = (val: string | null) =>
          val != undefined &&
          val
            .toString()
            .toLocaleLowerCase()
            .includes(textSearch.toLocaleLowerCase());
        return search(row);
      },
      active: textSearch && textSearch.length > 0 ? true : false,
    },
  ];

  const generateCSV = () => {
    const headers = [
      "description",
      "username",
      "startTime",
      "endTime",
      "imageUrl",
      "startLatitude",
      "startLongitude",
      "startLocation",
      "endImageUrl",
      "endLatitude",
      "endLongitude",
      "endLocation",
    ];

    exportToCSV(headers, asistenciasConNombre, "asistencias");
  };
</script>

{#if loading}
  <BarLoader />
{:else}
  <div class="bg-slate-2 shadow-md p-4 mb-4 border border-gray-300">
    <h2 class="text-lg font-semibold mb-3 text-gray-800">
      Filtros
    </h2>

    <div class="grid grid-cols-1 lg:grid-cols-2">
      <div class="flex flex-col w-full pr-4">
        <label class="text-sm font-medium text-gray-700 mb-1">Buscar</label>
        <input
          type="text"
          class="border border-gray-400 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none w-full"
          placeholder="Filtra por usuario o descripción"
          bind:value={textSearch}
        />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 mt-4">
      <div class="grid grid-cols-2 gap-4 w-full pr-4">
        <div class="flex flex-col">
          <label class="text-sm font-medium text-gray-700 mb-1"
            >Fecha de Inicio</label
          >
          <input
            type="date"
            class="border border-gray-400 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none w-full"
            bind:value={startDate}
          />
        </div>

        <div class="flex flex-col">
          <label class="text-sm font-medium text-gray-700 mb-1"
            >Fecha de Fin</label
          >
          <input
            type="date"
            class="border border-gray-400 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none w-full"
            bind:value={endDate}
          />
        </div>
      </div>
    </div>

    {#if errorMessage}
      <p class="text-red-600 font-semibold mt-3">{errorMessage}</p>
    {/if}

    <div class="flex justify-end mt-4">
      <button
        class="bg-blue-500 text-white font-semibold py-2 px-4"
        on:click={generateCSV}
      >
        Exportar a CSV
      </button>
    </div>
  </div>

  <Grid
    data={asistenciasConNombre}
    {paging}
    bind:selectedRows
    columns={[
      { key: "description", title: "Descripción" },
      { key: "username", title: "Usuario" },
      { key: "formattedStartTime", title: "Entrada" },
      { key: "formattedEndTime", title: "Salida" },
      {
        key: "infoEntrada",
        title: "Ubicación Entrada",
        renderComponent: AsistenciaInfoEntrada,
        accessor: (row) => row,
      },
      {
        key: "infoSalida",
        title: "Ubicación Salida",
        renderComponent: AsistenciaInfoSalida,
        accessor: (row) => ({
          endImageUrl: row.endImageUrl,
          endLatitude: row.endLatitude,
          endLongitude: row.endLongitude,
          endLocation: row.endLocation,
        }),
      },
    ]}
    bind:filters
  />
  <GridFooter bind:paging />
{/if}

<div class="py-8 text-center">Tabla de asistencias</div>
