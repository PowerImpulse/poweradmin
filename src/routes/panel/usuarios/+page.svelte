<script>
  import UsuariosGridCraft from "$lib/usuarios/UsuariosGridCraft.svelte";
  import { sectionTitle } from '$lib/stores';
  import SectionName from "$lib/components/ui/SectionName.svelte";
    sectionTitle.set('Lista de Usuarios');
</script>

<SectionName Title="Usuarios">
  <UsuariosGridCraft />
</SectionName>


   



