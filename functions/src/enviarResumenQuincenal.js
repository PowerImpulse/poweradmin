// functions/src/enviarResumenQuincenal.js

async function enviarResumenQuincenalPruebaLogic(req, res, deps) {
  const { db, Timestamp, logger, generarPdfConPdfKit, TIME_ZONE } = deps;

  logger.info("PASO_6_START: Iniciando proceso completo (con consulta a 'users').");

  try {
    // 1. Configurar periodo (ej. Mayo 2025 para coincidir con datos de seed si aún los usas para probar,

    const targetYear = 2025; // 2025 O const ahora = new Date(); const targetYear = ahora.getUTCFullYear();;
    const targetMonth = 4; // mes espexifco O const targetMonth = ahora.getUTCMonth();

    const inicioMesForzadoUTC = new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0, 0));
    const finQuincenaForzadaUTC = new Date(Date.UTC(targetYear, targetMonth, 15, 23, 59, 59, 999));
    const periodoInicio = Timestamp.fromDate(inicioMesForzadoUTC);
    const periodoFin = Timestamp.fromDate(finQuincenaForzadaUTC);
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    const mesDelReporte = `${meses[targetMonth]} de ${targetYear}`;
    logger.info(`PASO_6_PERIODO: Procesando para ${mesDelReporte}`);

    // 2. Consultar asistencias
    const asistenciasSnapshot = await db.collection("time_record")
      .where("startTime", ">=", periodoInicio)
      .where("startTime", "<=", periodoFin)
      .get();

    if (asistenciasSnapshot.empty) {
      logger.info("PASO_6_NO_ASSIST: No se encontraron asistencias en el periodo.");
      return res.status(200).send("No se encontraron asistencias para procesar en el periodo: " + mesDelReporte);
    }
    logger.info(`PASO_6_ASSIST_FOUND: ${asistenciasSnapshot.docs.length} asistencias encontradas.`);

    // 3. Agrupar asistencias por userId (solo las asistencias, sin info de usuario aún)
    const asistenciasAgrupadasTemporal = {};
    asistenciasSnapshot.forEach(doc => {
      const asistencia = doc.data();
      asistencia.id = doc.id; // ID del documento de Firestore
      if (!asistencia.userId) {
        logger.warn("PASO_6_NO_USERID_IN_ASSIST: Asistencia omitida por falta de userId.", { asistenciaId: doc.id });
        return;
      }
      if (!asistenciasAgrupadasTemporal[asistencia.userId]) {
        asistenciasAgrupadasTemporal[asistencia.userId] = [];
      }
      asistenciasAgrupadasTemporal[asistencia.userId].push(asistencia);
    });

    const userIdsConAsistencias = Object.keys(asistenciasAgrupadasTemporal);
    if (userIdsConAsistencias.length === 0) {
      logger.info("PASO_6_NO_VALID_ASSISTS_AFTER_GROUPING: No hay asistencias válidas con userId.");
      return res.status(200).send("Asistencias encontradas, pero sin userId válidos.");
    }
    logger.info(`PASO_6_USERS_WITH_ASSISTS: ${userIdsConAsistencias.length} usuarios tienen asistencias.`);

    // 3.5. Obtener información de usuario (username, email) de la colección 'users'
    //    y construir el objeto final 'asistenciasPorUsuario'
    const asistenciasPorUsuario = {};
    for (const userIdFromTimeRecord of userIdsConAsistencias) { // userIdFromTimeRecord es el que viene de time_record
      try {
        // Buscar en la colección 'users' donde el CAMPO 'uid' sea igual a userIdFromTimeRecord
        logger.info(`PASO_6_FETCHING_USER_INFO: Buscando usuario en 'users' con campo uid == ${userIdFromTimeRecord}`);
        const usersQuerySnapshot = await db.collection("users")
          .where("uid", "==", userIdFromTimeRecord)
          .limit(1) // Debería haber solo uno, pero limitamos por si acaso
          .get();

        if (!usersQuerySnapshot.empty) {
          const userDoc = usersQuerySnapshot.docs[0]; // Tomar el primer (y único esperado) documento
          const userData = userDoc.data();

          if (userData.email && userData.username) {
            asistenciasPorUsuario[userIdFromTimeRecord] = { // Usamos userIdFromTimeRecord como clave
              userInfo: {
                userId: userIdFromTimeRecord, // Este es el UID de Auth y el valor del campo 'uid' en 'users'
                username: userData.username,
                email: userData.email,
                // userDocId: userDoc.id // Opcional: el ID del documento en la colección 'users'
              },
              asistencias: asistenciasAgrupadasTemporal[userIdFromTimeRecord],
            };
            logger.info(`PASO_6_USER_INFO_FOUND: Información encontrada para ${userIdFromTimeRecord} (${userData.username}) desde el documento users/${userDoc.id}`);
          } else {
            logger.warn(`PASO_6_USER_INFO_INCOMPLETE: Usuario con campo uid=${userIdFromTimeRecord} (docId: ${userDoc.id}) encontrado en 'users' pero sin email o username. Omitiendo para reporte.`);
          }
        } else {
          logger.warn(`PASO_6_USER_NOT_FOUND_BY_UID_FIELD: Usuario con campo uid=${userIdFromTimeRecord} no encontrado en la colección 'users' mediante consulta. Omitiendo para reporte.`);
        }
      } catch (userError) {
        logger.error(`PASO_6_ERROR_FETCHING_USER: Error obteniendo datos para usuario con uid=${userIdFromTimeRecord}:`, userError);
      }
    }

    const usuariosParaProcesar = Object.keys(asistenciasPorUsuario);
    if (usuariosParaProcesar.length === 0) {
      logger.info("PASO_6_NO_VALID_USERS_FINAL: No hay usuarios con información completa (email, username) para generar reportes.");
      return res.status(200).send("No se encontraron usuarios con datos completos para los reportes.");
    }
    logger.info(`PASO_6_USERS_TO_PROCESS_FINAL: Se prepararán reportes para ${usuariosParaProcesar.length} usuarios: ${usuariosParaProcesar.join(", ")}.`);


    // 4. Iterar sobre cada usuario, generar su PDF y añadir el correo a la cola
    let correosEncoladosExitosamente = 0;
    // (La lógica del bucle .map y await Promise.all sigue igual que en la versión anterior del Paso 6)


    const promesasDeCorreo = usuariosParaProcesar.map(async userId => {
      const datosUsuario = asistenciasPorUsuario[userId]; // Esto ya tiene userInfo de la colección 'users'
      // El resto de la lógica para generar PDF y emailData sigue igual...


      logger.info(`PASO_6_PROCESSING_USER: Iniciando para ${datosUsuario.userInfo.username} (Email: ${datosUsuario.userInfo.email})`);
      try {
        const pdfBuffer = await generarPdfConPdfKit(datosUsuario, mesDelReporte, { TIME_ZONE });
        logger.info(`PASO_6_PDF_GENERATED_FOR_USER: PDF para ${userId} (Tamaño: ${pdfBuffer.length} bytes).`);

        const pdfHeader = pdfBuffer.toString("ascii", 0, 5);
        if (!pdfBuffer || pdfBuffer.length < 100 || !pdfHeader.startsWith("%PDF-")) {
          logger.error(`PASO_6_PDF_INVALID_FOR_USER: PDF generado para ${userId} es inválido o vacío.`);
          throw new Error("PDF generado es inválido.");
        }
        logger.info(`PASO_6_PDF_VALID_FOR_USER: PDF para ${userId} parece válido.`);

        const pdfBase64 = pdfBuffer.toString("base64");
        const nombreArchivo = `Resumen_Asistencias_${datosUsuario.userInfo.username.replace(/\s+/g, "_")}_${mesDelReporte.replace(/\s+/g, "_")}.pdf`;

        // --- AJUSTE PARA PRUEBAS EN PRODUCCIÓN ---
        // Temporalmente, envía todos los correos a dirección de prueba
        const destinatarioEmail = "jean@iconmedios.com";
        const copiaEmail = "danireysan@gmail.com";
        const copiaOcultaEmail = "edgar.carmona@powerimpulse.com.mx";
        const asuntoEmail = `(Resumen Asistencias ${datosUsuario.userInfo.username} - ${mesDelReporte}`;
        // --- FIN AJUSTE ---

        const emailData = {
          to: destinatarioEmail,
          cc: [copiaEmail],
          bcc: [copiaOcultaEmail],
          message: {
            subject: asuntoEmail, // Usar el asunto de prueba
            html: `<p>Hola ${datosUsuario.userInfo.username},</p>
                   <p>Adjunto encontrarás tu resumen de asistencias para el periodo de ${mesDelReporte}.</p>
                   <p>Este es un correo de prueba generado automáticamente.</p>
                   <p>Saludos,<br>Equipo de Administración PowerXperts</p>`,
            text: `Hola ${datosUsuario.userInfo.username},\n\nAdjunto encontrarás tu resumen de asistencias para el periodo de ${mesDelReporte}.\n\nSaludos,\nEquipo de Administración PowerXperts`,
            attachments: [{
              filename: nombreArchivo,
              content: pdfBase64,
              encoding: "base64",
              contentType: "application/pdf",
            }],
          },
        };

        await db.collection("mail").add(emailData);
        logger.info(`PASO_6_EMAIL_QUEUED: Correo para ${datosUsuario.userInfo.email} (enviado a ${destinatarioEmail} para prueba) añadido a la cola 'mail'.`);
        return { userId, status: "success" };
      } catch (error) {
        logger.error(`PASO_6_ERROR_PROCESSING_USER: Error procesando para ${userId} (${datosUsuario.userInfo.username}):`, error.message);
        return { userId, status: "error", error: error.message };
      }
      // --- FIN DE LÓGICA A COPIAR/PEGAR ---
    });

    const resultadosDeCorreos = await Promise.all(promesasDeCorreo);
    resultadosDeCorreos.forEach(resultado => {
      if (resultado.status === "success") correosEncoladosExitosamente++;
    });

    logger.info(`PASO_6_FINAL_SUMMARY: Total de correos encolados exitosamente: ${correosEncoladosExitosamente} de ${usuariosParaProcesar.length} usuarios.`);
    return res.status(200).send(`${correosEncoladosExitosamente} de ${usuariosParaProcesar.length} correos fueron añadidos a la cola de envío. Revisa los logs y tu servicio de correo.`);
  } catch (error) {
    logger.error("PASO_6_ERROR_GLOBAL: Error general en la función:", error);
    if (res && !res.headersSent) {
      return res.status(500).send(`Error interno procesando resúmenes: ${error.message}`);
    }
  }
}

module.exports = { enviarResumenQuincenalPrueba: enviarResumenQuincenalPruebaLogic };
