import { dbTimeRecord } from '../client';
import { collection, getDocs } from 'firebase/firestore';

async function getTimeRecords() {
  try {
    console.log("Fetching users from Firestore...");
    const timeRecordCol = collection(dbTimeRecord, 'time_record');
    const timeRecordSnapshot = await getDocs(timeRecordCol);
    const timeRecordList = timeRecordSnapshot.docs.map(doc => doc.data());
    // console.log("Equipos fetched:", equiposList);
    return timeRecordList;
  } catch (error) {
    console.error("Error getting time records:", error);
    return [];
  }
}

export { getTimeRecords };