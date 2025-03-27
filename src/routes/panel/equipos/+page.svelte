<script>
  import EquiposGrid from "$lib/equipos/EquiposGridCraft.svelte";
  import SectionName from "$lib/components/ui/SectionName.svelte";
  import { sectionTitle } from '$lib/stores';
  sectionTitle.set('Equipos');
</script>
<SectionName Title="Equipos">
  <EquiposGrid />
</SectionName>

