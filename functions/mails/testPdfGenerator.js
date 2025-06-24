// functions/mails/testPdfGenerator.js

async function testPdfLogic(req, res, deps) {
  const { db, Timestamp, logger, generarPdfConPdfKit, TIME_ZONE } = deps;

  // --- CONFIGURACIÓN DE LA PRUEBA ---
  // Usuario para el cual queremos generar el PDF de prueba.
  // Alice (user_mayo_A) es ideal porque tiene días faltantes en la quincena.
  const testUserId = "user_mayo_A";
  const testMesDelReporte = "Mayo de 2025";
  const testPeriodoTipo = "Primera Quincena (Prueba)";

  logger.info(`TEST_PDF_LOGIC: Iniciando para userId: ${testUserId}`);

  try {
    // --- 1. Definir el periodo de prueba (Primera quincena de Mayo 2025) ---
    const startDate = new Date(Date.UTC(2025, 4, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(2025, 4, 15, 23, 59, 59, 999));
    const periodoInicio = Timestamp.fromDate(startDate);
    const periodoFin = Timestamp.fromDate(endDate);

    // --- 2. Obtener la información del usuario desde 'users' ---
    const userDoc = await db.collection("users").doc(testUserId).get();
    if (!userDoc.exists) {
      logger.warn(`TEST_PDF_LOGIC: Usuario ${testUserId} no encontrado en la colección 'users'.`);
      return res.status(404).send(`Usuario de prueba ${testUserId} no encontrado. Ejecuta primero la función 'seedData'.`);
    }
    const userInfo = userDoc.data();

    // --- 3. Obtener las asistencias del usuario para el periodo ---
    const asistenciasSnapshot = await db.collection("time_record")
      .where("userId", "==", testUserId)
      .where("startTime", ">=", periodoInicio)
      .where("startTime", "<=", periodoFin)
      .get();

    if (asistenciasSnapshot.empty) {
      logger.warn(`TEST_PDF_LOGIC: No se encontraron asistencias para ${testUserId}.`);
      return res.status(404).send(`No se encontraron asistencias para el usuario de prueba ${testUserId}.`);
    }
    const asistenciasDelUsuario = asistenciasSnapshot.docs.map(doc => doc.data());

    // --- 4. CALCULAR DÍAS FALTANTES (lógica replicada de enviarAsistencias.js) ---
    const diasConAsistencia = new Set(
      asistenciasDelUsuario.map(a => a.startTime.toDate().getUTCDate()),
    );
    const diasFaltantes = [];
    const fechaActual = new Date(startDate.getTime());
    while (fechaActual <= endDate) {
      if (!diasConAsistencia.has(fechaActual.getUTCDate())) {
        diasFaltantes.push(fechaActual.getUTCDate());
      }
      fechaActual.setUTCDate(fechaActual.getUTCDate() + 1);
    }
    logger.info(`TEST_PDF_LOGIC: Días faltantes calculados para ${testUserId}: ${diasFaltantes.join(", ")}`);

    // --- 5. CALCULAR HORAS TRABAJADAS (lógica replicada de enviarAsistencias.js) ---
    let totalMillis = 0;
    asistenciasDelUsuario.forEach(asistencia => {
      if (asistencia.startTime && asistencia.endTime) {
        totalMillis += asistencia.endTime.toMillis() - asistencia.startTime.toMillis();
      }
    });
    const horas = Math.floor(totalMillis / (1000 * 60 * 60));
    const minutos = Math.floor((totalMillis % (1000 * 60 * 60)) / (1000 * 60));
    const horasTrabajadasStr = `Total de horas trabajadas en el periodo: ${horas} horas y ${minutos} minutos.`;
    logger.info(`TEST_PDF_LOGIC: Horas calculadas para ${testUserId}: ${horas}h ${minutos}m`);

    // --- 6. Construir el objeto de datos completo para el generador de PDF ---
    const datosUsuarioParaTest = {
      userInfo: {
        userId: testUserId,
        username: userInfo.username || "N/A",
        email: userInfo.email || "N/A",
      },
      asistencias: asistenciasDelUsuario,
      diasFaltantes: diasFaltantes,
      horasTrabajadasStr: horasTrabajadasStr,
    };

    // --- 7. Generar y enviar el PDF ---
    const pdfBuffer = await generarPdfConPdfKit(datosUsuarioParaTest, testMesDelReporte, {
      TIME_ZONE,
      logger,
      periodoTipo: testPeriodoTipo,
    });

    if (!pdfBuffer || pdfBuffer.length < 100 || !pdfBuffer.toString("ascii", 0, 5).startsWith("%PDF-")) {
      throw new Error("El PDF generado para prueba visual no es un PDF válido.");
    }

    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", `inline; filename="test_visual_pdf_${testUserId}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error("TEST_PDF_LOGIC_ERROR:", error);
    return res.status(500).send(`Error generando PDF de prueba visual: ${error.message}`);
  }
}

module.exports = { testPdfLogic };
