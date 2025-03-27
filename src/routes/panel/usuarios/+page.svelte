<script>
  import UsuariosGrid from "$lib/usuarios/UsuariosGrid.svelte" 
  import UsuariosGridCraft from "$lib/usuarios/UsuariosGridCraft.svelte";
  import { sectionTitle } from '$lib/stores';
  import SectionName from "$lib/components/ui/SectionName.svelte";
  import ShowModal from "$lib/components/ui/ShowModal.svelte";
    sectionTitle.set('Lista de Usuarios');
</script>

<SectionName Title="Usuarios">
  <div slot="sideactions">
      <p class="text-3"> AGREGAR USUARIO</p>
  </div>
  <UsuariosGridCraft />
</SectionName>


   



