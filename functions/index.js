// functions/index.js

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

const APP_EXECUTION_TIME_ZONE = "America/Mexico_City"; // Para el schedule de la función
const REPORT_DATA_TIME_ZONE = "America/Mexico_City"; // Para la lógica de fechas del PDF

setGlobalOptions({
  region: "us-west4", // Tu región
  memory: "1GiB",
  timeoutSeconds: 540,
});

// Importar lógica de procesamiento y generación de PDF
const enviarAsistenciasModule = require("./mails/enviarAsistencias");
const pdfGeneratorModule = require("./mails/generarPdfKit");

const servicioDeps = {
  db,
  Timestamp,
  logger,
  generarPdfConPdfKit: pdfGeneratorModule.generarPdfConPdfKit,
  TIME_ZONE: REPORT_DATA_TIME_ZONE,
};

// --- FUNCIÓN PROGRAMADA: Resumen del 1 al 15 del mes (se ejecuta el día 16) ---
exports.enviarResumenPrimeraQuincena = onSchedule(
  {
    schedule: "0 9 16 * *", // Día 16 de cada mes a las 9:00 AM
    timeZone: APP_EXECUTION_TIME_ZONE,
  },
  async event => {
    logger.info("SCHED_QUINCENA_1: Iniciando.");
    const ahora = new Date(event.scheduleTime || Date.now()); // Usar el tiempo del schedule si está disponible

    const anioActual = ahora.getUTCFullYear();
    const mesActual = ahora.getUTCMonth(); // 0-indexado

    const startDate = new Date(Date.UTC(anioActual, mesActual, 1, 0, 0, 0, 0)); // Día 1 del mes actual
    const endDate = new Date(Date.UTC(anioActual, mesActual, 15, 23, 59, 59, 999)); // Día 15 del mes actual

    try {
      await enviarAsistenciasModule.procesarYEnviarResumenes(startDate, endDate, servicioDeps);
      logger.info("SCHED_QUINCENA_1: Proceso completado.");
    } catch (error) {
      logger.error("SCHED_QUINCENA_1_ERROR:", error);
      // throw error;
    }
  });

// --- FUNCIÓN PROGRAMADA: Resumen del 16 al fin de mes (se ejecuta el día 1 del mes siguiente) ---
exports.enviarResumenSegundaQuincena = onSchedule(
  {
    schedule: "0 9 1 * *", // Día 1 de cada mes a las 9:00 AM
    timeZone: APP_EXECUTION_TIME_ZONE,
  },
  async event => {
    logger.info("SCHED_QUINCENA_2: Iniciando.");
    const ahora = new Date(event.scheduleTime || Date.now());

    // Para obtener el mes anterior
    const primerDiaMesActual = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1));
    const ultimoDiaMesAnterior = new Date(primerDiaMesActual.getTime());
    ultimoDiaMesAnterior.setUTCDate(0); // Esto va al último día del mes anterior

    const anioMesAnterior = ultimoDiaMesAnterior.getUTCFullYear();
    const mesAnterior = ultimoDiaMesAnterior.getUTCMonth(); // 0-indexado

    const startDate = new Date(Date.UTC(anioMesAnterior, mesAnterior, 16, 0, 0, 0, 0)); // Día 16 del mes anterior
    const endDate = new Date(Date.UTC(anioMesAnterior, mesAnterior,
      ultimoDiaMesAnterior.getUTCDate(), 23, 59, 59, 999)); // Último día del mes anterior

    try {
      await enviarAsistenciasModule.procesarYEnviarResumenes(startDate, endDate, servicioDeps);
      logger.info("SCHED_QUINCENA_2: Proceso completado.");
    } catch (error) {
      logger.error("SCHED_QUINCENA_2_ERROR:", error);
      // throw error;
    }
  });
