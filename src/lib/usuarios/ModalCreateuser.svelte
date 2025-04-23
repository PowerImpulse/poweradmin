<script lang="ts">
    import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
    import { getAuth, createUserWithEmailAndPassword} from "firebase/auth";
    import AddLarge from "carbon-icons-svelte/lib/AddLarge.svelte";
    import { dbUsers } from "$lib/client";
    import type { Usuario } from '$lib/types' // TIPOS TS
    import Modal from "$lib/components/ui/Modal.svelte";
 
  
  
    const usersFirebase = collection(dbUsers, "users");
    const auth = getAuth();
  
    let usuarios: Usuario[] = [];

    let loading = true;
    let email = "Juan1@me.com";
    let username = "Juan1 Me";
    let role = "Técnico";
    let password = "UnjsdK44@";
    let error = "";
  
  

  
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
 
  
  // Crear usuario al presionar ENTER
    const teclaPresionada = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            crearUsuario();
        }
    };
  
  
 
    let showModal = false;
  
  
   
  </script>
  
  <button class=" rounded-full flex ic gap-4 " on:click={() => (showModal = true)}> Nuevo Usuario<AddLarge size={32} /> </button> 
  
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
  