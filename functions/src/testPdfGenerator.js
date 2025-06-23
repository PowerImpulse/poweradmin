// functions/src/testPdfGenerator.js
async function testPdfLogic(req, res, deps) {
  const { db, Timestamp, logger, generarPdfConPdfKit, TIME_ZONE } = deps; // generarPdfConPdfKit viene de index.js

  // Usa un userId que sabes que será creado por seedTimeRecordData
  const testUserId = "user_mayo_A"; // Por ejemplo, Alice Wonderland
  const testMesDelReporte = "Mayo de 2025 (Prueba Visual)";

  logger.info(`TEST_PDF_LOGIC: Iniciando para userId: ${testUserId}`);

  try {
    // 1. Obtener las asistencias para este usuario de prueba (similar a enviarResumenQuincenal)
    //    Necesitamos el periodo correcto para el que seedTimeRecordData crea datos
    const targetYear = 2025;
    const targetMonth = 4; // Mayo
    const inicioPeriodo = Timestamp.fromDate(new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0, 0)));
    const finPeriodo = Timestamp.fromDate(new Date(Date.UTC(targetYear, targetMonth, 15, 23, 59, 59, 999)));

    const asistenciasSnapshot = await db.collection("time_record")
      .where("userId", "==", testUserId) // Filtrar por el userId de prueba
      .where("startTime", ">=", inicioPeriodo)
      .where("startTime", "<=", finPeriodo)
      .get();

    if (asistenciasSnapshot.empty) {
      logger.warn(`TEST_PDF_LOGIC: No se encontraron asistencias para ${testUserId} en el periodo.`);
      return res.status(404).send(`No se encontraron asistencias para el usuario de prueba ${testUserId} en Mayo 2025.`);
    }

    // 2. Obtener la información del usuario de la colección 'users'
    //    (Asumiendo que seedTimeRecordData NO crea usuarios, necesitaríamos que existan
    //     o hardcodear la info para esta prueba visual)
    //    Para simplificar esta función de prueba visual, vamos a hardcodear userInfo
    //    Si quieres probar la consulta a 'users', puedes copiar esa lógica aquí.
    let userInfoParaPdf;
    if (testUserId === "user_mayo_A") {
      userInfoParaPdf = { userId: testUserId, username: "Alice Wonderland (Prueba)", email: "alice.test@example.com" };
    } else if (testUserId === "user_mayo_B") {
      userInfoParaPdf = { userId: testUserId, username: "Bob The Builder (Prueba)", email: "bob.test@example.com" };
    } else {
      userInfoParaPdf = { userId: testUserId, username: "Usuario Desconocido (Prueba)", email: "unknown@example.com" };
    }

    const asistenciasDelUsuario = asistenciasSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

    const datosUsuarioParaTest = {
      userInfo: userInfoParaPdf,
      asistencias: asistenciasDelUsuario,
    };

    logger.info(`TEST_PDF_LOGIC: Datos preparados para ${datosUsuarioParaTest.userInfo.username}. Asistencias: ${datosUsuarioParaTest.asistencias.length}`);

    const pdfBuffer = await generarPdfConPdfKit(datosUsuarioParaTest, testMesDelReporte, { TIME_ZONE });

    const pdfHeader = pdfBuffer.toString("ascii", 0, 5);
    if (!pdfBuffer || pdfBuffer.length < 100 || !pdfHeader.startsWith("%PDF-")) {
      logger.error(`TEST_PDF_LOGIC_INVALID_HEADER: Encabezado PDF incorrecto: [${pdfHeader}]`);
      throw new Error("El PDF generado para prueba visual no es un PDF válido (encabezado incorrecto)");
    }
    logger.info(`TEST_PDF_LOGIC_VALID_HEADER: Encabezado PDF para prueba visual correcto: [${pdfHeader}]`);

    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", `inline; filename="test_visual_pdf_${testUserId}.pdf"`);
    res.set("Content-Length", pdfBuffer.length);
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    logger.error("TEST_PDF_LOGIC_ERROR:", error);
    return res.status(500).send(`Error generando PDF de prueba visual: ${error.message}`);
  }
}
module.exports = { testPdfLogic };
