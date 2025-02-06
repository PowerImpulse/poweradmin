<script lang="ts">
    //https://youtu.be/Npc_MOXZKjM?si=sTF4IbrQUhZipEcQ TERMINADO 

    import { initializeApp, getApps, getApp } from "firebase/app";
    import { collection,  onSnapshot, getFirestore, QuerySnapshot, doc, updateDoc, deleteDoc , addDoc} from "firebase/firestore";
    import { dbTareas } from "$lib/client";

  
    const colRef = collection(dbTareas, "tareas");
    //console.log(colRef);

    let tareas: any[] = []; 

   onSnapshot(colRef, (QuerySnapshot) => {∏
        let firebaseTareas: any[] = [];
        QuerySnapshot.forEach((doc) => {
            let tarea = { ...doc.data(), id: doc.id };
            firebaseTareas.push(tarea); // Utiliza push para agregar la tarea al array
        });

        // Ahora, firebaseTareas es un array de tareas y puedes asignarlo a la variable tareas
        tareas = firebaseTareas;
        // console.log(tareas);
        
    });

    let accion = "";
    let error = "";

    const agregarTarea = async () => {
        
        if (accion !== "") {
            const colRef = await addDoc(collection(dbTareas, "tareas"),{
                accion: accion,
                realizada: false,
                creada: new Date(),
            })
          error = ""
        } else {
            error = "El campo esta vacio";
        }
        accion = "";
    };

    const marcarTareaComoCompletada = async (tarea:any) => {
        await updateDoc(doc(dbTareas, "tareas", tarea.id),{
            realizada:!tarea.realizada,
        })

    };

    const eliminarTarea = async (tarea:any) => {
        await deleteDoc(doc(dbTareas, "tareas", tarea))
    };

    const teclaPresionada = (e: KeyboardEvent) => {
        // console.log(e);
        if (e.key === "Enter") {
            agregarTarea();
        }
    };

    //$: console.table(tareas);
</script>

<a href="/tareas">Tareas Base</a>
<hr />
<br />
<div>
<input type="text" placeholder="Agregar Tarea" bind:value={accion} />
<button on:click={agregarTarea}>Agregar</button>
</div>

<ul>
    {#each tareas as tarea}
        <li class:terminada={tarea.realizada}>
            <span> {tarea.accion}</span>
            <span>
                <button on:click={() => marcarTareaComoCompletada(tarea)}>
                    Completar
                </button></span
            >
            <span>
                <button on:click={() => eliminarTarea(tarea.id)}>
                    Eliminar
                </button></span
            >
        </li>
    {:else}
        No hay tareas
    {/each}
    <p class="error">{error}</p>
</ul>

<svelte:window on:keydown={teclaPresionada} />

<hr />
<br />

<style>
    .terminada {
        text-decoration: line-through;
    }
    .error {
        color: red;
    }
</style>
