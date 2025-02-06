<script lang="ts">

    import { collection, onSnapshot,  doc, updateDoc, deleteDoc } from "firebase/firestore";
    import { getAuth, deleteUser } from "firebase/auth"; // Importar métodos de Firebase Authentication
    import { dbUsers } from "$lib/client"; // Asegúrate de que dbUsers es la referencia correcta a tu Firestore
    import SectionName from "$lib/components/ui/SectionName.svelte";
    import { BarLoader } from 'svelte-loading-spinners';
    import type { Usuario } from '$lib/types' 

    const usersFirebase = collection(dbUsers, "users");
    const auth = getAuth(); // Inicializar Firebase Auth

    let items: Usuario[] = [];
    let loading = true;

    onSnapshot(usersFirebase, (querySnapshot) => {
        let listaUsuarios: any[] = [];
        querySnapshot.forEach((doc) => {
            let usuario = { ...doc.data(), uid: doc.id };
            listaUsuarios.push(usuario);
        });
        items = listaUsuarios;
        // console.log(usuarios);
        loading = false;
    });

    let error = "";


    const bloquearDesbloquearUsuario = async (usuario: any) => {
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



</script>



<SectionName Title="Usuarios" class="bg-blue-3">

<div slot="sideactions">
  <span class="text-8">+</span>
</div>
{#if loading}
  <BarLoader />
{:else}
<ul class="grid gap-2 ">
    {#each items as usuario (usuario.uid)}
        <li class:bloqueado={usuario.isBlocked}>
            <span class="w-30%">{usuario.username} <br>  <i class="text-sm">{usuario.email}</i>  </span>
        
            <span class="w-25% ">{usuario.role} <br> {usuario.isBlocked ? 'Bloqueado' : 'Activo'}</span>
            <span class="w-20%">{usuario.created_at?.toDate().toLocaleString()}</span>
            <span class="w-25%" >
                <button on:click={() => bloquearDesbloquearUsuario(usuario)}>
                    {usuario.isBlocked ? 'Desbloquear' : 'Bloquear'}
                </button>
                <button on:click={() => eliminarUsuario(usuario.uid)}>
                    Eliminar
                </button>
            </span>
           
        </li>
    {:else}
        No hay usuarios
    {/each}
    <p class="error">{error}</p>
</ul>∏

{/if}

</SectionName>




<style>
    .bloqueado {
        --at-apply: bg-slate-2 text-slate-4 ;
    }
    .error {
        color: red;     
    }
    li{
        --at-apply: flex gap-4 icb bg-slate-50 p-4 text-slate-6 hover:opacity-80 ;
    }
</style>


