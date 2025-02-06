// @ts-nocheck
import { writable, readable } from "svelte/store";
import { auth, dbUsers } from '$lib/client';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';


export const user = writable(null);
export const isLoggedIn = writable(false);
export const role = writable(null);
export const sectionTitle = writable(''); 

const theme = writable('system');
export { theme };

onAuthStateChanged(auth, async (firebaseUser) => {
  user.set(firebaseUser);
  isLoggedIn.set(!!firebaseUser);
  
  if (firebaseUser) {
    const userDoc = await getDoc(doc(dbUsers, "users", firebaseUser.uid));
    if (userDoc.exists()) {
      role.set(userDoc.data().role);
    } else {
      role.set(null);
    }
  } else {
    role.set(null);
  }
});


export const time = readable(new Date(), function start(set) {
	const interval = setInterval(() => {
		set(new Date());
	}, 1000);

	return function stop() {
		clearInterval(interval);
	};
});