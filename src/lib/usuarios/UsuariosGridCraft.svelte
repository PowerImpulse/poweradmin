<script lang="ts">
    // componente src/lib/usuarios/UsuariosGridCraft.svelte
  import { collection, onSnapshot, doc, updateDoc, deleteDoc} from "firebase/firestore";
  import { getAuth} from "firebase/auth";
  import { dbUsers } from "$lib/client";
  import { Grid, GridFooter, type PagingData, type GridColumn, type GridFilter } from '@mediakular/gridcraft'; 
  import UsuarioEmail from "$lib/usuarios/UsuarioEmail.svelte";
  import AccionesUsuario from "$lib/usuarios/AccionesUsuario.svelte";
  import type { Usuario } from '$lib/types' // TIPOS TS
  import AddLarge from "carbon-icons-svelte/lib/AddLarge.svelte";


  const usersFirebase = collection(dbUsers, "users");
  const auth = getAuth();

  let usuarios: Usuario[] = [];
  let selectedRows: Usuario[] = [];
  let loading = true;
  let error = "";


onSnapshot(usersFirebase, (querySnapshot) => {
    let listaUsuarios: Usuario[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data && data.email && data.username && data.role !== undefined) { 
            let usuario = { ...data, uid: doc.id } as Usuario;
            listaUsuarios.push(usuario);
        } else {
            console.warn("Documento inválido:", doc.id, data); 
        }
    });
    usuarios = listaUsuarios;
    loading = false;
});



  const bloquearDesbloquearUsuario = async (usuario: Usuario) => {
      await updateDoc(doc(dbUsers, "users", usuario.uid), {
          isBlocked: !usuario.isBlocked,
      });
  };

  const eliminarUsuario = async (uid: string) => {
    try {
        await deleteDoc(doc(dbUsers, "users", uid));
    } catch (e: any) {
        error = `Error al eliminar usuario: ${e.message}`;
    }
};



  let columns: GridColumn<Usuario>[] = [
      { 
          key: 'infoUser', 
          title: 'Usuario', 
          //@ts-ignore
          renderComponent: UsuarioEmail, 
          accessor: (row) => ({ email: row.email, username: row.username }),
          sortValue: (row: Usuario) => {
            return `${row.username} ${row.email}`
        } 
      },
      { key: 'role', title: 'Rol' },
      { key: 'isBlocked', title: 'Estado', accessor: (row) => row.isBlocked ? 'Bloqueado' : 'Activo' },
      { key: 'created_at', title: 'Creado en', accessor: (row) => row.created_at?.toDate().toLocaleString() },
      {
          key: 'actions',
          title: 'Acciones',
          sortable: false,
          accessor: (row) => {
         
            return {
                value: row,
                onBloquearDesbloquear: () => bloquearDesbloquearUsuario(row),
                onEliminar: () => {
              
                    eliminarUsuario(row.uid);
                },
            };
            
          },
          //@ts-ignore
          renderComponent: AccionesUsuario,
      },
  ];

  let paging = {
      itemsPerPage: 50,
      currentPage: 1,
      itemsPerPageOptions: [10, 50, 100]
  } as PagingData;
  let showModal = false;


  // FILTERS

  let textSearch = "";
  let filters: GridFilter[];

// @ts-ignore
$: filters = [ 
    // busca solo en usuario
  {
    key: "text-search",
    columns: ["infoUser", "role", "isBlocked"],
    filter: (row: Usuario, colKey: string) => { 
        // Verifica si row es undefined o null
        if (!row) return false;

        // Función para buscar en un valor específico
        const search = (val: string | null) => val != undefined && val.toString().toLocaleLowerCase().includes(textSearch.toLocaleLowerCase());

        // Buscar en las propiedades relevantes del usuario
        return search(row.email) || search(row.username) || search(row.role) || search(row.isBlocked ? 'Bloqueado' : 'Activo');
    }, 
    active: (textSearch && textSearch.length > 0) ? true : false
  },
  
];

</script>

<div class="bar-actions pb-16 grid md:grid-cols-3 gap-6">
    <div class="grid-col-span-2 ">
        <input class="w-160 p-1" type="text" placeholder="Filtra por usuario o email" bind:value={textSearch} />
    </div>  
    
    <div class="flex md:justify-end ">
        <a href="/panel/usuarios/register" class=" rounded-full flex ic gap-4 "> <AddLarge />  Registrar Empleado</a>
    </div>
    
</div>


{#if loading}
  <p>Cargando...</p>
{:else}
<p class="error">{error}</p>
  <Grid data={usuarios} bind:paging={paging} bind:columns bind:selectedRows  bind:filters />
  <GridFooter bind:paging />
{/if}

<style>
  .error { color: red;}
</style>
