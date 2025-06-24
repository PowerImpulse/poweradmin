// functions/users/manageUsers.js

const admin = require("firebase-admin");
const functions = require("firebase-functions");

/** . jsDoc
 * Elimina un usuario de Firebase Authentication y su documento correspondiente en Firestore.
 * Solo los administradores pueden ejecutar esta función.
 * @param {object} data - El objeto de datos enviado desde el cliente. Debe contener `uid`.
 * @param {object} context - El contexto de la función, incluyendo la info de autenticación del llamador.
 * @returns {Promise<{success: boolean, message: string}>}
 */
const deleteUser = async (data, context) => {
  // 1. Verificación de permisos

  if (context.auth.token.role !== "admin" && context.auth.token.role !== "superadmin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Solo los administradores pueden eliminar usuarios.",
    );
  }

  const uidToDelete = data.uid;
  if (!uidToDelete) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "La función debe ser llamada con un \"uid\" para eliminar.",
    );
  }

  try {
    // 2. Eliminar el usuario de Firebase Authentication
    await admin.auth().deleteUser(uidToDelete);
    functions.logger.info(`Successfully deleted user ${uidToDelete} from Authentication.`);

    // 3. Eliminar el documento del usuario de Firestore
    const userDocRef = admin.firestore().collection("users").doc(uidToDelete);
    await userDocRef.delete();
    functions.logger.info(`Successfully deleted user document ${uidToDelete} from Firestore.`);

    return { success: true, message: `Usuario ${uidToDelete} eliminado correctamente.` };
  } catch (error) {
    functions.logger.error(`Error deleting user ${uidToDelete}:`, error);
    throw new functions.https.HttpsError(
      "internal",
      "Ocurrió un error al eliminar el usuario.",
      error.message,
    );
  }
};

const setUserRole = async (data, context) => {
  // Verificación de permisos
  if (context.auth.token.role !== 'admin' && context.auth.token.role !== 'superadmin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Solo los administradores pueden asignar roles.'
    );
  }

  const { uid, role } = data;
  const validRoles = ['admin', 'superadmin', 'gerente', 'tecnico']; // Lista de roles válidos

  if (!uid || !role || !validRoles.includes(role)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Se requiere un "uid" y un "role" válido.'
    );
  }

  try {
    // Asignar el Custom Claim al usuario
    await admin.auth().setCustomUserClaims(uid, { role: role });

    // También actualizamos el rol en el documento de Firestore para consistencia
    await admin.firestore().collection('users').doc(uid).update({ role: role });

    return { success: true, message: `Rol "${role}" asignado a ${uid}.` };
  } catch (error) {
    functions.logger.error(`Error setting role for user ${uid}:`, error);
    throw new functions.https.HttpsError('internal', 'Ocurrió un error al asignar el rol.');
  }
};


module.exports = {
  deleteUser, setUserRole
};

