<script lang="ts">
    // svelte, typescript y firebase
    import { collection, onSnapshot, doc, deleteDoc, getDoc, Timestamp } from "firebase/firestore";
    import { dbTimeRecord, dbUsers } from "$lib/client"; // Asegúrate de que db es la referencia correcta a tu Firestore
    import Button from "$lib/components/ui/Button.svelte";
    import { BarLoader } from 'svelte-loading-spinners';

    const timeRecordRef = collection(dbTimeRecord, "time_record");

    interface Asistencia {
        uid: string;
        userId: string;
        description: string;
        startTime: Timestamp;
        endTime: Timestamp;
        imageUrl: string;
        startLatitude: number;
        startLongitude: number;
        startLocation: string;
        endImageUrl: string;
        endLatitude: number;
        endLongitude: number;
        endLocation: string;
        username?: string;
    }

    let asistencias: Asistencia[] = [];
    let filteredAsistencias: Asistencia[] = [];
    let usuarios: { [key: string]: string } = {};
    let loading = true; // Variable para gestionar el estado de carga
    const usersRef = collection(dbUsers, "users");

    let startDate: string = "";
    let endDate: string = "";
    let searchQuery: string = "";

    async function fetchUser(userId: string) {
        const userDoc = await getDoc(doc(usersRef, userId));
        if (userDoc.exists()) {
            const username = userDoc.data()?.username || 'Usuario no encontrado';
            console.log(`Usuario ID: ${userId}, Nombre de Usuario: ${username}`); // Agregar console.log aquí
            return username;
        }
        return 'Usuario no encontrado';
    }

    onSnapshot(timeRecordRef, async (querySnapshot) => {
        let listaAsistencias: Asistencia[] = [];
        for (const doc of querySnapshot.docs) {
            let asistencia = { ...doc.data(), uid: doc.id } as Asistencia;
            if (!usuarios[asistencia.userId]) {
                usuarios[asistencia.userId] = await fetchUser(asistencia.userId);
            }
            asistencia.username = usuarios[asistencia.userId];
            listaAsistencias.push(asistencia);
        }
        asistencias = listaAsistencias;
        filterAsistencias(); // Filtrar las asistencias después de cargarlas
        loading = false; // Indica que la carga ha terminado
        console.log('Asistencias:', asistencias); // Agregar console.log aquí
    });

    function filterAsistencias() {
        let filtered = asistencias;

        if (startDate && endDate) {
            const start = new Date(startDate).getTime();
            const end = new Date(endDate).getTime();
            filtered = filtered.filter(asistencia => {
                const startTime = asistencia.startTime.toDate().getTime();
                return startTime >= start && startTime <= end;
            });
        }

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(asistencia =>
                asistencia.description.toLowerCase().includes(lowerQuery) ||
                (asistencia.username || '').toLowerCase().includes(lowerQuery) ||
                asistencia.startLocation.toLowerCase().includes(lowerQuery) ||
                asistencia.endLocation.toLowerCase().includes(lowerQuery) ||
                asistencia.startTime.toDate().toLocaleDateString('es-ES').includes(searchQuery) ||
                asistencia.endTime.toDate().toLocaleDateString('es-ES').includes(searchQuery)
            );
        }

        filteredAsistencias = filtered;
    }

    let description = "";
    let endImagePath = "";
    let endImageUrl = "";
    let endLatitude = "";
    let endLongitude = "";
    let endLocation = "";
    let endTime = "";
    let imageUrl = "";
    let startImagePath = "";
    let startLatitude = "";
    let startLocation = "";
    let startLongitude = "";
    let startTime = "";
    let userId = "";
    let error = "";

    const eliminarAsistencia = async (uid: string) => {
        try {
            await deleteDoc(doc(dbTimeRecord, "time_record", uid));
        } catch (e: any) {
            error = `Error al eliminar asistencia: ${e.message}`;
        }
    };

    const urlgoogle = "https://www.google.es/maps?q=";
</script>

{#if loading}
    <BarLoader size="60" color="#FF3E00" unit="px" duration="1s" />
{:else}
    <div>
        <div>
            <label for="startDate">Fecha de Inicio:</label>
            <input type="date" id="startDate" bind:value={startDate} on:change={filterAsistencias} />
            <label for="endDate">Fecha de Fin:</label>
            <input type="date" id="endDate" bind:value={endDate} on:change={filterAsistencias} />
        </div>
        <div class="table_component">
            <!-- Campo de búsqueda -->
            <input
                type="text"
                placeholder="Buscar..."
                bind:value={searchQuery}
                on:input={filterAsistencias}
                class="search-input"
            />

            <table>
                <thead>
                    <tr>
                        <td>Nombre de Usuario</td>
                        <td>Descripción</td>
                        <td>Entrada</td>
                        <td>Ubicación</td>
                        <td>Salida</td>
                        <td>Ubicación Salida</td>
                        <td>Acciones</td>
                    </tr>
                </thead>
                <tbody>
                    {#each filteredAsistencias as asistencia (asistencia.uid)}
                        <tr>
                            <td>{asistencia.username}</td>
                            <td>{asistencia.description}</td>
                            <td>{asistencia.startTime.toDate().toLocaleString('es-ES')}</td>
                            <td>
                                <img src={asistencia.imageUrl} alt="" width="60" style="height: auto; aspect-ratio: 1 / 1;">
                                <p>
                                    <a class='ubication' href='{urlgoogle + asistencia.startLatitude},{asistencia.startLongitude}' target='_blank'>
                                        {asistencia.startLocation}
                                    </a>
                                </p>
                                <span style="font-size: 12px;">{asistencia.startLatitude},{asistencia.startLongitude}</span>
                            </td>
                            <td>{asistencia.endTime.toDate().toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                            <td>
                                <img src={asistencia.endImageUrl} width="60" style="height: auto; aspect-ratio: 1 / 1;" alt={asistencia.description}>
                                <p>
                                    <a class='ubication' href='{urlgoogle + asistencia.endLatitude},{asistencia.endLongitude}' target='_blank'>
                                        {asistencia.endLocation}
                                    </a>
                                </p>
                                <span style="font-size: 12px;">{asistencia.endLatitude},{asistencia.endLongitude}</span>
                            </td>
                            <td>
                                <Button on:click={() => eliminarAsistencia(asistencia.uid)}>Eliminar</Button>
                            </td>
                        </tr>
                    {:else}
                        No hay asistencias
                    {/each}
                    <p class="error">{error}</p>
                </tbody>
            </table>
        </div>
    </div>
{/if}

<style>
    table {
        border-collapse: collapse;
    }

    td {
        border: 1px solid #ccc;
        padding: 8px;
    }

    tr:nth-child(even) {
        background: #efefef;
    }

    tr:hover {
        background: var(--br-20);
    }
</style>
