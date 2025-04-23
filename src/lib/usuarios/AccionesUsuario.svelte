<script lang="ts">
 import type { Usuario } from '$lib/types';
  import { TrashCan } from 'carbon-icons-svelte';


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
  {isBlocked ? 'Desbloquear' : 'Bloquear'}
</button>
<!-- <button on:click|preventDefault={handleEliminar}>
  Eliminar
</button> -->

<button on:click|preventDefault={() => {
  if (confirm('¿Estás seguro de eliminar este usuario?')) {
    handleEliminar();
  }
}} title="Eliminar Usuario">
  <TrashCan />
</button>

<button >
  Ver Perfil
</button>
</div>

