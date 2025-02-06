<script lang="ts">
    import { collection, onSnapshot, doc, deleteDoc, getDoc, Timestamp } from "firebase/firestore";
    import { dbTimeRecord, dbUsers } from "$lib/client";
    import Button from "$lib/components/ui/Button.svelte";
    import { BarLoader } from 'svelte-loading-spinners';
  
    const timeRecordRef = collection(dbTimeRecord, "time_record");
    const usersRef = collection(dbUsers, "users");
  
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
    let usuarios: { [key: string]: string } = {};
    let loading = true;
    let searchQuery = ""; // Campo de búsqueda
    let error = "";
  
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
        loading = false;
    });
  
    const eliminarAsistencia = async (uid: string) => {
        try {
            await deleteDoc(doc(dbTimeRecord, "time_record", uid));
        } catch (e: any) {
            error = `Error al eliminar asistencia: ${e.message}`;
        }
    };
  
    const urlgoogle = "https://www.google.es/maps?q=";
  
    function filterAsistencias(asistencias: Asistencia[], query: string): Asistencia[] {
        const lowerQuery = query.toLowerCase();
        return asistencias.filter(asistencia =>
            asistencia.description.toLowerCase().includes(lowerQuery) ||
            (asistencia.username || '').toLowerCase().includes(lowerQuery) ||
            asistencia.startLocation.toLowerCase().includes(lowerQuery) ||
            asistencia.endLocation.toLowerCase().includes(lowerQuery) ||
            asistencia.startTime.toDate().toLocaleDateString('es-ES').includes(query) ||
            asistencia.endTime.toDate().toLocaleDateString('es-ES').includes(query)
        );
    }
  </script>
  
  {#if loading}
    <BarLoader size="60" color="#FF3E00" unit="px" duration="1s" />
  {:else}
    <div class="table_component">
        <!-- Campo de búsqueda -->
        <input
          type="text"
          placeholder="Buscar..."
          bind:value={searchQuery}
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
                {#each filterAsistencias(asistencias, searchQuery) as asistencia (asistencia.uid)}
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
  {/if}
  
  <style>
    .search-input {
      margin-bottom: 10px;
      padding: 8px;
      font-size: 16px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
  </style>
  