<script lang="ts">
   
   export let  endImageUrl: string;
   export let  endLatitude: number;
   export let  endLongitude: number;
   export let  endLocation: string;
   
  </script>
  
  <div>
    {#if  endImageUrl}
      <img class="asistencia-img" src={ endImageUrl} alt={endLocation} width="60" loading="lazy" >
      {:else}
      <span class="no-img">Sin <br> Imagen</span>
    {/if} 

      <p>
        <a class="ubication" href={"https://www.google.com/maps?q=" + endLatitude + "," + endLongitude} target="_blank">
          {endLocation || 'Ubicación no disponible'}
        </a>
      </p>
      <span style="font-size:11px;">{endLatitude || "No coordenadas"},{endLongitude || ""}</span>
 
  </div>
 