<script>

  import SideLink from "$lib/components/ui/SideLink.svelte";
  import ButtonLogOut from "$lib/components/ui/ButtonLogOut.svelte";
  import SailboatCoastal from "carbon-icons-svelte/lib/SailboatCoastal.svelte";
  import WatsonHealthStatusAcknowledge from "carbon-icons-svelte/lib/WatsonHealthStatusAcknowledge.svelte";
  import AssemblyCluster from "carbon-icons-svelte/lib/AssemblyCluster.svelte";
  import ConnectRecursive from "carbon-icons-svelte/lib/ConnectRecursive.svelte";
  import PortOutput from "carbon-icons-svelte/lib/PortOutput.svelte";
  import ChevronRight from "carbon-icons-svelte/lib/ChevronRight.svelte";

let subMenuOpen = false;
function toggleSubMenu() {
  subMenuOpen = !subMenuOpen;
}
</script>




<nav class="flex flex-col justify-between h-full py-8">
  
  <ul class="block grid gap-4 pt-8 " >
    <li><SideLink route="/panel/" ><span><SailboatCoastal size={16} /></span> INICIO</SideLink></li>
    <li><SideLink route="/panel/asistencias" > <span><WatsonHealthStatusAcknowledge size={16} /></span> ASISTENCIAS</SideLink></li>
    <li>
      <SideLink  route="#" on:click={toggleSubMenu} > <span><AssemblyCluster size={16} /> </span> USUARIOS </SideLink>
      <!-- Submenú -->
      <ul class:open={subMenuOpen} class="submenu">
        <li ><SideLink route="/panel/usuarios" > Lista de usuarios</SideLink></li>
        <li ><SideLink route="/panel/usuarios/new" >Agregar nuevo</SideLink> </li>
        <li ><SideLink route="/panel/usuarios/register" >Registrar</SideLink> </li>
        <li ><SideLink route="/panel/usuarios/nuevoemp" >Experimental</SideLink> </li>
      </ul>
    </li>
    <SideLink route="/panel/equipos" > <span><ConnectRecursive size={16} /></span>EQUIPOS </SideLink>
    
  </ul>
<div class="pb-2"><ButtonLogOut>Logout</ButtonLogOut></div>
  
</nav>


<style>
  nav{
    padding:0 4px 10px 12px ;
  }

 
  .submenu {
    display: none;
    padding: 0 0 0 1.4rem;
  }
span{
  display: flex;
  align-items: center;
  opacity: .5;
}
  .submenu.open {
    display: block;
  }
</style>