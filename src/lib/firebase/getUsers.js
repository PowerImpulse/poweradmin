import { dbUsers} from '../client';
import { collection, getDocs } from 'firebase/firestore';

async function getUsers() {
  try {
    console.log("Fetching users from Firestore...");
    const usersCol = collection(dbUsers, 'users');
    const usersSnapshot = await getDocs(usersCol);
    const usersList = usersSnapshot.docs.map(doc => doc.data());
    console.log("Users fetched:", usersList);
    return usersList;
  } catch (error) {
    console.error("Error getting users:", error);
    return [];
  }
}

export { getUsers };