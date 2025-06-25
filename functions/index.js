// functions/index.js

const { onSchedule } = require("firebase-functions/v2/scheduler");

const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

// Importar el módulo de gestión de usuarios
const { onCall, onRequest } = require("firebase-functions/v2/https");
const userManagement = require("./users/manageUsers");

if (admin.apps.length === 0) {
  admin.initializeApp();
}
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

const servicioDeps = {
  db,
  Timestamp,
  logger,
  generarPdfConPdfKit: pdfGeneratorModule.generarPdfConPdfKit,
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

// --- FUNCIÓN PARA GESTIÓN DE USUARIOS ---
exports.deleteUser = onCall(userManagement.deleteUser);
exports.setUserRole = onCall(userManagement.setUserRole);
exports.makeMeSuperAdmin = onRequest(userManagement.makeMeSuperAdmin);


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
