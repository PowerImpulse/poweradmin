<script>
// @ts-nocheck

    // let listas = ["Uno","Dos","Tres"]



    let tareas = []
    let accion =""
   

    const agregarTarea = ()=>{
        let tarea = {
            accion:accion,
            esCompletada: false,
            Creada: new Date(),

    }    

            tareas = [...tareas, tarea ]
          
    }

const marcarTareaComoCompletada = (index)=>{
    //console.table(index)
    // tareas[index].esCompletada = true
    tareas[index].esCompletada = !tareas[index].esCompletada; // toggle

}

const eliminarTarea = (index)=>{
    let eliminarItem = tareas[index]
    tareas = tareas.filter( (item)=> item != eliminarItem  )
}

$: console.table(tareas);
</script>


<!-- <ul>
    {#each tareas as {Tarea, esCompletada, Creada}}
           <li> {Tarea}</li>
    {/each}
</ul> -->
<input type="text" placeholder="Agregar Tarea" bind:value={accion}>
<button on:click={agregarTarea} >Agregar</button>
<ul>
    {#each tareas as {accion, esCompletada, Creada}, index}
 
           
        <li class:terminada={esCompletada}>
            <span> {accion}</span>
            <span> <button on:click={()=> marcarTareaComoCompletada(index)}>Completar </button></span>
            <span> <button on:click={()=> eliminarTarea(index)}>Eliminar </button></span>
        </li>
        {:else}
        No hay tareas
          
    {/each}
    
</ul>



<!-- {#each listas as lista}
           <li> {lista}</li>
    {/each} -->
    <hr> <br>
<style>
.terminada{
    text-decoration: line-through;
}

</style>