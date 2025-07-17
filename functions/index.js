// functions/index.js
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const functions = require("firebase-functions");
const { setGlobalOptions } = require("firebase-functions/v2");
const { onCall } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");

const { Timestamp } = require("firebase-admin/firestore");

// Importar el módulo de gestión de usuarios
// const userManagement = require("./users/manageUsers");

admin.initializeApp();

const db = admin.firestore();

const APP_EXECUTION_TIME_ZONE = "America/Mexico_City";
const REPORT_DATA_TIME_ZONE = "America/Mexico_City";

setGlobalOptions({
  region: "us-west4",
  memory: "1GiB",
  timeoutSeconds: 540,
});

const enviarAsistenciasModule = require("./mails/enviarAsistencias");
const pdfGeneratorModule = require("./mails/generarPdfKit");

const servicioDeps = { db, Timestamp, logger, generarPdfConPdfKit: pdfGeneratorModule.generarPdfConPdfKit,
  TIME_ZONE: REPORT_DATA_TIME_ZONE,
};

// --- FUNCIÓN PROGRAMADA: Resumen del 1 al 15 del mes ---
exports.enviarResumenPrimeraQuincena = onSchedule(
  {
    schedule: "0 9 16 * *",
    timeZone: APP_EXECUTION_TIME_ZONE,
  },
  async event => {
    logger.info("SCHED_QUINCENA_1: Iniciando.");
    const ahora = new Date(event.scheduleTime || Date.now());

    const anioActual = ahora.getUTCFullYear();
    const mesActual = ahora.getUTCMonth();

    const startDate = new Date(Date.UTC(anioActual, mesActual, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(anioActual, mesActual, 15, 23, 59, 59, 999));

    try {
      // --- MODIFICADO: Se añade el tipo de quincena ---
      await enviarAsistenciasModule.procesarYEnviarResumenes(startDate, endDate, servicioDeps, "Primera Quincena");
      logger.info("SCHED_QUINCENA_1: Proceso completado.");
    } catch (error) {
      logger.error("SCHED_QUINCENA_1_ERROR:", error);
    }
  });

// --- FUNCIÓN PROGRAMADA: Resumen del 16 al fin de mes ---
exports.enviarResumenSegundaQuincena = onSchedule(
  {
    schedule: "0 9 1 * *",
    timeZone: APP_EXECUTION_TIME_ZONE,
  },
  async event => {
    logger.info("SCHED_QUINCENA_2: Iniciando.");
    const ahora = new Date(event.scheduleTime || Date.now());

    const primerDiaMesActual = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1));
    const ultimoDiaMesAnterior = new Date(primerDiaMesActual.getTime());
    ultimoDiaMesAnterior.setUTCDate(0);

    const anioMesAnterior = ultimoDiaMesAnterior.getUTCFullYear();
    const mesAnterior = ultimoDiaMesAnterior.getUTCMonth();

    const startDate = new Date(Date.UTC(anioMesAnterior, mesAnterior, 16, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(anioMesAnterior, mesAnterior,
      ultimoDiaMesAnterior.getUTCDate(), 23, 59, 59, 999));

    try {
      // --- MODIFICADO: Se añade el tipo de quincena ---
      await enviarAsistenciasModule.procesarYEnviarResumenes(startDate, endDate, servicioDeps, "Segunda Quincena");
      logger.info("SCHED_QUINCENA_2: Proceso completado.");
    } catch (error) {
      logger.error("SCHED_QUINCENA_2_ERROR:", error);
    }
  });

exports.holaMundo = onCall(request => {
  // Log para saber que la función fue llamada
  logger.info("¡Función 'holaMundo' llamada!");

  // Imprimimos cualquier dato que llegue del cliente
  logger.info("Datos recibidos:", request.data);

  // Imprimimos el contexto de autenticación para ver si llega
  logger.info("Contexto de Auth:", request.auth);

  // Retornamos un mensaje de éxito al cliente
  return {
    mensaje: "¡Hola desde la Cloud Function!",
    timestamp: new Date().toISOString(),
  };
});

exports.makeAdminTest = onCall({ region: "us-west4" }, async request => {
  logger.info("--- INICIO de makeAdminTest (v2) ---");

  const uidToPromote = request.data.uid;

  if (!uidToPromote) {
    logger.error("Error: No se proporcionó un UID en la solicitud.");
    throw new Error("Se requiere un 'uid' para promover a superadmin.");
  }

  logger.info(`Intentando promover a superadmin al UID: ${uidToPromote}`);

  try {
    // 1. Asignar el Custom Claim
    await admin.auth().setCustomUserClaims(uidToPromote, { role: "superadmin" });
    logger.info(`Custom Claim { role: 'superadmin' } asignado a ${uidToPromote}.`);

    // 2. Crear o actualizar el documento en Firestore
    const userDocRef = admin.firestore().collection("users").doc(uidToPromote);
    await userDocRef.set({ role: "superadmin" }, { merge: true });
    logger.info(`Documento en Firestore actualizado para ${uidToPromote}.`);

    const message = `Éxito: El usuario ${uidToPromote} ahora es superadmin. Cierra y vuelve a iniciar sesión.`;
    return { success: true, message: message };
  } catch (error) {
    logger.error(`Error al hacer superadmin a ${uidToPromote}:`, error);
    throw new Error(`Error al promover a superadmin: ${error.message}`);
  }
});

// --- GESTIÓN DE USUARIOS --- /////////////////

exports.createUser = onCall({ region: "us-west4" }, async request => {
  logger.info("--- INICIO de createUser (Definitiva) ---");

  // 1. Verificación de permisos del llamador
  const callerRole = request.auth?.token?.role;
  if (callerRole !== "admin" && callerRole !== "superadmin") {
    throw new Error("Permiso denegado. Se requiere rol de administrador para crear usuarios.");
  }

  // 2. Verificación de los datos de entrada
  const { email, password, username, role } = request.data;
  if (!email || !password || !username || !role) {
    throw new Error("Datos incompletos. Se requiere email, password, username y role.");
  }

  logger.info(`PERMISO CONCEDIDO. Admin '${callerRole}' (${request.auth.uid}) creando nuevo usuario con rol '${role}'.`);

  let newUserRecord; // La declaramos aquí para poder usarla en el bloque catch

  try {
    // --- PASO A: Crear el usuario en Firebase Authentication ---
    logger.info(`Paso 1/3: Creando usuario en Auth para ${email}...`);
    newUserRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: username,
    });
    logger.info(`Paso 1/3: ¡Éxito! Usuario ${newUserRecord.uid} creado en Auth.`);

    // --- PASO B: Asignar el Custom Claim para el rol ---
    logger.info(`Paso 2/3: Asignando rol (Claim) '${role}'...`);
    await admin.auth().setCustomUserClaims(newUserRecord.uid, { role: role });
    logger.info("Paso 2/3: ¡Éxito! Rol asignado.");

    // --- PASO C: Crear el documento en Firestore ---
    logger.info("Paso 3/3: Creando documento en Firestore...");
    const userDocRef = admin.firestore().collection("users").doc(newUserRecord.uid);
    await userDocRef.set({
      uid: newUserRecord.uid,
      email: email,
      username: username,
      role: role,
      isBlocked: false,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    logger.info("Paso 3/3: ¡Éxito! Documento creado.");

    const message = `Usuario ${newUserRecord.uid} creado y configurado completamente.`;
    return { success: true, uid: newUserRecord.uid, message: message };
  } catch (error) {
    logger.error(`Error en el proceso de creación para ${email}:`, error);

    // --- LÓGICA DE ROLLBACK ---
    // Si el usuario se creó en Auth pero algo falló después, lo borramos para no dejar datos inconsistentes.
    if (newUserRecord) {
      logger.warn(`Realizando rollback: eliminando al usuario ${newUserRecord.uid} de Auth debido a un error en un paso posterior.`);
      await admin.auth().deleteUser(newUserRecord.uid);
    }

    // Devolvemos un error claro al cliente
    if (error.code === "auth/email-already-exists") {
      throw new Error("El correo electrónico ya está en uso por otro usuario.");
    }
    throw new Error(`Error al crear usuario: ${error.message}`);
  }
});


exports.deleteUserTest = onCall({ region: "us-west4" }, async request => {
  logger.info("--- INICIO de deleteUserTest (v2) ---");

  // 1. Verificación de permisos del llamador
  const callingUserRole = request.auth?.token?.role;
  if (callingUserRole !== "superadmin") {
    logger.error(`FALLO DE PERMISO en deleteUserTest. Rol del llamador: '${callingUserRole}'`);
    throw new Error("Permiso denegado. Solo un superadmin puede eliminar usuarios.");
  }

  // 2. Verificación de los datos de entrada
  const uidToDelete = request.data.uid;
  if (!uidToDelete) {
    logger.error("Error: No se proporcionó un UID para eliminar.");
    throw new Error("Se requiere un 'uid' para eliminar.");
  }

  logger.info(`PERMISO CONCEDIDO. Superadmin ${request.auth.uid} intentando eliminar al UID: ${uidToDelete}`);

  try {
    // 3. Lógica principal: Eliminar el usuario de Authentication
    await admin.auth().deleteUser(uidToDelete);

    const message = `¡Éxito! Usuario ${uidToDelete} eliminado de Firebase Authentication.`;
    logger.info(message);
    return { success: true, message: message };
  } catch (error) {
    logger.error(`Error al eliminar usuario de Auth ${uidToDelete}:`, error);
    throw new Error(`Error al eliminar de Auth: ${error.message}`);
  }
});

exports.deleteUser = onCall({ region: "us-west4" }, async request => {
  logger.info("--- INICIO de deleteUser (Definitiva) ---");

  // 1. Verificación de permisos del llamador
  const callingUserRole = request.auth?.token?.role;
  if (callingUserRole !== "admin" && callingUserRole !== "superadmin") {
    throw new Error("Permiso denegado. Se requiere rol de administrador.");
  }

  // 2. Verificación de los datos de entrada
  const uidToDelete = request.data.uid;
  if (!uidToDelete) {
    throw new Error("Se requiere un 'uid' para eliminar.");
  }

  logger.info(`PERMISO CONCEDIDO. Admin '${callingUserRole}' (${request.auth.uid}) eliminando al usuario: ${uidToDelete}`);

  try {
    // 3. Eliminar de Authentication (Paso Crítico)
    logger.info("Paso 1/2: Intentando eliminar de Authentication...");
    await admin.auth().deleteUser(uidToDelete);
    logger.info("Paso 1/2: ¡Éxito! Usuario eliminado de Authentication.");

    // 4. Eliminar de Firestore
    logger.info("Paso 2/2: Intentando eliminar de Firestore...");
    const userDocRef = admin.firestore().collection("users").doc(uidToDelete);
    await userDocRef.delete();
    logger.info("Paso 2/2: ¡Éxito! Documento eliminado de Firestore.");

    const message = `Usuario ${uidToDelete} eliminado completamente de Auth y Firestore.`;
    return { success: true, message: message };
  } catch (error) {
    logger.error(`Error durante el proceso de eliminación para ${uidToDelete}:`, error);
    // Si el usuario no se encontró en Auth, puede que ya estuviera borrado.
    // Intentamos borrar de Firestore de todas formas para limpiar.
    if (error.code === "auth/user-not-found") {
      logger.warn("El usuario no se encontró en Auth (puede que ya estuviera borrado). Intentando limpiar Firestore...");
      try {
        await admin.firestore().collection("users").doc(uidToDelete).delete();
        return { success: true, message: "Usuario no encontrado en Auth, pero documento de Firestore eliminado." };
      } catch (firestoreError) {
        logger.error("Error al intentar limpiar el documento de Firestore:", firestoreError);
      }
    }
    throw new Error(`Error al eliminar usuario: ${error.message}`);
  }
});


// exports.deleteUser = onCall(userManagement.deleteUser);

// Esta ya estaba bien en v2
// exports.setUserRole = onCall(userManagement.setUserRole);
// exports.makeMeSuperAdmin = onRequest(userManagement.makeMeSuperAdmin);

// --- FUNCIONES DE PRUEBA ---
// const { onRequest } = require("firebase-functions/v2/https");
// const seedDataModule = require("./mails/seedData");
// exports.seedData = onRequest(
//   { timeoutSeconds: 120, memory: "256MiB" },
//   (req, res) => seedDataModule.seedData(req, res, { db, Timestamp, logger }),
// );

// const testPdfModule = require("./mails/testPdfGenerator");
// exports.verPdfDePrueba = onRequest(
//   { timeoutSeconds: 120, memory: "512MiB" },
//   (req, res) => testPdfModule.testPdfLogic(req, res,
//     { db, Timestamp, logger, generarPdfConPdfKit: pdfGeneratorModule.generarPdfConPdfKit,
//       TIME_ZONE: REPORT_DATA_TIME_ZONE },
//   ),
// );

exports.sendPushNotification = functions.https.onCall(async (data, _) => {
  const { fcmToken, title, body } = data;

  if (!fcmToken || !title || !body) {
    throw new functions.https.HttpsError("invalid-argument", "Missing fields");
  }

  const message = {
    token: fcmToken,
    notification: {
      title: title,
      body: body,
    },
  };

  try {
    await admin.messaging().send(message);
    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});
