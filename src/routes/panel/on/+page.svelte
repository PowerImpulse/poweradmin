<script lang="ts">
  import { getFunctions, httpsCallable } from 'firebase/functions';
  import { app } from '$lib/client'; // Asegúrate que tu config de cliente apunte al NUEVO proyecto

  let isLoading = false;
  let responseMessage = '';
  let errorMessage = '';

  async function llamarFuncion() {
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
</script>

<svelte:head>
  <title>Prueba de Función Callable</title>
</svelte:head>

<h1>Prueba de Conexión SvelteKit | Cloud Functions (Callable)</h1>

<p>
  Esta página prueba la comunicación básica con una función `onCall`.
</p>

<button on:click={llamarFuncion} disabled={isLoading}>
  {#if isLoading}
    Llamando...
  {:else}
    Llamar a la Función "holaMundo"
  {/if}
</button>

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

<style>
  h1 { margin-bottom: 1rem; }
  p { margin-bottom: 1rem; }
  button { padding: 0.5rem 1rem; font-size: 1rem; }
  .success { margin-top: 1rem; padding: 1rem; background-color: #e6ffed; border: 1px solid #34d399; }
  .error { margin-top: 1rem; padding: 1rem; background-color: #fee2e2; border: 1px solid #ef4444; }
  pre { white-space: pre-wrap; }
</style>