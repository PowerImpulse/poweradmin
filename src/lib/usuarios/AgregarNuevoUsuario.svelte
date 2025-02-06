<script lang="ts">
  import { collection, onSnapshot,  addDoc, getDoc, FirestoreError } from "firebase/firestore";
  import { getAuth, createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
  import { dbUsers } from "$lib/client";

  import AddLarge from "carbon-icons-svelte/lib/AddLarge.svelte";


  import type { Usuario } from '$lib/types' 

  import Modal from "$lib/components/ui/Modal.svelte";

  let usuarios: Usuario[] = [];

  let email = "Juan1@me.com";
  let username = "Juan1 Me";
  let role = "Técnico";
  let password = "UnjsdK44@";
  let error = "";

  const usersFirebase = collection(dbUsers, "users");
  const auth = getAuth();

  onSnapshot(usersFirebase, (querySnapshot) => {
      let listaUsuarios: Usuario[] = [];
      querySnapshot.forEach((doc) => {
          let usuario = { ...doc.data(), uid: doc.id } as Usuario;
          listaUsuarios.push(usuario);
      });
      usuarios = listaUsuarios;
    
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

  const teclaPresionada = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
          crearUsuario();
      }
  };


  let showModal = false;
</script>
<svelte:window on:keydown={teclaPresionada} />

<button class=" rounded-full " on:click={() => (showModal = true)}> <AddLarge size={24} /> </button> 

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
        <p class="error">{error}</p>
      </div>
</Modal>

<style>
     input, select{
    --at-apply: w-full p-2 border-0 border-2 border-slate-2;
  }
</style>