<script lang="ts">
    import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
    import { dbEquipos } from "$lib/client";
    import { Grid, GridFooter, type PagingData, type GridColumn,  type GridFilter } from '@mediakular/gridcraft'; 
    import Modal from "$lib/components/ui/Modal.svelte";
    import AddLarge from "carbon-icons-svelte/lib/AddLarge.svelte";
    import type { Equipo } from '$lib/types'
  
    const equiposCollection = collection(dbEquipos, "equipos");
    
    let equipos: Equipo[];
    let loading = true;
    let error = "";
    
    // Campos del formulario∏
    let marca_500 = "";
    let modelo_500 = "";
    let no_serie_500 = "";
    let capacidad_500 = "";
    let empresa_501 = "";
    let tipo_de_equipo_500 = "";
    let grupo = "";
    let ref_ubic = "";
    let inactivo = false;
  
    onSnapshot(equiposCollection, (querySnapshot) => {

        equipos = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at
        })) ;
        loading = false;
    }) ;
  
    const crearEquipo = async () => {
        const requiredFields = [
            marca_500, 
            modelo_500, 
            no_serie_500, 
            capacidad_500, 
            empresa_501, 
            tipo_de_equipo_500,
            grupo,
            ref_ubic
        ];
        
        if (requiredFields.every(field => field.trim() !== "")) {
            try {
                await addDoc(equiposCollection, {
                    marca_500,
                    modelo_500,
                    no_serie_500,
                    capacidad_500,
                    empresa_501,
                    tipo_de_equipo_500,
                    grupo,
                    ref_ubic,
                    inactivo,
                    created_at: new Date()
                });
                error = "";
                // Resetear campos
                marca_500 = modelo_500 = no_serie_500 = capacidad_500 = 
                empresa_501 = tipo_de_equipo_500 = grupo = ref_ubic = "";
                inactivo = false;
            } catch (e: any) {
                error = `Error al crear equipo: ${e.message}`;
            }
        } else {
            error = "Todos los campos obligatorios deben ser llenados";
        }
    };
  
    let columns: GridColumn<Equipo>[] = [
        { key: 'marca_500', title: 'Marca' },
        { key: 'modelo_500', title: 'Modelo' },
        { key: 'no_serie_500', title: 'N° Serie' },
        { key: 'capacidad_500', title: 'Capacidad' },
        { key: 'empresa_501', title: 'Empresa' },
        { key: 'tipo_de_equipo_500', title: 'Tipo de Equipo' },
        { key: 'grupo', title: 'Grupo' },
        { key: 'ref_ubic', title: 'Ubicación' },
        { key: 'inactivo', title: 'Inactivo' },
     
    ];
  
    let paging = {
        itemsPerPage: 50,
        currentPage: 1,
        itemsPerPageOptions: [10, 50, 100]
    } as PagingData;
    
    let showModal = false;

///////////// CHECK FILTROS /////////////////////




///////////// CHECK FILTROS /////////////////////


  </script>
  
  <div class="bar-actions pb-16 flex justify-end">
      <button class="rounded-full flex ic gap-4" on:click={() => (showModal = true)}> 
          Nuevo Equipo<AddLarge size={32} /> 
      </button> 
  </div>
  
  {#if loading}
    <p>Cargando...</p>
  {:else}
    <p class="error">{error}</p>
    <Grid data={equipos} {paging} {columns}  />
    <GridFooter bind:paging />
  {/if}
  
  <Modal bind:showModal>
      <h3 class="text-20">Registrar Nuevo Equipo</h3>
      <div class="flex flex-col gap-4 p-4 lg:p-8">
          <input type="text" placeholder="Marca" bind:value={marca_500} />
          <input type="text" placeholder="Modelo" bind:value={modelo_500} />
          <input type="text" placeholder="Número de Serie" bind:value={no_serie_500} />
          <input type="text" placeholder="Capacidad" bind:value={capacidad_500} />
          <input type="text" placeholder="Empresa" bind:value={empresa_501} />
          <input type="text" placeholder="Tipo de Equipo" bind:value={tipo_de_equipo_500} />
          <input type="text" placeholder="Grupo" bind:value={grupo} />
          <input type="text" placeholder="Referencia de Ubicación" bind:value={ref_ubic} />
          <label>
              <input type="checkbox" bind:checked={inactivo} /> 
              Inactivo
          </label>
          <button on:click={crearEquipo}>Registrar Equipo</button>
          <p class="error">{error}</p>
      </div>
  </Modal>
  
  <style>
    .error {
        color: red;
    }
    input{
    --at-apply:  p-4 border-2 border-zinc-5 text-4  ;
   
  }
    
  </style>
