// functions/src/testConnection.js

async function testConnectionLogic(req, res, deps) {
  // Desestructura las dependencias que necesitas de 'deps'
  const { db, Timestamp, logger } = deps;

  logger.info("TEST_FS_CONN_START: Iniciando prueba de conexión a Firestore.");
  const testCollectionName = "connection_tests";
  const testDocId = `testDoc_${Date.now()}`;
  const testData = {
    message: "Firestore connection successful!",
    timestamp: Timestamp.now(), // Usar el Timestamp inyectado
    randomNumber: Math.random(),
  };

  try {
    logger.info(`TEST_FS_CONN_WRITE: Escribiendo documento ${testDocId} en ${testCollectionName}`);
    await db.collection(testCollectionName).doc(testDocId).set(testData); // Usar la db inyectada
    logger.info("TEST_FS_CONN_WRITE_SUCCESS: Documento escrito exitosamente.");

    logger.info(`TEST_FS_CONN_READ: Leyendo documento ${testDocId} de ${testCollectionName}`);
    const docSnapshot = await db.collection(testCollectionName).doc(testDocId).get();

    if (docSnapshot.exists) {
      logger.info("TEST_FS_CONN_READ_SUCCESS: Documento leído exitosamente.", { data: docSnapshot.data() });
      // IMPORTANTE: Devolver la promesa de res.send() o res.status().send()
      // para que la función HTTP termine correctamente.
      return res.status(200).send({
        status: "SUCCESS",
        message: "Firestore connection test successful!",
        writtenData: testData,
        readData: docSnapshot.data(),
      });
    } else {
      logger.error("TEST_FS_CONN_READ_FAIL: El documento escrito no fue encontrado al leerlo.");
      return res.status(500).send({
        status: "ERROR",
        message: "Failed to read the test document after writing.",
      });
    }
  } catch (error) {
    logger.error("TEST_FS_CONN_ERROR: Error durante la prueba de conexión a Firestore:", error);
    // Asegurarse de que se envíe una respuesta incluso si el error ocurre antes de que res se use.
    if (res && !res.headersSent) {
      return res.status(500).send({
        status: "ERROR",
        message: "An error occurred during the Firestore connection test.",
        error: error.message,
      });
    } else if (!res) {
      logger.error("TEST_FS_CONN_ERROR: Objeto res no disponible para enviar error.");
      // Si res no está, no podemos hacer mucho más que loguear
      // Esto no debería ocurrir en una función HTTP normal.
    }
  }
  // Este log se ejecutará después de que la respuesta haya sido enviada (si todo va bien)
  // o si hay un error y no se envió respuesta en el catch.
  logger.info("TEST_FS_CONN_END: Fin de la prueba de conexión a Firestore.");
}

// Exporta la función lógica para que index.js la pueda usar
module.exports = { testConnection: testConnectionLogic };
