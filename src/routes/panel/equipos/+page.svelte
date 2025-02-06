<script>
  import Equipos from "$lib/components/Equipos.svelte"
  import EquiposGrid from "$lib/components/EquiposGrid.svelte";
  import EquiposTab from "$lib/components/EquiposTab.svelte";
  import SectionName from "$lib/components/ui/SectionName.svelte";
  import { sectionTitle } from '$lib/stores';
  sectionTitle.set('Equipos');
</script>


<SectionName Title="Equipos">
  <EquiposGrid />
</SectionName>


<!-- <Equipos /> -->