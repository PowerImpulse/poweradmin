<script lang="ts">
    import { onMount } from 'svelte';
    import ChevronRight from "carbon-icons-svelte/lib/ChevronRight.svelte";

  
    let isSidebarOpen = true;
  
    onMount(() => {
      const mediaQuery = window.matchMedia('(min-width: 1024px)');
  
      const handleMediaQueryChange = (event: MediaQueryListEvent) => {
        isSidebarOpen = event.matches;
      };
  
      mediaQuery.addEventListener('change', handleMediaQueryChange);
  
      return () => {
        mediaQuery.removeEventListener('change', handleMediaQueryChange);
      };
    });
  </script>
  <button class="sidebar-toggle z-100 " on:click={() => isSidebarOpen = !isSidebarOpen}>
    {isSidebarOpen ? 'Cerrar' : 'Abrir'}
  </button>
  
  <aside class="sidebar {isSidebarOpen ? 'open' : ''} bg-slate-8 text-slate-200 flex w-64 fixed lg:relative h-full ">
    <div class="iconbar transition-all w-4 hover:w-16 bg-brand-2 "></div>
    <div class="flex-1">
      <slot/>
    </div>
  </aside>
  
  

  <style>
 .sidebar {
      /* Estilos base para la barra lateral */
      transition: transform 0.3s ease-in-out;
      transform: translateX(-100%);
      grid-area: aside;
    }

    .sidebar.open {
      transform: translateX(0);
    }

    /* Estilos para el botón de abrir/cerrar */
    .sidebar-toggle {
      /* Estilos para el botón */
      position: fixed;
      top: 10px;
      left: 10px;
      padding: 10px;
      background-color: #fff;
      border: none;
      cursor: pointer;
      display: none; /* Ocultar en pantallas grandes */
      z-index: 100;
    }

  
  </style>