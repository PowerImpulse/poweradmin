<script lang="ts">
    import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
    import { getAuth, createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
    import { dbUsers } from "$lib/client";
    import { Grid, h } from 'gridjs';
    import 'gridjs/dist/theme/mermaid.css';
    import { onMount } from 'svelte';

    const usersData = collection(dbUsers, "users");
    const auth = getAuth();

    let usuarios: any[] = [];

    onSnapshot(usersData, (querySnapshot) => {
        let listaUsuarios: any[] = [];
        querySnapshot.forEach((doc) => {
            let usuario = { ...doc.data(), uid: doc.id };
            listaUsuarios.push(usuario);
        });
        usuarios = listaUsuarios;
        updateTable();
    });

    let username = "";
    let email = "";
    let role = "Técnico";
    let password = "";
    let error = "";

    const crearUsuario = async () => {
        if (email.trim() !== "" && username.trim() !== "" && role.trim() !== "" && password.trim() !== "") {
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                await addDoc(usersData, {
                    username: username,
                    email: email,
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
        username = "";
        email = "";
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
            await deleteDoc(doc(dbUsers, "users", uid));

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

    let grid: Grid;

    const updateTable = () => {
        if (grid) {
            grid.updateConfig({
                data: usuarios.map(usuario => [
                    h('div', {}, [
                        h('div', {}, usuario.username),
                        h('div', {}, usuario.email)
                    ]),
                    usuario.role,
                    usuario.isBlocked ? 'Bloqueado' : 'Activo',
                    usuario.created_at?.toDate().toLocaleString(),
                    h('div', {}, [
                        h('button', {
                            onClick: () => bloquearDesbloquearUsuario(usuario)
                        }, usuario.isBlocked ? 'Desbloquear' : 'Bloquear'),
                        h('button', {
                            onClick: () => eliminarUsuario(usuario.uid)
                        }, 'Eliminar')
                    ])
                ])
            }).forceRender();
        }
    };

    onMount(() => {
        grid = new Grid({
            columns: ['Usuario y Correo', 'Rol', 'Estado', 'Creado', 'Acciones'],
            data: usuarios.map(usuario => [
                h('div', {}, [
                    h('div', {}, usuario.username),
                    h('div', {}, usuario.email)
                ]),
                usuario.role,
                usuario.isBlocked ? 'Bloqueado' : 'Activo',
                usuario.created_at?.toDate().toLocaleString(),
                h('div', {}, [
                    h('button', {
                        onClick: () => bloquearDesbloquearUsuario(usuario)
                    }, usuario.isBlocked ? 'Desbloquear' : 'Bloquear'),
                    h('button', {
                        onClick: () => eliminarUsuario(usuario.uid)
                    }, 'Eliminar')
                ])
            ]),
            search: true,
            pagination: {
                limit: 20
            },
            sort: true,
            language: {
                search: {
                    placeholder: 'Buscar...'
                },
                pagination: {
                    previous: 'Anterior',
                    next: 'Siguiente',
                    showing: 'Mostrando',
                    results: () => 'Registros'
                }
            }
        }).render(document.getElementById('tablaUsuarios') as HTMLElement);
    });
</script>

<div>
    <input type="text" placeholder="Correo electrónico" bind:value={email} />
    <input type="text" placeholder="Nombre de usuario" bind:value={username} />
    <input type="password" placeholder="Contraseña" bind:value={password} />
    <select bind:value={role}>
        <option value="Admin">Admin</option>
        <option value="Técnico">Técnico</option>
    </select>
    <button on:click={crearUsuario}>Agregar</button>
    <p class="error">{error}</p>
</div>

<div id="tablaUsuarios"></div>

<svelte:window on:keydown={teclaPresionada} />

<style>
    .error {
        color: red;
    }
</style>
