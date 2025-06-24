<script lang="ts">
  // src/lib/usuarios/AccionesUsuario.svelte
  import type { Usuario } from '$lib/types'; // Asegúrate que Usuario incluya al menos 'uid' y 'isBlocked'
  import { CheckmarkOutline, IbmEloMethodComposer, NullSign, TrashCan, Identification } from 'carbon-icons-svelte';
  import { getFunctions, httpsCallable } from 'firebase/functions';
  import { app } from '$lib/client';

  

  // Asumimos que el tipo Usuario que llega aquí SIEMPRE tiene 'uid'
  export let value: Usuario & { uid: string; isBlocked: boolean }; // Hacemos explícito que esperamos uid e isBlocked

  export let onBloquearDesbloquear: (value: Usuario) => void;
  export let onEliminar: (uid: string) => void; // Cambiado para recibir solo uid, como en el componente padre

  let isBlocked = value.isBlocked;

  function handleBloquearDesbloquear() {
      onBloquearDesbloquear(value);
      isBlocked = !isBlocked; // Actualiza el estado local para reflejar el cambio visualmente
  }

  function handleEliminar() {
      // Pasamos solo el uid, como espera la función en UsuariosGridCraft.svelte
      onEliminar(value.uid);
  }
</script>

<div class="flex gap-4">
  <button class={isBlocked ? 'Desbloquear' : 'Bloquear'} on:click|preventDefault={handleBloquearDesbloquear} title={isBlocked ? 'Desbloquear Usuario' : 'Bloquear Usuario'}>
    {#if isBlocked}
      <NullSign class="usericon stroke-gray" />
    {:else}
      <CheckmarkOutline class="usericon stroke-green-5" />
    {/if}
    <span class="bg-gray-5">{isBlocked ? 'Desbloquear' : 'Bloquear'}</span>
  </button>

  <button on:click|preventDefault={() => {
      if (confirm('¿Estás seguro de eliminar este usuario?')) {
        handleEliminar();
      }
    }} title="Eliminar Usuario">
    <TrashCan class="usericon stroke-red "/>
    <span class="bg-red-6">Eliminar</span>
  </button>

  <!-- Botón Editar (funcionalidad futura)
  <button title="Editar">
    <IbmEloMethodComposer class="usericon stroke-blue" />
    <span class="bg-blue-8">Editar</span>
  </button>
 -->

  <a href={`/panel/usuarios/${value.uid}`} title="Ver perfil" class="button-like">
    <Identification class="usericon stroke-zinc-8 stroke-1" />
    <span class="bg-blue">Ver Perfil</span>
  </a>
  <!-- ******************************************************************** -->

</div>

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