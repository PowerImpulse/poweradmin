// functions/users/manageUsers.js

const admin = require("firebase-admin");

const { logger } = require("firebase-functions/v2");
const { HttpsError } = require("firebase-functions/v2/https");


const deleteUser = async (data, context) => {
  // Verificar autenticación y privilegios
  if (!context.auth?.token.superadmin) {
    throw new HttpsError(
      "permission-denied",
      "Se requieren privilegios de superadmin",
    );
  }

  // Obtener documentId del usuario a eliminar
  const userDocId = data.userDocId;
  if (!userDocId) {
    throw new HttpsError(
      "invalid-argument",
      "Se requiere el ID del documento de usuario",
    );
  }

  try {
    // Obtener el documento para extraer el UID de autenticación
    const userDoc = await admin.firestore().collection("users").doc(userDocId).get();

    if (!userDoc.exists) {
      throw new HttpsError(
        "not-found",
        "Usuario no encontrado en Firestore",
      );
    }

    const authUid = userDoc.data()?.uid;
    if (!authUid) {
      throw new HttpsError(
        "invalid-argument",
        "El documento de usuario no contiene un UID válido",
      );
    }

    // Eliminar de Authentication
    await admin.auth().deleteUser(authUid);

    // Eliminar el documento de Firestore
    await userDoc.ref.delete();

    return {
      success: true,
      message: "Usuario eliminado correctamente de Auth y Firestore",
      deletedAuthUid: authUid,
      deletedFirestoreDoc: userDocId,
    };
  } catch (error) {
    throw new HttpsError(
      "internal",
      "Error al eliminar usuario",
      error instanceof Error ? error.message : String(error),
    );
  }
};

const setUserRole = async (data, context) => {
  // --- LOGS DE DEPURACIÓN ---
  logger.info("--- DEBUGGING setUserRole ---");
  logger.info("Datos recibidos (data):", data); // Debería mostrar { uid: '...', role: '...' }
  logger.info("Context del llamador (context.auth):", context.auth);

  // Verificación de permisos más segura
  const callingUserRole = context.auth?.token?.role;
  if (callingUserRole !== "admin" && callingUserRole !== "superadmin") {
    logger.error("PERMISO DENEGADO en setUserRole. Rol del llamador:", callingUserRole);
    throw new HttpsError(
      "permission-denied",
      "Solo los administradores pueden asignar roles.",
    );
  }

  logger.info(`Permiso CONCEDIDO. Admin "${callingUserRole}" está asignando rol.`);

  const { uid, role } = data;
  const validRoles = ["admin", "superadmin", "gerente", "tecnico", "empleado", "visor"]; // Asegúrate que todos tus roles estén aquí

  if (!uid || !role || !validRoles.includes(role)) {
    throw new HttpsError(
      "invalid-argument",
      `Se requiere un "uid" y un "role" válido. Recibido: uid=${uid}, role=${role}`,
    );
  }

  try {
    // Asignar el Custom Claim
    await admin.auth().setCustomUserClaims(uid, { role: role });
    logger.info(`Custom Claim { role: '${role}' } asignado a UID: ${uid}`);

    // También actualizamos el rol en el documento de Firestore
    await admin.firestore().collection("users").doc(uid).update({ role: role });
    logger.info(`Documento de Firestore actualizado para UID: ${uid} con role: '${role}'`);

    return { success: true, message: `Rol "${role}" asignado a ${uid}.` };
  } catch (error) {
    logger.error(`Error final al asignar rol para user ${uid}:`, error);
    throw new HttpsError("internal", "Ocurrió un error al asignar el rol.");
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
    logger.info(message);
    return res.status(200).send(message);
  } catch (error) {
    logger.error(`Error al hacer superadmin a ${myUid}:`, error);
    return res.status(500).send(`Error: ${error.message}`);
  }
};


const createUser = async (data, context) => {
  logger.info("--- INICIO DE createUser (VERSIÓN CON ROLES) ---");
  logger.info("Datos recibidos:", data);
  logger.info("Tipo de context.auth:", typeof context.auth);
  logger.info("Valor de context.auth (directo):", context.auth);
  logger.info("Valor de context (completo):", context);
  try {
    logger.info("Valor de context (JSON stringify):", JSON.stringify(context, null, 2));
  } catch (e) {
    logger.error("Error al stringify context:", e);
  }

  if (context.auth) {
    logger.info("Context.auth está POPULADO.");
    logger.info("UID del llamador según context.auth:", context.auth.uid);
    logger.info("Claims del llamador según context.auth:", context.auth.token);
  } else {
    logger.error("Context.auth está VACÍO (null/undefined). Esto es inesperado si la verificación pasó.");
  }

  if (!context.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Debes estar autenticado para crear usuarios.",
    );
  }

  // Si solo quieres que los admins existentes puedan crear nuevos superadmins:
  const callerUid = context.auth.uid;
  const callerUserRecord = await admin.auth().getUser(callerUid);
  const callerCustomClaims = callerUserRecord.customClaims;

  if (!callerCustomClaims || callerCustomClaims.role !== "superadmin") {
    throw new HttpsError(
      "permission-denied",
      "Solo un superadmin puede crear nuevos usuarios con roles elevados.",
    );
  }
  // Fin del PASO 1

  try {
    const { email, password, username, role } = data; // Asegúrate de que `role` se envíe desde SvelteKit
    if (!email || !password || !username || !role) {
      throw new Error("Faltan datos (email, password, username, o role).");
    }

    // Crea el usuario
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: username,
    });


    await admin.auth().setCustomUserClaims(userRecord.uid, { role: role });


    logger.info(`¡ÉXITO en createUser! UID: ${userRecord.uid}, Rol: ${role}`);
    return { success: true, uid: userRecord.uid, role: role };
  } catch (error) {
    logger.error("ERROR en createUser:", error);
    // Para errores específicos de Firebase Auth, puedes mapearlos a HttpsError
    if (error.code === "auth/email-already-in-use") {
      throw new HttpsError("already-exists", "El email ya está en uso.");
    } else if (error.code === "auth/invalid-password") {
      throw new HttpsError("invalid-argument", "La contraseña es demasiado débil.");
    }
    // Para otros errores, un error interno genérico
    throw new HttpsError("internal", error.message);
  }
};


// ¡Actualiza tus exports!
module.exports = {
  deleteUser,
  setUserRole,
  makeMeSuperAdmin,
  createUser, // <-- Añade la nueva función
};


