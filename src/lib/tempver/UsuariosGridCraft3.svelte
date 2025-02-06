<script lang="ts">
  import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, getDoc, FirestoreError } from "firebase/firestore";
  import { getAuth, createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
  import { dbUsers } from "$lib/client";
  import { Grid, GridFooter, type PagingData, type GridColumn } from '@mediakular/gridcraft'; 
  import UsuarioEmail from "$lib/usuarios/UsuarioEmail.svelte";
  import AccionesUsuario from "$lib/usuarios/AccionesUsuario.svelte";
  import type { Usuario } from '$lib/types' // TIPOS TS
  import Modal from "$lib/components/ui/Modal.svelte";

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

            const user = auth.currentUser;
            if (user) {
                await deleteUser(user);
            }
        } catch (e: any) {
            error = `Error al eliminar usuario: ${e.message}`;
        }
    };

// const eliminarUsuario = async (uid: string) => {
//     try {
//         // Elimina el usuario de Firestore
//         await deleteDoc(doc(dbUsers, "users", uid));
        
//         // Elimina el usuario de Firebase Authentication
//         const user = auth.currentUser;
//         if (user && user.uid === uid) {
//             await deleteUser(user);
//         } else {
//             error = "Usuario no autenticado o UID no coincide.";
//         }
//     } catch (e: any) {
//         error = `Error al eliminar usuario: ${e.message}`;
//     }
// };

  const teclaPresionada = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
          crearUsuario();
      }
  };

  let paging = {
      itemsPerPage: 40,
      currentPage: 1,
      itemsPerPageOptions: [10, 20, 100]
  } as PagingData;

  let columns: GridColumn<Usuario>[] = [
      { 
          key: 'infoUser', 
          title: 'Usuario', 
          renderComponent: UsuarioEmail, 
          accessor: (row) => ({ email: row.email, username: row.username }) 
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

  let showModal = false;
</script>

<button on:click={() => (showModal = true)}> Agregar nuevo usuario</button>


{#if loading}
  <p>Cargando...</p>
{:else}
<p class="error">{error}</p>
  <Grid data={usuarios} {paging} bind:columns bind:selectedRows/>
{/if}

<Modal bind:showModal>
    <h3 slot="header">
		Crear nuevo Usuario
	</h3>
    <div class="flex flex-col gap-4 p-4 lg:p-8">
        <input type="text" placeholder="Correo electrónico" bind:value={email} />
        <input type="text" placeholder="Nombre de usuario" bind:value={username} />
        <input type="password" placeholder="Contraseña" bind:value={password} />
        <select bind:value={role}>
          <option value="SuperAdmin">Super Admin</option>
            <option value="Admintrador">Admin</option>
            <option value="Técnico">Técnico</option>
        </select>
        <button on:click={crearUsuario}>Agregar</button>
        
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
