// functions/src/seedData.js

// IMPORTANTE: firebase emulators:start --only functions,firestore. para evitar que los datos se guarden en producción
async function seedDataLogic(req, res, deps) {
  const { db, Timestamp, logger } = deps;
  logger.info("SEED_DATA_START: Iniciando carga de datos de prueba.");

  // --- Datos de Usuarios para la colección 'users' ---
  const usersToSeed = [
    { uid: "user_mayo_A", username: "Alice Wonderland", email: "alice@powerimpulse.com.mx", nombre_completo: "Alice Wonderland" },
    { uid: "user_mayo_B", username: "Bob The Builder", email: "bob@appcore.mx", nombre_completo: "Bob The Builder" },
    { uid: "user_mayo_C", username: "Charlie Brown", email: "charlie@powerimpulse.com.mx", nombre_completo: "Charlie Brown" },
  ];

  // --- Datos de Asistencias para la colección 'time_record' ---
  const recordsToSeed = [];
  const baseUserA = usersToSeed[0]; // Alice

  // Generar 12 asistencias para Alice en la primera quincena de Mayo 2025
  // Saltaremos el día 4 y 8 para probar la detección de días faltantes.
  for (let i = 1; i <= 32; i++) {
    const dia = (i < 4) ? i : (i < 8) ? i + 1 : i + 2;
    if (dia > 15) continue;

    recordsToSeed.push({
      uid: `asistencia_MAYO_A_${String(i).padStart(2, "0")}`,
      userId: baseUserA.uid,
      username: baseUserA.username,
      email: baseUserA.email,
      description: `Tarea de prueba número ${i} para Alice`,
      startTime: Timestamp.fromDate(new Date(Date.UTC(2025, 4, dia, 9, 0, 0))),
      endTime: Timestamp.fromDate(new Date(Date.UTC(2025, 4, dia, 18, 30, 0))),
      startLocation: `Lugar de Inicio ${i}`,
      endLocation: `Lugar de Fin ${i}`,
    });
  }

  const baseUserB = usersToSeed[1];
  recordsToSeed.push({
    uid: "asistencia_MAY15_usr2_1",
    userId: baseUserB.uid, username: baseUserB.username, email: baseUserB.email,
    description: "Instalación de Firewall Cliente Z",
    startTime: Timestamp.fromDate(new Date(Date.UTC(2025, 4, 15, 9, 30, 0))),
    endTime: Timestamp.fromDate(new Date(Date.UTC(2025, 4, 15, 17, 0, 0))),
    startLocation: "Taller", endLocation: "Cliente Z Corp",
  });

  const baseUserC = usersToSeed[2];
  recordsToSeed.push({
    uid: "asistencia_MAY22_usr3_1",
    userId: baseUserC.uid, username: baseUserC.username, email: baseUserC.email,
    description: "Capacitación Interna (Fuera de periodo)",
    startTime: Timestamp.fromDate(new Date(Date.UTC(2025, 4, 22, 14, 15, 0))),
    endTime: Timestamp.fromDate(new Date(Date.UTC(2025, 4, 22, 16, 30, 0))),
    startLocation: "Sala de Conferencias", endLocation: "Sala de Conferencias",
  });

  const batch = db.batch();
  usersToSeed.forEach(user => {
    const docRef = db.collection("users").doc(user.uid);
    batch.set(docRef, user);
  });
  recordsToSeed.forEach(record => {
    const docRef = db.collection("time_record").doc(record.uid);
    batch.set(docRef, record);
  });

  try {
    await batch.commit();
    const message = `${usersToSeed.length} usuarios y ${recordsToSeed.length} asistencias creados/actualizados.`;
    logger.info(`SEED_DATA_SUCCESS: ${message}`);
    res.status(200).send({ status: "SUCCESS", message });
  } catch (error) {
    logger.error("SEED_DATA_ERROR: Error al escribir datos de prueba:", error);
    res.status(500).send({ status: "ERROR", message: "Error al escribir datos de prueba.", error: error.message });
  }
}

module.exports = { seedData: seedDataLogic };
