import { dbTimeRecord, dbUsers } from '$lib/client';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export async function get() {
    const timeRecordRef = collection(dbTimeRecord, 'time_record');
    const usersRef = collection(dbUsers, 'users');

    let asistencias = [];
    let usuarios = {};

    const querySnapshot = await getDocs(timeRecordRef);
    for (const doc of querySnapshot.docs) {
        let asistencia = { ...doc.data(), uid: doc.id };

        if (!usuarios[asistencia.userId]) {
            const userDoc = await getDoc(doc(usersRef, asistencia.userId));
            if (userDoc.exists()) {
                usuarios[asistencia.userId] = userDoc.data().username || 'Usuario no encontrado';
            } else {
                usuarios[asistencia.userId] = 'Usuario no encontrado';
            }
        }
        asistencia.username = usuarios[asistencia.userId];
        asistencias.push(asistencia);
    }

    return {
        body: { asistencias }
    };
}
