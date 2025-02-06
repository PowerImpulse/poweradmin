<script>

  import BrandSide from "$lib/components/BrandSide.svelte";
  import Navbar from "$lib/components/Navbar.svelte";
  import Sidebar from "$lib/components/ui/Sidebar.svelte";
  import MenuLateral from "$lib/components/MenuLateral.svelte";
 
  import TitleSection from "$lib/components/ui/SectionName.svelte";
  import { sectionTitle } from '$lib/stores';
</script>

<div class="app h-screen ">
  <header class="[grid-area: header;] bg-slate-50 flex h-16 ">
    <BrandSide />
    <div class="hidden icb h-16 lg:flex "> 
      <Navbar />
    </div>
 </header>
  <Sidebar>
     <MenuLateral />
  </Sidebar> 
  <main class="flex-1 h-full " >
    <slot/>
  </main>
  <footer class="flex text-center icc bg-brand-2 h-16 text-white/50 ">POWER IMPULSE ® EXPERTOS EN ENERGÍA Y CLIMATIZACIÓN</footer>
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