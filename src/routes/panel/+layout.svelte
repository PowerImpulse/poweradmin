<script>
  import { goto } from '$app/navigation';
  import BrandSide from "$lib/components/BrandSide.svelte";
  import Navbar from "$lib/components/Navbar.svelte";
  import Sidebar from "$lib/components/ui/Sidebar.svelte";
  import MenuLateral from "$lib/components/MenuLateral.svelte";

  import { sectionTitle, isLoggedIn } from '$lib/stores';
  import { onMount } from 'svelte';
  import Time from '$lib/components/ui/Time.svelte';
  import ButtonLogOut from '$lib/components/ui/ButtonLogOut.svelte';
  
  let loggedIn = false;

  // isLoggedIn.subscribe(value => {
  //   loggedIn = value;

  //   if (!loggedIn) {
  //     goto('/');
  //   }
  // }); 
</script>

<div class="app h-screen ">
  <header class="[grid-area:header;] bg-slate-50 flex icb h-16 ">
    <BrandSide />
    <div class="h-16 flex-1 flex icb px-8 lg:px-16">
      <Time />
      <ButtonLogOut>Salir</ButtonLogOut>
    </div>
    
  </header>
  <Sidebar>
    <MenuLateral />
  </Sidebar> 
  <main class="flex-1 h-full ">

    <slot/>
    <!-- {#if loggedIn}
      <slot/>
    {:else}
      <p class="text-center">Redirigiendo a la página de inicio de sesión...</p>
    {/if} -->
  </main>
  <footer class="flex text-center icc bg-brand-2 h-16 text-white/50 ">
    POWER IMPULSE ® EXPERTOS EN ENERGÍA Y CLIMATIZACIÓN
  </footer>
</div>



<style>
   .app{
    display: grid;
    grid-template-areas: 
    "header header header"
    "aside main main"
    "aside footer footer";
    grid-template-columns: auto 1fr;
    grid-template-rows: auto 1fr;
  }
  header{
    grid-area: header;
  }
  main{
    grid-area: main;
    overflow: auto;
  }
  footer{
    grid-area: footer;
  }
</style>