<script lang="ts">
  // src/lib/usuarios/AccionesUsuario.svelte

  import { CheckmarkOutline, NullSign, TrashCan, Identification } from 'carbon-icons-svelte';
  import { httpsCallable } from 'firebase/functions'; // Solo necesitas httpsCallable
  import { functions } from '$lib/client'; // Importas la instancia ya configurada
  
  // --- 2. PROPS Y ESTADO (sin cambios) ---
  export let usuario: { uid: string; isBlocked: boolean; } | undefined = undefined;
  export let onUserDeleted: (uid: string) => void;
  export let onToggleBlock: (uid: string) => void;

  let isDeleting = false;
  let isBlocking = false;
  let errorMessage = '';

  // --- 3. LÓGICA DE ELIMINACIÓN (SIMPLIFICADA) ---
  async function handleEliminar() {
    if (!usuario) return;

    isDeleting = true;
    errorMessage = '';

    try {
      // --- ¡CORRECCIÓN CLAVE! ---
      // Llama a httpsCallable directamente con la instancia 'functions' que importaste.
      // Ya no hay que crear una nueva variable.
      const deleteUserCallable = httpsCallable(functions, 'deleteUser');
      
      await deleteUserCallable({ uid: usuario.uid });
      onUserDeleted(usuario.uid);
      
    } catch (error: any) {
      console.error("Error al eliminar usuario:", error);
      errorMessage = error.message;
    } finally {
      isDeleting = false;
    }
  }

  // --- 4. LÓGICA DE BLOQUEO (sin cambios) ---
  function handleBloquearDesbloquear() {
    if (!usuario) return;
    onToggleBlock(usuario.uid);
  }

</script>

{#if usuario}
  <!-- Todo el contenido del componente ahora está dentro de este bloque #if -->

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

{/if}

<style>
  /* Tus estilos están bien, solo asegúrate de que los iconos se vean bien */
  .usericon {
    width: 20px; /* Ejemplo de tamaño */
    height: 20px; /* Ejemplo de tamaño */
  }

  /* El resto de tus estilos */
  button, a.button-like {
    --at-apply: relative inline-flex items-center justify-center p-1 border border-transparent rounded-md cursor-pointer;
  }

  button span, a.button-like span {
    --at-apply: hidden min-w-16 absolute text-xs text-white rounded p-1 -left-2 bottom-full mb-1 z-10;
  }

  button:hover span, a.button-like:hover span {
    --at-apply: block;
  }

  .pointer-events-none {
    pointer-events: none;
    opacity: 0.7;
  }
</style>