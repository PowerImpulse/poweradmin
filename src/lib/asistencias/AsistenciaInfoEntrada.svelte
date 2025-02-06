<script lang="ts">
  import type { Usuario, Asistencia } from '$lib/types' 
  
   export let imageUrl: string;
   export let startLatitude: number;
   export let startLongitude: number;
   export let startLocation: string;

   
   
  </script>
  
  <div>
    {#if imageUrl}
      <img class="asistencia-img" src={imageUrl} alt={startLocation} width="60" loading="lazy">
      {:else}
      <span class="no-img">Sin <br> Imagen</span>
    {/if}
      <p>
        <a class="ubication" href={"https://www.google.com/maps?q=" + startLatitude + "," + startLongitude} target="_blank">
          {startLocation || 'Ubicación no disponible'}
        </a>
      </p>
    
      <span style="font-size:11px;">{startLatitude},{startLongitude}</span>
     
  </div>
