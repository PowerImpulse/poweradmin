// deleteUserService.ts
import { doc,deleteDoc} from "firebase/firestore";
import { getAuth, deleteUser } from "firebase/auth";
import { dbUsers } from "$lib/client";


const auth = getAuth();


export const eliminarUsuario = async (uid: string) => {
    try {
        await deleteDoc(doc(dbUsers, "users", uid));

        const user = auth.currentUser;
        if (user && user.uid === uid) {
            await deleteUser(user);
        }
    } catch (e: any) {
        throw new Error(`Error al eliminar usuario: ${e.message}`);
    }
};
