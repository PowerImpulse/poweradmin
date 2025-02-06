<script lang="ts">
    import { collection, onSnapshot,  doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
    import { dbEquipos } from "$lib/client";
    import { Grid, h } from 'gridjs';
    import 'gridjs/dist/theme/mermaid.css';
    import { onMount } from 'svelte';
  
    // Referencia a la colección en Firestore
    const colRef = collection(dbEquipos, "equipos");
  
    let equipos: any[] = [];
    let grid: Grid;
  
    // Escucha de cambios en la colección
    onSnapshot(colRef, (querySnapshot) => {
      let listaEquipos: any[] = [];
      querySnapshot.forEach((doc) => {
        let equipo = { ...doc.data(), id: doc.id };
        listaEquipos.push(equipo);
      });
      equipos = listaEquipos;
      updateGrid();
    });
  
    let accion = "";
    let error = "";
  
    // Función para crear un nuevo equipo
    const crearEquipo = async () => {
      if (accion.trim() !== "") {
        await addDoc(colRef, {
          accion: accion,
          realizada: false,
          creada: new Date(),
        });
        error = "";
      } else {
        error = "El campo está vacío";
      }
      accion = "";
    };
  
    // Función para marcar un equipo como completado
    const marcarTareaComoCompletada = async (equipo: any) => {
      await updateDoc(doc(dbEquipos, "equipos", equipo.id), {
        realizada: !equipo.realizada,
      });
    };
  
    // Función para eliminar un equipo
    const eliminarTarea = async (id: string) => {
      await deleteDoc(doc(dbEquipos, "equipos", id));
    };
  
    // Función para manejar la tecla presionada
    const teclaPresionada = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        crearEquipo();
      }
    };
  
    // Función para actualizar la tabla de Grid.js
    const updateGrid = () => {
      if (grid) {
        grid.updateConfig({
          data: equipos.map((equipo, index) => [
            equipo.capacidad_500,
            equipo.created_at?.toDate().toLocaleString(),
            equipo.empresa_501,
            equipo.grupo,
            equipo.inactivo ? 'Inactivo' : 'Activo',
            equipo.marca_500,
            equipo.modelo_500,
            equipo.no_serie_500,
            equipo.ref_ubic,
            equipo.tipo_de_equipo_500,
            h('button', {
              onClick: () => marcarTareaComoCompletada(equipo)
            }, 'Completar'),
            h('button', {
              onClick: () => eliminarTarea(equipo.id)
            }, 'Eliminar')
          ])
        }).forceRender();
      }
    };
  
    // Inicializar la tabla de Grid.js
    onMount(() => {
      grid = new Grid({
        columns: [
          'Tipo de Equipo',
          'Capacidad',
          'Empresa',
          'Fecha de Creación',
          'Grupo',
          'Estado',
          'Marca',
          'Modelo',
          'No. de Serie',
          'Referencia de Ubicación',
          {
            name: 'Acciones',
            formatter: (_, row) => [
              h('button', {
                onClick: () => marcarTareaComoCompletada(equipos[row.cellIndex ])
              }, 'Completar'),
              h('button', {
                onClick: () => eliminarTarea(equipo.id)
              }, 'Eliminar')
            ]
          }
        ],
        search: true,
        pagination: {
          limit: 10
        },
        data: equipos.map((equipo) => [
          equipo.capacidad_500,
          equipo.created_at?.toDate().toLocaleString(),
          equipo.empresa_501,
          equipo.grupo,
          equipo.inactivo ? 'Inactivo' : 'Activo',
          equipo.marca_500,
          equipo.modelo_500,
          equipo.no_serie_500,
          equipo.ref_ubic,
          equipo.tipo_de_equipo_500,
          h('button', {
            onClick: () => marcarTareaComoCompletada(equipo)
          }, 'Completar'),
          h('button', {
            onClick: () => eliminarTarea(equipo.id)
          }, 'Eliminar')
        ])
      }).render(document.getElementById('gridjs-wrapper') as HTMLElement);
    });
  </script>
  
 
    <div class="">
      <input type="text" placeholder="Agregar Equipo" bind:value={accion} />
      <button on:click={crearEquipo}>Agregar</button>
    </div>
    <div id="gridjs-wrapper"></div>
    <p class="error">{error}</p>

  
  <svelte:window on:keydown={teclaPresionada} />
  
  <style>
    .error {
      color: red;
    }
  </style>
  