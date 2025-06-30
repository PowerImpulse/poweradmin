<script lang="ts">
  // --- 1. IMPORTACIONES ---
  import { getFunctions, httpsCallable, type Functions, type HttpsCallable } from 'firebase/functions';
  import { app, functions } from '$lib/client'; // Importamos 'functions' desde nuestro cliente ya configurado

  // --- 2. TIPOS ---
  // Un tipo para los datos que enviamos
  type CreateUserData = {
    email: string;
    password: string;
    username: string;
    role: 'admin' | 'superadmin' | 'gerente' | 'tecnico' | 'empleado' | 'visor';
  };

  // Un tipo para la respuesta que esperamos de la función
  type CreateUserResult = {
    success: boolean;
    uid: string;
    message: string;
  };

  // --- 3. ESTADO DEL FORMULARIO ---
  let email: string = '';
  let password: string = '';
  let username: string = '';
  // El tipo aquí asegura que solo podamos seleccionar roles válidos
  let role: CreateUserData['role'] = 'tecnico';
  
  // Estado de la UI
  let isLoading: boolean = false;
  let errorMessage: string = '';
  let successMessage: string = '';

  // --- 4. LÓGICA DE REGISTRO ---
  async function handleRegister(): Promise<void> {
    isLoading = true;
    errorMessage = '';
    successMessage = '';

    try {
      // Creamos el objeto de datos con su tipo
      const dataToSend: CreateUserData = {
        email,
        password,
        username,
        role,
      };
      
      console.log("CLIENTE: Enviando datos a 'createUser':", dataToSend);

      // Verificación en el cliente
      if (!dataToSend.email || !dataToSend.password || !dataToSend.username) {
        throw new Error("Por favor, rellena todos los campos requeridos.");
      }
      
      // Preparamos la llamada a la Cloud Function con tipos
      const createUserCallable: HttpsCallable<CreateUserData, CreateUserResult> = 
        httpsCallable(functions, 'createUser'); 
      
      // Ejecutamos la llamada
      const result = await createUserCallable(dataToSend);

      // TypeScript ahora sabe que result.data contiene { success, uid, message }
      if (result.data.success) {
        successMessage = `Éxito: ${result.data.message}`;
        // Opcional: Limpiar el formulario o redirigir
        // email = '';
        // password = '';
        // username = '';
      } else {
        // En caso de que la función retornara success: false (aunque no lo hemos programado así)
        throw new Error(result.data.message || "La función retornó un error no especificado.");
      }
      
    } catch (error: any) {
      console.error("Error en el proceso de registro:", error);
      errorMessage = `Error: ${error.message}`;
    } finally {
      isLoading = false;
    }
  }
</script>

<!-- Tu HTML del formulario no necesita cambios -->
<h3>Crear Nuevo Usuario</h3>

<form on:submit|preventDefault={handleRegister} class="w-100 p-8">
  <div class="form-field">
    <label for="username">Nombre de Usuario:</label>
    <input type="text" id="username" bind:value={username} required>
  </div>
  
  <div class="form-field">
    <label for="email">Correo Electrónico:</label>
    <input type="email" id="email" bind:value={email} required>
  </div>

  <div class="form-field">
    <label for="password">Contraseña:</label>
    <input type="password" id="password" bind:value={password} required minlength="6">
  </div>

  <div class="form-field">
    <label for="role">Rol:</label>
    <select id="role" bind:value={role} required>
      <option value="tecnico">Técnico</option>
      <option value="empleado">Empleado</option>
      <option value="gerente">Gerente</option>
      <option value="admin">Admin</option>
      <option value="superadmin">Super Admin</option>
    </select>
  </div>
  
  <button type="submit" disabled={isLoading}>
    {#if isLoading}
      Creando...
    {:else}
      Crear Usuario
    {/if}
  </button>
</form>

{#if errorMessage}
  <p class="error">{errorMessage}</p>
{/if}
{#if successMessage}
  <p class="success">{successMessage}</p>
{/if}


{#if errorMessage}
  <p class="error">{errorMessage}</p>
{/if}
{#if successMessage}
  <p class="success">{successMessage}</p>
{/if}


<style>

  .form-field { margin-bottom: 1rem; }
  label { display: block; margin-bottom: 0.25rem; }
  input { width: 100%; padding: 0.5rem; }
  .error { color: red; }
  .success { color: green; }
</style>