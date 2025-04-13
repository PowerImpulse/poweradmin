<script lang="ts">
  import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
  import { getAuth, createUserWithEmailAndPassword} from "firebase/auth";
  import { dbUsers } from "$lib/client";
  import { Grid, GridFooter, type PagingData, type GridColumn, type GridFilter } from '@mediakular/gridcraft'; 
  import UsuarioEmail from "$lib/usuarios/UsuarioEmail.svelte";
  import AccionesUsuario from "$lib/usuarios/AccionesUsuario.svelte";
  import type { Usuario } from '$lib/types' // TIPOS TS
  import Modal from "$lib/components/ui/Modal.svelte";
  import AddLarge from "carbon-icons-svelte/lib/AddLarge.svelte";


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

  const crearUsuario = async () => {
      if (email.trim() !== "" && username.trim() !== "" && role.trim() !== "" && password.trim() !== "") {
          try {
              const userCredential = await createUserWithEmailAndPassword(auth, email, password);
              const user = userCredential.user;

              await addDoc(usersFirebase, {
                  email: email,
                  username: username,
                  role: role,
                  isBlocked: false,
                  created_at: new Date(),
                  uid: user.uid
              });

              error = "";
          } catch (e: any) {
              error = `Error al crear usuario: ${e.message}`;
          }
      } else {
          error = "Todos los campos son obligatorios";
      }
      email = "";
      username = "";
      role = "";
      password = "";
  };

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

// Crear usuario al presionar ENTER
  const teclaPresionada = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
          crearUsuario();
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
            //   return {
            //       value: row,
            //       onBloquearDesbloquear: () => bloquearDesbloquearUsuario(row),
            //       onEliminar: () => eliminarUsuario(row.uid),
            //   }
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
        <button class=" rounded-full flex ic gap-4 " on:click={() => (showModal = true)}> Nuevo Usuario<AddLarge size={32} /> </button> 
    </div>
    
</div>


{#if loading}
  <p>Cargando...</p>
{:else}
<p class="error">{error}</p>
  <Grid data={usuarios} bind:paging={paging} bind:columns bind:selectedRows  bind:filters />
  <GridFooter bind:paging />
{/if}

<Modal bind:showModal>
    <h3 class="text-20">Crear nuevo Usuario</h3>

    <div class="flex flex-col gap-4 p-4 lg:p-8">
        <input type="text" placeholder="Correo electrónico" bind:value={email} />
        <input type="text" placeholder="Nombre de usuario" bind:value={username} />
        <input type="password" placeholder="Contraseña" bind:value={password} />
        <select bind:value={role}>
          <option value="superadmin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="tecnico">Técnico</option>
        </select>
        <button on:click={crearUsuario}>Agregar</button>
        <p class="error">{error}</p>
      </div>
</Modal>

<svelte:window on:keydown={teclaPresionada} />

<style>
  .error {
      color: red;
  }
  input, select{
    --at-apply: w-full p-2 border-0 border-2 border-slate-2;
  }
  
</style>
