import { collection, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { dbUsers } from "$lib/client";
import type { Usuario } from '$lib/types';

const usersFirebase = collection(dbUsers, "users");
const auth = getAuth();

export const crearUsuario = async (email: string, username: string, role: string, password: string) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await addDoc(usersFirebase, {
            email: email,
            username: username,
            role: role,
            isBlocked: false,
            created_at: new Date(),
            uid: user.uid
        });

        return null;
    } catch (e: any) {
        return `Error al crear usuario: ${e.message}`;
    }
};

export const bloquearUsuario = async (usuario: Usuario) => {
    try {
        await updateDoc(doc(dbUsers, "users", usuario.uid), {
            isBlocked: !usuario.isBlocked,
        });
    } catch (e: any) {
        throw new Error(`Error al bloquear/desbloquear usuario: ${e.message}`);
    }
};

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
