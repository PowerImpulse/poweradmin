// functions/src/enviarAsistencias.js


async function procesarYEnviarResumenes(startDate, endDate, deps) {
  const { db, Timestamp, logger, generarPdfConPdfKit, TIME_ZONE } = deps;

  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const mesDelReporte = `${meses[startDate.getUTCMonth()]} de ${startDate.getUTCFullYear()}`;

  logger.info(`PROCESAR_RESUMENES: Iniciando para periodo ${startDate.toISOString()} a ${endDate.toISOString()}. Reporte para: ${mesDelReporte}`);

  try {
    const periodoInicio = Timestamp.fromDate(startDate);
    const periodoFin = Timestamp.fromDate(endDate);

    const asistenciasSnapshot = await db.collection("time_record")
      .where("startTime", ">=", periodoInicio)
      .where("startTime", "<=", periodoFin)
      .get();

    if (asistenciasSnapshot.empty) {
      logger.info("PROCESAR_RESUMENES: No se encontraron asistencias en el periodo.");
      return { status: "NO_ASSISTS", message: "No se encontraron asistencias." };
    }
    logger.info(`PROCESAR_RESUMENES: ${asistenciasSnapshot.docs.length} asistencias encontradas.`);

    const asistenciasAgrupadasTemporal = {};
    asistenciasSnapshot.forEach(doc => {
      const asistencia = doc.data();
      asistencia.id = doc.id;
      if (!asistencia.userId) {
        return;
      }
      if (!asistenciasAgrupadasTemporal[asistencia.userId]) {
        asistenciasAgrupadasTemporal[asistencia.userId] = [];
      }
      asistenciasAgrupadasTemporal[asistencia.userId].push(asistencia);
    });

    const userIdsConAsistencias = Object.keys(asistenciasAgrupadasTemporal);
    if (userIdsConAsistencias.length === 0) {
      logger.info("PROCESAR_RESUMENES: No hay asistencias válidas con userId.");
      return { status: "NO_VALID_ASSISTS", message: "Asistencias encontradas, pero sin userId." };
    }

    const asistenciasPorUsuario = {};
    for (const userIdFromTimeRecord of userIdsConAsistencias) {
      try {
        const usersQuerySnapshot = await db.collection("users")
          .where("uid", "==", userIdFromTimeRecord)
          .limit(1).get();
        if (!usersQuerySnapshot.empty) {
          const userDoc = usersQuerySnapshot.docs[0];
          const userData = userDoc.data();
          if (userData.email && (userData.username || userData.nombre_completo)) {
            asistenciasPorUsuario[userIdFromTimeRecord] = {
              userInfo: {
                userId: userIdFromTimeRecord,
                username: userData.username || userData.nombre_completo || "Sin nombre de usuario",
                email: userData.email,
              },
              asistencias: asistenciasAgrupadasTemporal[userIdFromTimeRecord],
            };
          } else {
            logger.warn(`PROCESAR_RESUMENES_USER_INCOMPLETE: uid=${userIdFromTimeRecord} sin email o nombre.`);
          }
        } else {
          logger.warn(`PROCESAR_RESUMENES_USER_NOT_FOUND: uid=${userIdFromTimeRecord} no encontrado en 'users'.`);
        }
      } catch (userError) {
        logger.error(`PROCESAR_RESUMENES_ERROR_FETCHING_USER: uid=${userIdFromTimeRecord}:`, userError);
      }
    }

    const usuariosParaProcesar = Object.keys(asistenciasPorUsuario);
    if (usuariosParaProcesar.length === 0) {
      logger.info("PROCESAR_RESUMENES_NO_FINAL_USERS: No hay usuarios con info completa.");
      return { status: "NO_FINAL_USERS", message: "No hay usuarios con datos completos." };
    }
    logger.info(`PROCESAR_RESUMENES_USERS_TO_EMAIL: ${usuariosParaProcesar.length} usuarios para email.`);

    let correosEncoladosExitosamente = 0;
    const promesasDeCorreo = usuariosParaProcesar.map(async userId => {
      const datosUsuario = asistenciasPorUsuario[userId];
      try {
        const pdfBuffer = await generarPdfConPdfKit(datosUsuario, mesDelReporte, { TIME_ZONE, logger });
        const pdfHeader = pdfBuffer.toString("ascii", 0, 5);
        if (!pdfBuffer || pdfBuffer.length < 100 || !pdfHeader.startsWith("%PDF-")) {
          throw new Error("PDF generado es inválido.");
        }

        const pdfBase64 = pdfBuffer.toString("base64");
        const nombreArchivo = `Resumen_Asistencias_${datosUsuario.userInfo.username.replace(/\s+/g, "_")}_${mesDelReporte.replace(/\s+/g, "_")}.pdf`;
        const copiaEmail = "daniel@iconmedios.com";
        const copiaOcultaEmail = "edgar.carmona@powerimpulse.com.mx";

        const emailData = {
          to: datosUsuario.userInfo.email,
          cc: [copiaEmail],
          bcc: [copiaOcultaEmail],
          message: {
            subject: `Resumen de Asistencias - ${mesDelReporte}`,
            html: `<p>Hola ${datosUsuario.userInfo.username}, ...</p>`, // Cuerpo HTML conciso
            text: `Hola ${datosUsuario.userInfo.username},\n\nAdjunto tu resumen...\n\nSaludos.`, // Cuerpo Texto conciso
            attachments: [{ filename: nombreArchivo, content: pdfBase64, encoding: "base64", contentType: "application/pdf" }],
          },
        };
        await db.collection("mail").add(emailData);
        logger.info(`PROCESAR_RESUMENES_EMAIL_QUEUED: Correo para ${datosUsuario.userInfo.email} añadido.`);
        return { userId, status: "success" };
      } catch (error) {
        logger.error(`PROCESAR_RESUMENES_ERROR_USER_EMAIL: Para ${userId}:`, error.message);
        return { userId, status: "error", error: error.message };
      }
    });

    const resultadosDeCorreos = await Promise.all(promesasDeCorreo);
    resultadosDeCorreos.forEach(resultado => {
      if (resultado.status === "success") correosEncoladosExitosamente++;
    });

    logger.info(`PROCESAR_RESUMENES_SUMMARY: ${correosEncoladosExitosamente} de ${usuariosParaProcesar.length} correos encolados.`);
    return { status: "SUCCESS", message: `${correosEncoladosExitosamente} correos encolados.`, count: correosEncoladosExitosamente };
  } catch (error) {
    logger.error("PROCESAR_RESUMENES_GLOBAL_ERROR:", error);
    throw error;
  }
}

module.exports = {
  procesarYEnviarResumenes,
};
