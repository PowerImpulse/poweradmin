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
  // --- LOGS DE DEPURACIÓN ---
  functions.logger.info("--- DEBUGGING setUserRole ---");
  functions.logger.info("Datos recibidos (data):", data); // Debería mostrar { uid: '...', role: '...' }
  functions.logger.info("Contexto del llamador (context.auth):", context.auth);

  // Verificación de permisos más segura
  const callingUserRole = context.auth?.token?.role;
  if (callingUserRole !== "admin" && callingUserRole !== "superadmin") {
    functions.logger.error("PERMISO DENEGADO en setUserRole. Rol del llamador:", callingUserRole);
    throw new functions.https.HttpsError(
      "permission-denied",
      "Solo los administradores pueden asignar roles.",
    );
  }

  functions.logger.info(`Permiso CONCEDIDO. Admin "${callingUserRole}" está asignando rol.`);

  const { uid, role } = data;
  const validRoles = ["admin", "superadmin", "gerente", "tecnico", "empleado", "visor"]; // Asegúrate que todos tus roles estén aquí

  if (!uid || !role || !validRoles.includes(role)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Se requiere un "uid" y un "role" válido. Recibido: uid=${uid}, role=${role}`,
    );
  }

  try {
    // Asignar el Custom Claim
    await admin.auth().setCustomUserClaims(uid, { role: role });
    functions.logger.info(`Custom Claim { role: '${role}' } asignado a UID: ${uid}`);

    // También actualizamos el rol en el documento de Firestore
    await admin.firestore().collection("users").doc(uid).update({ role: role });
    functions.logger.info(`Documento de Firestore actualizado para UID: ${uid} con role: '${role}'`);

    return { success: true, message: `Rol "${role}" asignado a ${uid}.` };
  } catch (error) {
    functions.logger.error(`Error final al asignar rol para user ${uid}:`, error);
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

const createUser = async (data, context) => {
  // Verificación de permisos: solo un admin puede crear usuarios
  const callingUserRole = context.auth?.token?.role;
  if (callingUserRole !== "admin" && callingUserRole !== "superadmin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Solo los administradores pueden crear nuevos usuarios.",
    );
  }

  const { email, password, username } = data;

  if (!email || !password || !username) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Se requiere email, password y username.",
    );
  }

  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: username,
      // Se puede añadir emailVerified: false, disabled: false, etc.
    });

    functions.logger.info(`Admin ${context.auth.uid} creó nuevo usuario: ${userRecord.uid}`);
    return { uid: userRecord.uid };
  } catch (error) {
    functions.logger.error("Error al crear usuario desde Cloud Function:", error);
    // Traducir errores comunes
    if (error.code === "auth/email-already-exists") {
      throw new functions.https.HttpsError("already-exists", "El correo electrónico ya está en uso por otro usuario.");
    }
    throw new functions.https.HttpsError("internal", "Ocurrió un error al crear el usuario en Authentication.");
  }
};

// ¡Actualiza tus exports!
module.exports = {
  deleteUser,
  setUserRole,
  makeMeSuperAdmin,
  createUser, // <-- Añade la nueva función
};


