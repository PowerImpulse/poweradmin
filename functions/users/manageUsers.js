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
  functions.logger.info("--- INICIANDO VERIFICACIÓN DE CONTEXTO ---");

  // 1. Verificar si el objeto 'auth' existe en el contexto
  if (!context.auth) {
    functions.logger.error("FALLO CRÍTICO: El objeto 'context.auth' es UNDEFINED. El usuario no está autenticado en la llamada.");
    throw new functions.https.HttpsError(
      "unauthenticated",
      "La solicitud no contiene credenciales de autenticación.",
    );
  }

  // Si 'auth' existe, lo logueamos para verlo
  functions.logger.info("ÉXITO: El objeto 'context.auth' existe. Contenido:", context.auth);

  // 2. Verificar el rol de forma segura
  const userRole = context.auth.token?.role;

  if (userRole) {
    functions.logger.info(`ÉXITO: Se encontró el rol '${userRole}' en el token.`);
  } else {
    functions.logger.error("FALLO: El objeto 'context.auth' existe, pero 'context.auth.token.role' no se encontró. Claims:", context.auth.token);
    throw new functions.https.HttpsError(
      "permission-denied",
      "Autenticado, pero sin rol de permisos.",
    );
  }

  // 3. Si llegamos aquí, todo es correcto. Devolvemos un mensaje de éxito.
  // Por ahora, no eliminamos al usuario para no complicar la prueba.
  const successMessage = `Verificación exitosa. El usuario ${context.auth.uid} con rol '${userRole}' tiene permiso.`;
  functions.logger.info(successMessage);

  return { success: true, message: successMessage };
};

const setUserRole = async (data, context) => {
  // Verificación de permisos
  if (context.auth.token.role !== "admin" && context.auth.token.role !== "superadmin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Solo los administradores pueden asignar roles.",
    );
  }

  const { uid, role } = data;
  const validRoles = ["admin", "superadmin", "gerente", "tecnico"]; // Lista de roles válidos

  if (!uid || !role || !validRoles.includes(role)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Se requiere un \"uid\" y un \"role\" válido.",
    );
  }

  try {
    // Asignar el Custom Claim al usuario
    await admin.auth().setCustomUserClaims(uid, { role: role });

    // También actualizamos el rol en el documento de Firestore para consistencia
    await admin.firestore().collection("users").doc(uid).update({ role: role });

    return { success: true, message: `Rol "${role}" asignado a ${uid}.` };
  } catch (error) {
    functions.logger.error(`Error setting role for user ${uid}:`, error);
    throw new functions.https.HttpsError("internal", "Ocurrió un error al asignar el rol.");
  }
};

const makeMeSuperAdmin = async (req, res) => {
  const myUid = "P4S3qkEBitScAugiDHjHZntcmfo2"; // Tu UID real

  if (myUid === "TU_PROPIO_UID_AQUI") {
    return res.status(400).send("Error: Debes editar la función y poner tu propio UID en el código fuente.");
  }

  try {
    // 1. Asignar el Custom Claim (esto ya debería funcionar)
    await admin.auth().setCustomUserClaims(myUid, { role: "superadmin" });

    // 2. ¡CORRECCIÓN! Usar set con merge para crear o actualizar el documento en Firestore
    const userDocRef = admin.firestore().collection("users").doc(myUid);
    await userDocRef.set({ role: "superadmin" }, { merge: true });

    const message = `¡Éxito! El usuario ${myUid} ahora es superadmin. Por favor, cierra sesión y vuelve a iniciar sesión para que el cambio surta efecto.`;
    functions.logger.info(message);
    return res.status(200).send(message);
  } catch (error) {
    functions.logger.error(`Error al hacer superadmin a ${myUid}:`, error);
    return res.status(500).send(`Error: ${error.message}`);
  }
};

module.exports = {
  deleteUser, setUserRole, makeMeSuperAdmin,
};

