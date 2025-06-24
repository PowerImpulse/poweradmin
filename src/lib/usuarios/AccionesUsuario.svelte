<script lang="ts">
  // src/lib/usuarios/AccionesUsuario.svelte
  import { CheckmarkOutline, NullSign, TrashCan, Identification } from 'carbon-icons-svelte';
  import { getFunctions, httpsCallable } from 'firebase/functions';
  import { app } from '$lib/client';
  
  // --- 2. PROPS Y ESTADO ---

  // El objeto usuario que representa la fila
  export let usuario: {
    uid: string;
    isBlocked: boolean;
  };

  // --- ¡NUEVO! Props de Callback ---
  // El padre nos pasará una función para ejecutar cuando el usuario sea eliminado.
  export let onUserDeleted: (uid: string) => void;
  // El padre nos pasará una función para el bloqueo/desbloqueo.
  export let onToggleBlock: (uid: string) => void;

  // Estado local del componente
  let isDeleting = false;
  let isBlocking = false;
  let errorMessage = '';

  // --- 3. LÓGICA DE ELIMINACIÓN (Ahora llama a la prop de callback) ---
  async function handleEliminar() {
    isDeleting = true;
    errorMessage = '';

    try {
      const functions = getFunctions(app, 'us-west4');
      const deleteUserCallable = httpsCallable(functions, 'deleteUser');
      
      await deleteUserCallable({ uid: usuario.uid });

      // --- ¡CLAVE! Llamar a la función que nos pasó el padre ---
      onUserDeleted(usuario.uid);
      
    } catch (error: any) {
      console.error("Error al eliminar usuario:", error);
      errorMessage = error.message;
    } finally {
      isDeleting = false;
    }
  }

  // --- 4. LÓGICA DE BLOQUEO (Ahora llama a la prop de callback) ---
  function handleBloquearDesbloquear() {
    // Aquí, en el futuro, llamarías a la Cloud Function 'toggleUserBlock'
    // y luego llamarías al callback para notificar al padre.
    onToggleBlock(usuario.uid);
  }
  
</script>

<div class="flex gap-4" class:pointer-events-none={isDeleting || isBlocking}>
  
  <!-- Botón Bloquear/Desbloquear -->
  <button 
    class={usuario.isBlocked ? 'text-gray-500' : 'text-green-500'} 
    on:click|preventDefault={handleBloquearDesbloquear} 
    title={usuario.isBlocked ? 'Desbloquear Usuario' : 'Bloquear Usuario'}
    disabled={isDeleting || isBlocking}
  >
    {#if isBlocking}
      <span>...</span>
    {:else if usuario.isBlocked}
      <NullSign class="usericon" />
    {:else}
      <CheckmarkOutline class="usericon" />
    {/if}
    <span class="bg-gray-500">{usuario.isBlocked ? 'Desbloquear' : 'Bloquear'}</span>
  </button>

  <!-- Botón Eliminar -->
  <button 
    class="text-red-600"
    on:click|preventDefault={() => { if (confirm('¿Estás seguro de eliminar este usuario?')) { handleEliminar(); } }}
    title="Eliminar Usuario"
    disabled={isDeleting || isBlocking}
  >
    {#if isDeleting}
      <span>...</span>
    {:else}
      <TrashCan class="usericon"/>
    {/if}
    <span class="bg-red-600">Eliminar</span>
  </button>
  
  <!-- Enlace Ver Perfil -->
  <a href={`/panel/usuarios/${usuario.uid}`} title="Ver perfil" class="button-like text-zinc-800">
    <Identification class="usericon stroke-1" />
    <span class="bg-blue-500">Ver Perfil</span>
  </a>

</div>

{#if errorMessage}
  <p class="text-xs text-red-500 mt-1">{errorMessage}</p>
{/if}

<style>
  /* Estilos generales para botones y el enlace que parece botón */
  button, a.button-like {
    --at-apply: relative inline-flex items-center justify-center p-1 border border-transparent rounded-md cursor-pointer; /* Añade estilos base si es necesario */
    /* Asegúrate de que los iconos tengan un tamaño consistente */
  
  }

  button span, a.button-like span {
    --at-apply: hidden min-w-16 absolute text-12px text-white rounded-4 p-1 -left-2 bottom-110% z-10; /* Añade z-index por si acaso */
  }

  button:hover span, a.button-like:hover span {
    --at-apply: block;
  }




</style>