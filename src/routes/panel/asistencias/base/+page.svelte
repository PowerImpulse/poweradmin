<script>
  import AsistenciasGrid from "$lib/asistencias/AsistenciasGrid.svelte";
  import Asistencias from "$lib/tempver/Asistencias.svelte";
  import AsistenciasBase from "$lib/tempver/AsistenciasBase.svelte";
  import AsistenciasGridCraft from "$lib/asistencias/AsistenciasGridCraft.svelte";
  import { sectionTitle } from '$lib/stores';
  import Section from "$lib/components/ui/SectionName.svelte";
  import AsistenciasGridCraftFilters from "$lib/asistencias/AsistenciasGridCraftFilters.svelte";
    sectionTitle.set('Lista de Asistencias');
</script>

<Section Title="Lista de Asistencias">
 <!-- 
    <AsistenciasGrid />
    <AsistenciasBase />
    <Asistencias/>
 -->
    <!-- <AsistenciasGridCraft /> -->
    <AsistenciasGridCraftFilters />
</Section>
