<script lang="ts">
  import { getFunctions, httpsCallable } from 'firebase/functions';
  import { app } from '$lib/client';

  let isLoading = false;
  let responseMessage = '';
  let errorMessage = '';

  // --- NUEVO: Estado para la prueba de asignar rol ---
  let uidToPromote = '';
  let promoteLoading = false;

  // Función holaMundo (sin cambios)
  async function llamarFuncionHolaMundo() {
    // ... tu lógica existente de holaMundo ...
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
      console.log(`CLIENTE: Preparando para llamar a 'makeUserSuperAdmin' para el UID: ${uidToPromote}`);
      
      const functions = getFunctions(app, 'us-west4');
      const makeAdminCallable = httpsCallable(functions, 'makeUserSuperAdmin');
      
      const result = await makeAdminCallable({ uid: uidToPromote });

      console.log("CLIENTE: Respuesta de 'makeUserSuperAdmin':", result.data);
      responseMessage = JSON.stringify(result.data, null, 2);

    } catch (error: any) {
      console.error("CLIENTE: Error al asignar rol:", error);
      errorMessage = `Código: ${error.code}\nMensaje: ${error.message}`;
    } finally {
      promoteLoading = false;
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