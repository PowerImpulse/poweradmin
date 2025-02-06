<script lang="ts">
    import { fade } from 'svelte/transition';
    import { onDestroy } from 'svelte';
  
    interface Option {
      label: string;
    }
  
    let isOpen: boolean = false;
    let options: Option[]
  
    function toggle(): void {
      isOpen = !isOpen;
    }
   
    function handleClickOutside(event: MouseEvent): void {
        const targetElement = event.target as HTMLInputElement;
      if (menu && !menu.contains( targetElement )) {
        isOpen = false;
      }
    }
  
    let menu: HTMLUListElement; // Declara una referencia al elemento ul
  
    document.addEventListener('click', handleClickOutside);
  
    // Cleanup function to remove event listener on component unmount
    function cleanup(): void {
      document.removeEventListener('click', handleClickOutside);
    }
  
    onDestroy(cleanup);
  </script>
  
  <button on:click={toggle}>
    {isOpen ? 'Cerrar' : 'Abrir'}
  </button>
  
  <ul bind:this={menu} class:show={isOpen} in:fade out:fade>
    {#each options as option}
      <li>{option.label}</li>
    {/each}
  </ul>