<script lang="ts">
  import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, getDoc, FirestoreError } from "firebase/firestore";
  import { getAuth, createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
  import { dbUsers } from "$lib/client";
  import { Grid, GridFooter, type PagingData, type GridColumn, type GridFilter } from '@mediakular/gridcraft'; 
  import UsuarioEmail from "$lib/usuarios/UsuarioEmail.svelte";
  import AccionesUsuario from "$lib/usuarios/AccionesUsuario.svelte";
  import type { Usuario } from '$lib/types' // TIPOS TS
  import AgregarNuevoUsuario from "./AgregarNuevoUsuario.svelte";



  const usersFirebase = collection(dbUsers, "users");
  const auth = getAuth();

  let usuarios: Usuario[] = [];
  let selectedRows: Usuario[] = [];
  let loading = true;
  
  let email = "Juan1@me.com";
  let username = "Juan1 Me";
  let role = "Técnico";
  let password = "UnjsdK44@";
  let error = "";

  onSnapshot(usersFirebase, (querySnapshot) => {
      let listaUsuarios: Usuario[] = [];
      querySnapshot.forEach((doc) => {
          let usuario = { ...doc.data(), uid: doc.id } as Usuario;
          listaUsuarios.push(usuario);
      });
      usuarios = listaUsuarios;
      loading = false;
  });

 

  const bloquearDesbloquearUsuario = async (usuario: Usuario) => {
      await updateDoc(doc(dbUsers, "users", usuario.uid), {
          isBlocked: !usuario.isBlocked,
      });
  };

//   const eliminarUsuario = async (uid: string) => {
//         try {
//             await deleteDoc(doc(dbUsers, "users", uid));

//             const user = auth.currentUser;
//             if (user) {
//                 await deleteUser(user);
//             }
//         } catch (e: any) {
//             error = `Error al eliminar usuario: ${e.message}`;
//         }
//     };

const eliminarUsuario = async (uid: string) => {
    try {
        // Elimina el usuario de Firestore
        await deleteDoc(doc(dbUsers, "users", uid));
        
        // Elimina el usuario de Firebase Authentication
        const user = auth.currentUser;
        if (user && user.uid === uid) {
            await deleteUser(user);
        } else {
            error = "Usuario no autenticado o UID no coincide.";
        }
    } catch (e: any) {
        error = `Error al eliminar usuario: ${e.message}`;
    }
};

 

  // FILTERS

  let textSearch = "";
  let filters: GridFilter[];
$: filters = [ 
  {
            key: "text-search",
            columns: ["username", "email",  "role", "isBlocked"],
            filter: (row: any, colKey: string) => { 
                const search = (val: string | null) => val != undefined && val.toString().toLocaleLowerCase().includes(textSearch.toLocaleLowerCase());
                return search(row)
            }, 
            active: (textSearch && textSearch.length > 0) ? true : false
        }
];


 

  let columns: GridColumn<Usuario>[] = [
      { 
          key: 'infoUser', 
          title: 'Usuario', 
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
            //   return {
            //       value: row,
            //       onBloquearDesbloquear: () => bloquearDesbloquearUsuario(row),
            //       onEliminar: () => eliminarUsuario(row.uid),
            //   }
            return {
                value: row,
                onBloquearDesbloquear: () => bloquearDesbloquearUsuario(row),
                onEliminar: () => {
                    // Obtener user.uid si es necesario aquí
                    const user = auth.currentUser;
                    const uidToDelete = user ? user.uid : row.uid;
                    eliminarUsuario(uidToDelete);
                },
            };
            
          },
          renderComponent: AccionesUsuario,
      },
  ];

  let paging = {
      itemsPerPage: 10,
      currentPage: 1,
      itemsPerPageOptions: [10, 20, 100]
  } as PagingData;
  let showModal = false;
</script>

<div class="bar-actions pb-16">
    <div class="w-100 ">
        <input class="w-160 p-1" type="text" placeholder="Filtra por usuario, rol o estado" bind:value={textSearch} />
    </div>  
    
   
    <AgregarNuevoUsuario />
</div>


{#if loading}
  <p>Cargando...</p>
{:else}
<p class="error">{error}</p>
  <Grid data={usuarios} {paging} bind:columns bind:selectedRows  bind:filters />
  <GridFooter bind:paging />
{/if}





<style>
  .error {
      color: red;
  }
 
  .bar-actions{
    display: flex;
    justify-content: space-between;
  }
</style>
