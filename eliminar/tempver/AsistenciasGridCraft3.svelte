<script lang="ts">
    import { collection, onSnapshot, doc, deleteDoc, Timestamp } from "firebase/firestore";
    import { dbTimeRecord } from "$lib/client"; // Asegúrate de que db es la referencia correcta a tu Firestore
    import Button from "$lib/components/ui/Button.svelte";
    import { BarLoader } from 'svelte-loading-spinners';
    import { Grid } from '@mediakular/gridcraft';
  
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
    let loading = true;
    let error = "";
  
    onSnapshot(timeRecordRef, (querySnapshot) => {
      let listaAsistencias: Asistencia[] = [];
      querySnapshot.forEach((doc) => {
        let asistencia = { ...doc.data(), uid: doc.id } as Asistencia;
        listaAsistencias.push(asistencia);
      });
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
  </script>
  
  {#if loading}
    <BarLoader />
  {:else}
    <Grid bind:data={asistencias}>
      <table>
        <thead>
          <tr>
            <th>Nombre de Usuario</th>
            <th>Descripción</th>
            <th>Entrada</th>
            <th>Ubicación</th>
            <th>Salida</th>
            <th>Ubicación Salida</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#each asistencias as data (data.uid)}
            <tr>
              <td>{data.username}</td>
              <td>{data.description}</td>
              <td>{data.startTime.toDate().toLocaleString('es-ES')}</td>
              <td>
                <img src={data.imageUrl} alt="" width="60" style="height: auto; aspect-ratio: 1 / 1;">
                <p>
                  <a class='ubication' href='{urlgoogle + data.startLatitude},{data.startLongitude}' target='_blank'>
                    {data.startLocation}
                  </a>
                </p>
                <span style="font-size: 12px;">{data.startLatitude},{data.startLongitude}</span>
              </td>
              <td>{data.endTime.toDate().toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}</td>
              <td>
                <img src={data.endImageUrl} width="60" style="height: auto; aspect-ratio: 1 / 1;" alt={data.description}>
                <p>
                  <a class='ubication' href='{urlgoogle + data.endLatitude},{data.endLongitude}' target='_blank'>
                    {data.endLocation}
                  </a>
                </p>
                <span style="font-size: 12px;">{data.endLatitude},{data.endLongitude}</span>
              </td>
              <td>
                <Button on:click={() => eliminarAsistencia(data.uid)}>Eliminar</Button>
              </td>
            </tr>
          {/each}
          {#if asistencias.length === 0}
            <tr>
              <td colspan="7">No hay asistencias</td>
            </tr>
          {/if}
          <p class="error">{error}</p>
        </tbody>
      </table>
    </Grid>
  {/if}
  