<script lang="ts">
  import { sectionTitle } from '$lib/stores';
  import PruebaCrearUsuario from '$lib/usuarios/PruebaCrearUsuario.svelte';
  sectionTitle.set('Inicio');
</script>

<section class="bg-sky-600 h-full grid">
  <div class=" text-white/80 grid  items-end ">
    <PruebaCrearUsuario />
    <div>
      <h1 class="text-7vw leading-1.2em">Power Admin</h1>
    </div>
  </div>

</section>
