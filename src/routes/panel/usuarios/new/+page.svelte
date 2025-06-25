<script lang="ts">
    import { collection, addDoc } from "firebase/firestore";
    import { getAuth, createUserWithEmailAndPassword} from "firebase/auth"; 
    import { db } from "$lib/client"; 
    import SectionName from "$lib/components/ui/SectionName.svelte";

    const usersFb = collection(db, "users");
    const auth = getAuth(); // Inicializar Firebase Auth

    let email = "Jhon@me.com";
    let username = "Jhon Do ";
    let role = "Técnico";
    let password = "UnjsdK44@";
    let error = "";

    const crearUsuario = async () => {
        if (email.trim() !== "" && username.trim() !== "" && role.trim() !== "" && password.trim() !== "") {
            try {
                // Crear usuario en Firebase Authentication
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Crear usuario en Firestore
                await addDoc(usersFb, {
                    email: email,
                    username: username,
                    role: role,
                    isBlocked: false,
                    created_at: new Date(),
                    uid: user.uid // Usar el uid del usuario creado en Firebase Authentication
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
        role = "Técnico";
        password = "";
    };

   

</script>

<SectionName Title="Crear Nuevo Usuario" >

<div class="panel">
    <div class="col">
        <form class="crearnuevo grid gap-4 ">
            <input type="text" placeholder="Correo electrónico" bind:value={email} />
            <input type="text" placeholder="Nombre de usuario" bind:value={username} />
            <input type="password" placeholder="Contraseña" bind:value={password} /> <!-- Campo para la contraseña -->
            <select bind:value={role}>
                <option value="Admin">  Super Admin</option>
                <option value="Admin">  Admin</option>
                <option value="Técnico">Técnico</option>
            </select>
        <div> 
            <button on:click={crearUsuario} class="p-4 bg-blue-8 hover:bg-sky-6 border-1   text-white ">Agregar Usuario</button>
        </div>
        </form>
       </div>
    
</div>

</SectionName>

<style>
  
  input, select{
    --at-apply:  p-4 border-2 border-zinc-5 text-4  ;
   
  }
</style>