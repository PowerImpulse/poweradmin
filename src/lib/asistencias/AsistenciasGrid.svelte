<script lang="ts">
  import { onMount } from 'svelte';
  import { collection, onSnapshot, getDoc, doc, Timestamp } from "firebase/firestore";
  import { dbTimeRecord, dbUsers } from "$lib/client";
  import { html, Grid } from "gridjs";
  import 'gridjs/dist/theme/mermaid.css';

  const urlgoogle = "https://www.google.es/maps?q=";
  const timeRecordRef = collection(dbTimeRecord, "time_record");
  const usersRef = collection(dbUsers, "users");
  let loading = true;

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

  async function fetchUser(userId: string) {
    const userDoc = await getDoc(doc(usersRef, userId));
    if (userDoc.exists()) {
      return userDoc.data()?.username || 'Usuario no encontrado';
    }
    return 'Usuario no encontrado';
  }

  onMount(() => {
    const unsubscribe = onSnapshot(timeRecordRef, async (querySnapshot) => {
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
      updateGrid();
    });

    return () => unsubscribe();
  });

  let grid: Grid;

  function updateGrid() {
    grid = new Grid({
      columns: [
        { name: "Nombre de Usuario", sort: true },
        'Descripción',
        'Entrada',
        'Ubicación',
        'Salida',
        'Ubicación Salida'
      ],
      data: asistencias.map(asistencia => [
        asistencia.username,
        asistencia.description,
        asistencia.startTime.toDate().toLocaleString('es-ES'),
        html(`
          <div>
            <img src='${asistencia.imageUrl}' width="60" style="height: auto; aspect-ratio: 1 / 1;">
            <hr>
            <a class='ubication' href='${urlgoogle + asistencia.startLatitude},${asistencia.startLongitude}' target='_blank'>
              ${asistencia.startLocation}
            </a>
            <hr>
            <span>${asistencia.startLatitude},${asistencia.startLongitude}</span>
          </div>
        `),
        asistencia.endTime.toDate().toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }),
        html(`
          <div>
            <img src='${asistencia.endImageUrl}' width="60" style="height: auto; aspect-ratio: 1 / 1;">
            <hr>
            <a class='ubication' href='${urlgoogle + asistencia.endLatitude},${asistencia.endLongitude}' target='_blank'>
              ${asistencia.endLocation}
            </a>
            <hr>
            <span>${asistencia.endLatitude},${asistencia.endLongitude}</span>
          </div>
        `)
      ]),
      search: true,
      pagination: {
                limit: 10
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

    }).render(document.getElementById("asistencias") as HTMLElement) ;
  }
</script>

<div id="asistencias"></div>
