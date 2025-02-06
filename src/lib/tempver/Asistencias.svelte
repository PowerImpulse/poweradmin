<script lang="ts">
    // svelte, typescript y firebase
    import { collection, onSnapshot, doc,  deleteDoc, Timestamp, getDocs  } from "firebase/firestore";
    import { dbTimeRecord, dbUsers } from '$lib/client';
    import { BarLoader } from 'svelte-loading-spinners';

    import Button from "$lib/components/ui/Button.svelte";

  
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
    createdAt?: Timestamp;
    startImagePath: string;
    endImagePath: string;
    
  }

  let asistenciasConNombre: Asistencia[] = [];
  let loading = true;

  const asistenciasRef = collection(dbTimeRecord, 'time_record');
  const usuariosRef = collection(dbUsers, 'users');

  // Obtener usuarios una vez y almacenarlos en un mapa
  const usuariosPorUid = new Map<string, string>();
  getDocs(usuariosRef).then(usuariosSnapshot => {
    usuariosSnapshot.docs.forEach(usuarioDoc => {
      const usuario = usuarioDoc.data();
      usuariosPorUid.set(usuario.uid, usuario.username);
    });

    // Suscribirse a las actualizaciones en tiempo real de las asistencias
    onSnapshot(asistenciasRef, asistenciasSnapshot => {
      asistenciasConNombre = asistenciasSnapshot.docs.map(asistenciaDoc => {
        const asistencia = asistenciaDoc.data() as Asistencia;
        return {
          ...asistencia,
          username: usuariosPorUid.get(asistencia.userId) || 'Usuario no encontrado'
        } as Asistencia;
      });
      loading = false;
    });
  }).catch(error => {
    console.error('Error al obtener los usuarios:', error);
    loading = false;
  });
   
  let error =""
  const eliminarAsistencia = async (uid: string) => {
    try {
        await deleteDoc(doc(dbTimeRecord , "time_record", uid));
    } catch (e:any) {
        return `Error al eliminar asistencia: ${e.message}`;
    }
    return 'Asistencia eliminada correctamente';
};
  
   const urlgoogle = "https://www.google.es/maps?q="
   const urlStorage ="gs://powerxperts-3d795.appspot.com/"
 
</script>





<ul>
    {#each asistenciasConNombre as asistencia (asistencia.uid)}
        <li >
          Nombre: {asistencia.username}
          <br> Descripción: {asistencia.description} del día: {asistencia.startTime.toDate().toLocaleDateString()}
          <br> Dirección: {asistencia.startLocation}<br>
          <br> {#if asistencia.imageUrl}
          <img src={asistencia.imageUrl} width="150" alt="Imagen de la asistencia" />
        {:else}
          <p>No se encontró imagen</p>
        {/if}
          <br> Entrada: {asistencia.startTime.toDate().toLocaleString('es-MX', {hour: 'numeric', minute: '2-digit', second: '2-digit', timeZone: 'UTC'})}
          <br> Salida: {asistencia.endTime.toDate().toLocaleString('es-MX', {hour: 'numeric', minute: '2-digit', second: '2-digit', timeZone: 'UTC'})}
          <br> <a href={urlgoogle+asistencia.startLatitude+","+asistencia.endLongitude } target="_blank" >
                Ubicación de Entrada: {asistencia.startLatitude },{asistencia.startLongitude } </a>
          <br><a href={urlgoogle+asistencia.endLatitude+","+asistencia.endLongitude } target="_blank" >
                        Ubicación de Salida:{asistencia.endLatitude },{asistencia.endLongitude } </a>    
        <br>
                <Button on:click={() => eliminarAsistencia(asistencia.uid)}>
                    Eliminar
                </Button>
          
        </li>
    {:else}
        No hay asistencias
    {/each}
    <p class="error">{error}</p>
</ul>


<style>
    li{
        padding:10px;
        background: var(--gr-20);

    }
</style>


