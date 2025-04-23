<script lang="ts">
  // src/lib/usuarios/AccionesUsuario.svelte
 import type { Usuario } from '$lib/types';
  import { CheckmarkOutline, IbmEloMethodComposer, NullSign, TrashCan, Identification } from 'carbon-icons-svelte';


export let value: Usuario;


  export let onBloquearDesbloquear: (value: Usuario) => void;
  export let onEliminar: (value: Usuario) => void;

  let isBlocked = value.isBlocked;

  function handleBloquearDesbloquear() {
      onBloquearDesbloquear(value);
      isBlocked = !isBlocked;
  }

  function handleEliminar() {
      onEliminar(value);
  }
</script>

<div class="flex gap-4">
<button class={isBlocked ? 'Desbloquear' : 'Bloquear'} on:click|preventDefault={handleBloquearDesbloquear}>
  {#if isBlocked}
  <NullSign class="usericon stroke-gray" />
{:else}
  <CheckmarkOutline class="usericon stroke-green-5" />
{/if}
<span class="bg-gray-5">Bloquear/desbloquear</span>
</button>
<!-- <button on:click|preventDefault={handleEliminar}>
  Eliminar
</button> -->

<button on:click|preventDefault={() => {
  if (confirm('¿Estás seguro de eliminar este usuario?')) {
    handleEliminar();
  }
}} title="Eliminar Usuario">
  <TrashCan class="usericon stroke-red "/> <span class="bg-red-6">Eliminar</span>
</button>
<button title="Editar">
  <IbmEloMethodComposer class="usericon stroke-blue" /> <span class="bg-blue-8">Editar</span>
</button>
<button title=" ver perfil" >
  <Identification class="usericon stroke-zinc-8 stroke-1" /> <span class="bg-blue">Ver Perfil</span>
</div>

<style>
  button {
    --at-apply: relative;	
  }
  button span{
    --at-apply: hidden min-w-16 absolute text-12px text-white rounded-4 p-1 -left-2 bottom-110%  ;

  }
  button:hover span{
    --at-apply: block ;
  }

</style>
