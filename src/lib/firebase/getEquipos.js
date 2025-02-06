import { dbEquipos } from '../client';

import { collection, getDocs } from 'firebase/firestore';

async function getEquipos() {
  try {
    console.log("Fetching users from Firestore...");
    const equiposCol = collection(dbEquipos, 'equipos');
    const equiposSnapshot = await getDocs(equiposCol);
    const equiposList = equiposSnapshot.docs.map(doc => doc.data());
    // console.log("Equipos fetched:", equiposList);
    return equiposList;
  } catch (error) {
    console.error("Error getting equipos:", error);
    return [];
  }
}

export { getEquipos };