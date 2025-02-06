<script lang="ts">

    import { collection, onSnapshot, getFirestore, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
    import { getAuth, createUserWithEmailAndPassword, deleteUser } from "firebase/auth"; // Importar métodos de Firebase Authentication
    import { dbUsers } from "$lib/client"; // Asegúrate de que dbUsers es la referencia correcta a tu Firestore
   

    const usersFirebase = collection(dbUsers, "users");
    const auth = getAuth(); // Inicializar Firebase Auth

    let usuarios: any[] = [];

    onSnapshot(usersFirebase, (querySnapshot) => {
        let listaUsuarios: any[] = [];
        querySnapshot.forEach((doc) => {
            let usuario = { ...doc.data(), uid: doc.id };
            listaUsuarios.push(usuario);
        });
        usuarios = listaUsuarios;
        // console.log(usuarios);
    });

    let email = "";
    let username = "";
    let role = "Técnico"; // Valor predeterminado para el select
    let password = ""; // Añadir un campo para la contraseña
    let error = "";

    const crearUsuario = async () => {
        if (email.trim() !== "" && username.trim() !== "" && role.trim() !== "" && password.trim() !== "") {
            try {
                // Crear usuario en Firebase Authentication
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Crear usuario en Firestore
                await addDoc(usersFirebase, {
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

    const bloquearDesbloquearUsuario = async (usuario: any) => {
        await updateDoc(doc(dbUsers, "users", usuario.uid), {
            isBlocked: !usuario.isBlocked,
        });
    };

    const eliminarUsuario = async (uid: string) => {
        try {
            // Eliminar usuario de Firestore
            await deleteDoc(doc(dbUsers, "users", uid));

            // Eliminar usuario de Firebase Authentication
            const user = auth.currentUser;
            if (user) {
                await deleteUser(user);
            }
        } catch (e: any) {
            error = `Error al eliminar usuario: ${e.message}`;
        }
    };

    const teclaPresionada = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            crearUsuario();
        }
    };
</script>

<div>
    <input type="text" placeholder="Correo electrónico" bind:value={email} />
    <input type="text" placeholder="Nombre de usuario" bind:value={username} />
    <input type="password" placeholder="Contraseña" bind:value={password} /> <!-- Campo para la contraseña -->
    <select bind:value={role}>
        <option value="Admin">Admin</option>
        <option value="Técnico">Técnico</option>
    </select>
    <button on:click={crearUsuario}>Agregar</button>
</div>

<ul>
    {#each usuarios as usuario (usuario.uid)}
        <li class:bloqueado={usuario.isBlocked}>
            <span>{usuario.email}</span> -
            <span>{usuario.username}</span> -
            <span>{usuario.role}</span> -
            <span>{usuario.isBlocked ? 'Bloqueado' : 'Activo'}</span> -
            <span>{usuario.created_at?.toDate().toLocaleString()}</span>
            <span>
                <button on:click={() => bloquearDesbloquearUsuario(usuario)}>
                    {usuario.isBlocked ? 'Desbloquear' : 'Bloquear'}
                </button>
            </span>
            <span>
                <button on:click={() => eliminarUsuario(usuario.uid)}>
                    Eliminar
                </button>
            </span>
        </li>
    {:else}
        No hay usuarios
    {/each}
    <p class="error">{error}</p>
</ul>

<svelte:window on:keydown={teclaPresionada} />


<style>
    .bloqueado {
        text-decoration: line-through;
    }
    .error {
        color: red;     
    }
</style>



