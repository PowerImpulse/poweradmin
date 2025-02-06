<script lang="ts">
  
    import { collection, onSnapshot, getFirestore, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
    import { dbEquipos } from "$lib/client";

    // Referencia a la colección en Firestore
    const equiposData = collection(dbEquipos, "equipos");

    let equipos: any[] = [];

    // Escucha de cambios en la colección
    onSnapshot(equiposData, (querySnapshot) => {
        let listaEquipos: any[] = [];
        querySnapshot.forEach((doc) => {
            let equipo = { ...doc.data(), id: doc.id };
            listaEquipos.push(equipo);
        });
        equipos = listaEquipos;
        // console.log(equipos);
    });

    let accion = "";
    let error = "";

    // Función para crear un nuevo equipo
    const crearEquipo = async () => {
        if (accion.trim() !== "") {
            await addDoc(equiposData, {
                accion,
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
</script>

<div class="panel">
<div class="">
    <input type="text" placeholder="Agregar Equipo" bind:value={accion} />
    <button on:click={crearEquipo}>Agregar</button>
</div>

<ul>
    {#each equipos as equipo (equipo.id)}
        <li class:terminada={equipo.realizada}>
            <span>{equipo.capacidad_500}</span> -
            <span>{equipo.created_at?.toDate().toLocaleString()}</span> -
            <span>{equipo.empresa_501}</span> -
            <span>{equipo.grupo}</span> -
            <span>{equipo.inactivo ? 'Inactivo' : 'Activo'}</span> -
            <span>{equipo.marca_500}</span> -
            <span>{equipo.modelo_500}</span> -
            <span>{equipo.no_serie_500}</span> -
            <span>{equipo.ref_ubic}</span> -
            <span>{equipo.tipo_de_equipo_500}</span>
            <span>
                <button on:click={() => marcarTareaComoCompletada(equipo)}>
                    Completar
                </button>
            </span>
            <span>
                <button on:click={() => eliminarTarea(equipo.id)}>
                    Eliminar
                </button>
            </span>
        </li>
    {:else}
        No hay equipos
    {/each}
    <p class="error">{error}</p>
</ul>
</div>
<svelte:window on:keydown={teclaPresionada} />


<style>
    .terminada {
        text-decoration: line-through;
    }
    .error {
        color: red;
    }
</style>
