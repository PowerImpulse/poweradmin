<!-- Asegúrate de que este es tu componente de formulario -->
<script lang="ts">
   // Importa solo 'httpsCallable' del paquete 'firebase/functions'
  import { httpsCallable } from 'firebase/functions'; 
  
  // ¡Importa directamente 'functions' (y 'app' si aún la necesitas para otras cosas) desde $lib/client!
  import { functions } from '$lib/client'; // <--- ¡CAMBIO AQUÍ!

  // --- ESTADO DEL FORMULARIO ---
  let email = 'test@uno.com';
  let password = '1234abc';
  let username = 'testuno';
  let role = 'tecnico'; // Valor por defecto

  // Estado de la UI
  let isLoading = false;
  let errorMessage = '';
  let successMessage = '';

  async function handleRegister() {
    isLoading = true;
    errorMessage = '';
    successMessage = '';

    try {
      const dataToSend = {
        email: email,
        password: password,
        username: username,
        role: role,
      };
      
      console.log("CLIENTE: Datos que se van a enviar:", dataToSend);

      if (!dataToSend.email || !dataToSend.password) {
        throw new Error("Por favor, rellena el email y la contraseña.");
      }
      
      // ¡Ahora usamos la instancia 'functions' que ya importamos y que viene de $lib/client!
      const createUserCallable = httpsCallable(functions, 'createUser'); // <--- ¡CAMBIO AQUÍ!
      const result = await createUserCallable(dataToSend);

      successMessage = `Éxito: ${(result.data as any).message}`;
      
    } catch (error: any) {
      console.error("Error en el formulario:", error);
      errorMessage = `Error: ${error.message}`;
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="w-80 p-10">
<h3 class="mb-8">Crear Nuevo Usuario (Prueba)</h3>
<form on:submit|preventDefault={handleRegister} >
  
  <div class="form-field">
    <label for="username">Nombre de Usuario:</label>
    <!-- ¡VERIFICA ESTE BIND! -->
    <input type="text" id="username" bind:value={username} required>
  </div>
  
  <div class="form-field">
    <label for="email">Correo Electrónico:</label>
    <!-- ¡VERIFICA ESTE BIND! -->
    <input type="email" id="email" bind:value={email} required>
  </div>

  <div class="form-field">
    <label for="password">Contraseña:</label>
    <!-- ¡VERIFICA ESTE BIND! -->
    <input type="password" id="password" bind:value={password} required minlength="6">
  </div>

  <!-- Puedes añadir el selector de rol si quieres, pero no es necesario para esta prueba -->
  
  <button type="submit" disabled={isLoading} class="bg-blue-8 text-white p-3" >
    {#if isLoading}
      Creando...
    {:else}
      Crear Usuario de Prueba
    {/if}
  </button>
</form>

{#if errorMessage}
  <p class="error">{errorMessage}</p>
{/if}
{#if successMessage}
  <p class="success">{successMessage}</p>
{/if}
</div>

<style>

  .form-field { margin-bottom: 1rem; }
  label { display: block; margin-bottom: 0.25rem; }
  input { width: 100%; padding: 0.5rem; }
  .error { color: red; }
  .success { color: green; }
</style>