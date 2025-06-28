// src/lib/services/authService.ts
import { functions } from '$lib/client';
import { httpsCallable } from 'firebase/functions'; // Importación añadida

export const createUser = async (email: string, password: string, role: string) => {
  const createUserFunction = httpsCallable(functions, 'createUser');
  try {
    const result = await createUserFunction({ email, password, role });
    return result.data;
  } catch (error: any) {
    throw new Error(error.message || 'Error al crear usuario');
  }
};

export const deleteUser = async (uid: string) => {
  const deleteUserFunction = httpsCallable(functions, 'deleteUser');
  try {
    const result = await deleteUserFunction({ uid });
    return result.data;
  } catch (error: any) {
    throw new Error(error.message || 'Error al eliminar usuario');
  }
};

export const setUserRole = async (uid: string, role: string) => {
  const setUserRoleFunction = httpsCallable(functions, 'setUserRole');
  try {
    const result = await setUserRoleFunction({ uid, role });
    return result.data;
  } catch (error: any) {
    throw new Error(error.message || 'Error al actualizar rol');
  }
};