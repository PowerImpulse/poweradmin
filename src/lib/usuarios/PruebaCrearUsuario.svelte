<script lang="ts">
  // --- 1. IMPORTACIONES ---
  import { getFunctions, httpsCallable, type Functions, type HttpsCallable } from 'firebase/functions';
  import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
  import { app, db } from '$lib/client';
  
  // ¡NUEVO! Importamos lo necesario para obtener y refrescar el token del admin
  import { getAuth } from 'firebase/auth';

  // --- 2. ESTADO DEL FORMULARIO ---
  let email = '';
  let password = '';
  let username = '';
  let role: 'admin' | 'superadmin' | 'gerente' | 'tecnico' | 'empleado' | 'visor' = 'tecnico';
  
  // Estado de la UI
  let isLoading = false;
  let successMessage = '';
  let errorMessage = '';

  // --- 3. LÓGICA DE REGISTRO (CON REFRESCÓ DE TOKEN Y TIPADO CORRECTO) ---
  async function handleRegister(): Promise<void> {
    isLoading = true;
    successMessage = '';
    errorMessage = '';

    try {
      // --- PASO A: OBTENER Y REFRESCAR EL TOKEN DEL ADMINISTRADOR ---
      const auth = getAuth(app);
      const adminUser = auth.currentUser;

      if (!adminUser) {
        throw new Error("No hay un usuario administrador logueado. Por favor, reinicia la sesión.");
      }
      
      // Forzamos el refresco del token para asegurar que los claims son los más recientes.
      await adminUser.getIdToken(true);
      console.log("Token de administrador refrescado exitosamente antes de las llamadas.");

      // --- PASO B: PREPARAR LAS LLAMADAS A LAS CLOUD FUNCTIONS CON TIPOS ---
      const functions: Functions = getFunctions(app, 'us-west4');
      
      // Tipado para la función createUser
      const createUserCallable: HttpsCallable<{ email: string; password: string; username: string }, { uid: string }> = 
        httpsCallable(functions, 'createUser');
      
      // Tipado para la función setUserRole
      const setUserRoleCallable: HttpsCallable<{ uid: string; role: string }, { success: boolean }> = 
        httpsCallable(functions, 'setUserRole');

      // --- PASO 1: Crear usuario en Auth ---
      const result = await createUserCallable({ email, password, username });
      const newUid = result.data.uid;

      if (!newUid) {
        throw new Error("La Cloud Function 'createUser' no retornó un UID.");
      }
      successMessage = `Paso 1/3: Usuario creado en Auth con UID: ${newUid}`;

      // --- PASO 2: Crear documento en Firestore ---
      const userDocRef = doc(db, "users", newUid);
      await setDoc(userDocRef, {
        uid: newUid,
        email,
        username,
        role,
        isBlocked: false,
        created_at: serverTimestamp(),
      });
      successMessage += "\nPaso 2/3: Documento creado en Firestore.";
      
      // --- PASO 3: Asignar Custom Claim ---
      await setUserRoleCallable({ uid: newUid, role: role });
      successMessage += "\nPaso 3/3: Rol asignado correctamente. ¡Usuario creado con éxito!";

    } catch (error: any) {
      console.error("Error en el proceso de registro:", error);
      errorMessage = `Error: ${error.message}`;
      successMessage = '';
    } finally {
      isLoading = false;
    }
  }
</script>

<!-- Tu HTML del formulario no necesita cambios -->
<form on:submit|preventDefault={handleRegister}>
  <div>
    <label for="email">Correo electrónico:</label>
    <input type="email" id="email" bind:value={email} required />
  </div>
  <div>
    <label for="password">Contraseña:</label>
    <input type="password" id="password" bind:value={password} required minlength="6" />
  </div>
  <div>
    <label for="username">Nombre de usuario:</label>
    <input type="text" id="username" bind:value={username} required />
  </div>
  <div>
    <label for="role">Rol:</label>
    <select id="role" bind:value={role} required>
      <option value="tecnico">Técnico</option>
      <option value="empleado">Empleado</option>
      <option value="visor">Visor</option>
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

{#if successMessage}
  <pre class="text-green-500">{successMessage}</pre>
{/if}
{#if errorMessage}
  <p class="text-red-500">{errorMessage}</p>
{/if}