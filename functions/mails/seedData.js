// functions/src/seedData.js

// IMPORTANTE: firebase emulators:start --only functions,firestore. para evitar que los datos se fuarden en producción
async function seedDataLogic(req, res, deps) {
  const { db, Timestamp, logger } = deps;
  logger.info("SEED_TR_START: Iniciando carga de datos de prueba en time_record (CON MÁS ASISTENCIAS)");

  const recordsToSeed = [];
  const baseUserId = "user_mayo_A";
  const baseUsername = "Alice Wonderland";
  const baseEmail = "alice@powerimpulse.com.mx";

  // Loop para Generar  asistencias para en la primera quincena de Mayo 2025
  for (let i = 1; i <= 12; i++) {
    // Variar un poco el día y la hora para que no sean idénticas
    const dia = Math.min(15, i); // Para que no pase del día 15
    const horaInicio = 9 + Math.floor(i/5); // Variar hora de inicio
    const horaFin = horaInicio + 2;

    recordsToSeed.push({
      uid: `asistencia_MAYO_A_${String(i).padStart(2, "0")}`, // ID único para cada asistencia
      userId: baseUserId,
      username: baseUsername,
      email: baseEmail,
      description: `Tarea de prueba número ${i} para Alice`,
      startTime: Timestamp.fromDate(new Date(Date.UTC(2025, 4, dia, horaInicio, 0, 0))), // Mayo, día variable, hora variable
      endTime: Timestamp.fromDate(new Date(Date.UTC(2025, 4, dia, horaFin, 30, 0))),
      startLocation: `Lugar de Inicio ${i}`,
      endLocation: `Lugar de Fin ${i}`,
    });
  }

  // Puedes añadir los otros usuarios si quieres, pero no son necesarios para esta prueba de paginación
  recordsToSeed.push({
    uid: "asistencia_MAY15_usr2_1", // Bob
    userId: "user_mayo_B", username: "Bob The Builder", email: "bob@appcore.mx",
    description: "Instalación de Firewall Cliente Z",
    startTime: Timestamp.fromDate(new Date(Date.UTC(2025, 4, 15, 9, 30, 0))),
    endTime: Timestamp.fromDate(new Date(Date.UTC(2025, 4, 15, 17, 0, 0))),
    startLocation: "Taller", endLocation: "Cliente Z Corp",
  });
  recordsToSeed.push({ // Charlie, fuera de periodo
    uid: "asistencia_MAY22_usr3_1",
    userId: "user_mayo_C", username: "Charlie Brown", email: "charlie@powerimpulse.com.mx",
    description: "Capacitación Interna (Fuera de periodo de prueba)",
    startTime: Timestamp.fromDate(new Date(Date.UTC(2025, 4, 22, 14, 15, 0))),
    endTime: Timestamp.fromDate(new Date(Date.UTC(2025, 4, 22, 16, 30, 0))),
    startLocation: "Sala de Conferencias", endLocation: "Sala de Conferencias",
  });


  const batch = db.batch();
  let count = 0;
  logger.info(`SEED_TR_PROCESSING: Procesando ${recordsToSeed.length} registros para cargar.`);
  recordsToSeed.forEach(record => {
    const docRef = db.collection("time_record").doc(record.uid);
    batch.set(docRef, record);
    count++;
    logger.info(`SEED_TR_ADDED_TO_BATCH: Añadiendo al batch doc con ID '${record.uid}'.`);
  });

  try {
    await batch.commit();
    logger.info(`SEED_TR_SUCCESS: ${count} documentos de prueba creados/actualizados en 'time_record'.`);
    res.status(200).send({
      status: "SUCCESS",
      message: `${count} documentos de prueba creados/actualizados en 'time_record'.`,
    });
  } catch (error) {
    logger.error("SEED_TR_ERROR: Error al escribir datos de prueba:", error);
    res.status(500).send({
      status: "ERROR",
      message: "Error al escribir datos de prueba en 'time_record'.",
      error: error.message,
    });
  }
  logger.info("SEED_TR_END: Fin de la carga de datos de prueba.");
}
module.exports = { seedData: seedDataLogic };
