<script lang="ts">
  import { getFunctions, httpsCallable } from 'firebase/functions';
  import { app } from '$lib/client';

  let isLoading = false;
  let responseMessage = '';
  let errorMessage = '';

  // --- NUEVO: Estado para la prueba de asignar rol ---
  let uidToPromote = '';
  let promoteLoading = false;

    let uidToDelete = '';
  let deleteLoading = false;


  // Función holaMundo (sin cambios)
  async function llamarFuncionHolaMundo() {
     isLoading = true;
    responseMessage = '';
    errorMessage = '';

    try {
      console.log("CLIENTE: Preparando para llamar a la función 'holaMundo'...");
      
      const functions = getFunctions(app, 'us-west4'); // Usa tu región
      const holaMundoCallable = httpsCallable(functions, 'holaMundo');
      
      // Enviamos un objeto de datos simple para ver si llega
      const datosDePrueba = {
        mensajeCliente: "Hola, servidor",
        timestampCliente: new Date().toISOString()
      };
      console.log("CLIENTE: Enviando datos:", datosDePrueba);

      const result = await holaMundoCallable(datosDePrueba);

      console.log("CLIENTE: Respuesta recibida del servidor:", result.data);
      responseMessage = JSON.stringify(result.data, null, 2);

    } catch (error: any) {
      console.error("CLIENTE: Error al llamar la función:", error);
      errorMessage = `Código: ${error.code}\nMensaje: ${error.message}`;
    } finally {
      isLoading = false;
    }
  }

  // --- NUEVA FUNCIÓN: Llamar a makeUserSuperAdmin ---
   async function llamarFuncionAsignarRol() {
    if (!uidToPromote.trim()) {
      errorMessage = "Por favor, introduce un UID.";
      return;
    }
    promoteLoading = true;
    responseMessage = '';
    errorMessage = '';
    try {
      const functions = getFunctions(app, 'us-west4');
      // --- CAMBIO: Apunta a la nueva función 'makeAdminTest' ---
      const makeAdminCallable = httpsCallable(functions, 'makeAdminTest');
      const result = await makeAdminCallable({ uid: uidToPromote });
      responseMessage = JSON.stringify(result.data, null, 2);
    } catch (error: any) {
      errorMessage = `Código: ${error.code}\nMensaje: ${error.message}`;
    } finally {
      promoteLoading = false;
    }
  }

    // --- NUEVA FUNCIÓN: Llamar a deleteUserTest ---
  async function llamarFuncionEliminar() {
    if (!uidToDelete.trim()) {
      errorMessage = "Por favor, introduce un UID para eliminar.";
      return;
    }
    if (!confirm(`¿Estás SEGURO de que quieres eliminar al usuario ${uidToDelete} de AUTHENTICATION? Esta acción no se puede deshacer.`)) {
      return;
    }

    deleteLoading = true;
    responseMessage = '';
    errorMessage = '';

    try {
      console.log(`CLIENTE: Preparando para llamar a 'deleteUserTest' para el UID: ${uidToDelete}`);
      
      const functions = getFunctions(app, 'us-west4');
      const deleteUserCallable = httpsCallable(functions, 'deleteUserTest');
      
      const result = await deleteUserCallable({ uid: uidToDelete });

      console.log("CLIENTE: Respuesta de 'deleteUserTest':", result.data);
      responseMessage = JSON.stringify(result.data, null, 2);

    } catch (error: any) {
      console.error("CLIENTE: Error al eliminar usuario:", error);
      errorMessage = `Código: ${error.code}\nMensaje: ${error.message}`;
    } finally {
      deleteLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Pruebas Cruzadas de Funciones</title>
</svelte:head>

<h1>Pruebas de Conexión</h1>

<hr/>

<h2>Prueba 1: "Hola Mundo" (onCall)</h2>
<p>Verifica la comunicación básica y la recepción del contexto de Auth.</p>
<button on:click={llamarFuncionHolaMundo} disabled={isLoading}>
  {#if isLoading}Llamando...{:else}Llamar a "holaMundo"{/if}
</button>

<hr style="margin-top: 2rem; margin-bottom: 2rem;"/>

<h2>Prueba 2: Asignar Rol de Superadmin (onCall)</h2>
<p>Verifica si una función que requiere permisos de admin puede ejecutarse.</p>
<div>
  <label for="uid">UID del usuario a promover:</label>
  <input type="text" id="uid" bind:value={uidToPromote} placeholder="Pega el UID aquí" style="width: 300px;"/>
</div>
<button on:click={llamarFuncionAsignarRol} disabled={promoteLoading} style="margin-top: 1rem;">
  {#if promoteLoading}Asignando...{:else}Hacer Superadmin{/if}
</button>

<!-- --- NUEVA SECCIÓN DE PRUEBA --- -->
<h2>Prueba 3: Eliminar Usuario (Solo de Authentication)</h2>
<p>
  Verifica si tu usuario superadmin puede ejecutar una acción destructiva en otro usuario.
</p>
<div>
  <label for="uid-delete">UID del usuario a eliminar de Auth:</label>
  <input type="text" id="uid-delete" bind:value={uidToDelete} placeholder="Pega el UID aquí" style="width: 300px;"/>
</div>
<button on:click={llamarFuncionEliminar} disabled={deleteLoading} style="margin-top: 1rem;">
  {#if deleteLoading}Eliminando...{:else}Eliminar de Auth{/if}
</button>


<!-- Sección de Resultados (común para ambas pruebas) -->
{#if responseMessage}
  <div class="success">
    <h2>Respuesta del Servidor:</h2>
    <pre>{responseMessage}</pre>
  </div>
{/if}

{#if errorMessage}
  <div class="error">
    <h2>Error:</h2>
    <pre>{errorMessage}</pre>
  </div>
{/if}

<!-- Estilos ... -->
<style>
  /* ... tus estilos de success/error ... */
</style>