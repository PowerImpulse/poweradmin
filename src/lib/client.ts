// firebaseClient.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";



// Tu configuración de Firebase desde la consola de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDSa5aLL0WwFGCfJTCNj4ATKmOhJF9zEDQ",
  authDomain: "powerxperts-3d795.firebaseapp.com",
  projectId: "powerxperts-3d795",
  storageBucket: "powerxperts-3d795.appspot.com",
  messagingSenderId: "792096008771",
  appId: "1:792096008771:web:c73874a13237a61444c2f6"
};


// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const dbUsers = getFirestore(app);
const dbTareas = getFirestore(app);
const dbEquipos = getFirestore(app);
const dbTimeRecord = getFirestore(app);

export { dbUsers, dbEquipos, dbTimeRecord, auth, dbTareas };

