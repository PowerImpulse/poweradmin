<script lang="ts">
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
  
  <div class="table_component">
  
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
        {#each asistenciasConNombre as asistencia (asistencia.uid)}
            <tr>
                <td>{asistencia.username || 'No se encontró el usuario'}</td>
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
            <tr>
                <td colspan="7">No hay asistencias</td>
            </tr>
        {/each}
    
    </tbody>
  </table>
</div>
  
  
  
  <style>
    .table_component {
    overflow: auto;
    width: 100%;
}

.table_component table {
    border: 1px solid #dededf;
    height: 100%;
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    border-spacing: 1px;
    text-align: left;
}


.table_component td {
    border: 1px solid #dededf;
    background-color: #ffffff;
    color: #000000;
    padding: 5px;
}
    
  </style>