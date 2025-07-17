// functions/mails/enviarAsistencias.js

async function procesarYEnviarResumenes(startDate, endDate, deps, periodoTipo = "Periodo") {
  // --- MODIFICADO: Se añade 'generarPdfSinAsistencias' desde las dependencias ---
  const { db, Timestamp, logger, generarPdfConPdfKit, generarPdfSinAsistencias, TIME_ZONE } = deps;

  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const mesDelReporte = `${meses[startDate.getUTCMonth()]} de ${startDate.getUTCFullYear()}`;

  logger.info(`PROCESAR_RESUMENES: Iniciando para ${periodoTipo} (${startDate.toISOString()} a ${endDate.toISOString()}).`);

  try {
    const periodoInicio = Timestamp.fromDate(startDate);
    const periodoFin = Timestamp.fromDate(endDate);

    // --- PASO 1: Obtener TODOS los empleados con roles relevantes ---
    const rolesRelevantes = ["tecnico", "Técnico", "empleado"];
    const todosLosEmpleadosSnapshot = await db.collection("users")
      .where("role", "in", rolesRelevantes)
      .get();

    const todosLosEmpleados = {};
    todosLosEmpleadosSnapshot.forEach(doc => {
      // Guardamos los datos completos del usuario, la clave es su UID
      todosLosEmpleados[doc.id] = { ...doc.data(), uid: doc.id };
    });
    logger.info(`PROCESAR_RESUMENES: Se encontraron ${Object.keys(todosLosEmpleados).length} empleados con roles relevantes.`);


    // --- PASO 2: Obtener las asistencias del periodo (lógica existente) ---
    const asistenciasSnapshot = await db.collection("time_record")
      .where("startTime", ">=", periodoInicio)
      .where("startTime", "<=", periodoFin)
      .get();

    const asistenciasAgrupadasTemporal = {};
    if (!asistenciasSnapshot.empty) {
      asistenciasSnapshot.forEach(doc => {
        const asistencia = doc.data();
        if (asistencia.userId) {
          if (!asistenciasAgrupadasTemporal[asistencia.userId]) {
            asistenciasAgrupadasTemporal[asistencia.userId] = [];
          }
          asistenciasAgrupadasTemporal[asistencia.userId].push(asistencia);
        }
      });
    }
    const userIdsConAsistencias = new Set(Object.keys(asistenciasAgrupadasTemporal));
    logger.info(`PROCESAR_RESUMENES: ${asistenciasSnapshot.docs.length} asistencias encontradas para ${userIdsConAsistencias.size} usuarios.`);


    // --- PASO 3: Identificar empleados SIN asistencias ---
    const empleadosSinAsistenciasIds = Object.keys(todosLosEmpleados)
      .filter(uid => !userIdsConAsistencias.has(uid));
    logger.info(`PROCESAR_RESUMENES: ${empleadosSinAsistenciasIds.length} empleados relevantes no tienen asistencias.`);


    // --- PASO 4: Procesar usuarios CON asistencias (lógica existente mejorada) ---
    const promesasDeCorreoConAsistencia = [];
    for (const userId of userIdsConAsistencias) {
      // Usamos los datos ya obtenidos en el paso 1 si existen
      const userData = todosLosEmpleados[userId];
      if (!userData || !userData.email) {
        logger.warn(`PROCESAR_RESUMENES_USER_INCOMPLETE: uid=${userId} con asistencias pero sin datos de usuario o email.`);
        continue;
      }

      const asistenciasDelUsuario = asistenciasAgrupadasTemporal[userId];
      // ... (Cálculos de días faltantes y horas trabajadas...
      const diasConAsistencia = new Set(asistenciasDelUsuario.map(a => a.startTime.toDate().getUTCDate()));
      const diasFaltantes = [];
      const fechaActual = new Date(startDate.getTime());
      while (fechaActual <= endDate) {
        if (!diasConAsistencia.has(fechaActual.getUTCDate())) {
          diasFaltantes.push(fechaActual.getUTCDate());
        }
        fechaActual.setUTCDate(fechaActual.getUTCDate() + 1);
      }
      let totalMillis = 0;
      asistenciasDelUsuario.forEach(asistencia => {
        if (asistencia.startTime && asistencia.endTime) {
          totalMillis += asistencia.endTime.toMillis() - asistencia.startTime.toMillis();
        }
      });
      const horas = Math.floor(totalMillis / (1000 * 60 * 60));
      const minutos = Math.floor((totalMillis % (1000 * 60 * 60)) / (1000 * 60));
      const horasTrabajadasStr = `Total de horas trabajadas en el periodo: ${horas} horas y ${minutos} minutos.`;

      const datosParaPdf = {
        userInfo: {
          userId: userId,
          username: userData.username || userData.nombre_completo || "Sin nombre",
          email: userData.email,
        },
        asistencias: asistenciasDelUsuario,
        diasFaltantes,
        horasTrabajadasStr,
      };

      const promesa = (async () => {
        try {
          const pdfBuffer = await generarPdfConPdfKit(datosParaPdf, mesDelReporte, { TIME_ZONE, logger, periodoTipo });
          // ... (Preparación y envío de correo - SIN CAMBIOS) ...
          const nombreArchivo = `Resumen_Asistencias_${datosParaPdf.userInfo.username.replace(/\s+/g, "_")}_${mesDelReporte.replace(/\s+/g, "_")}.pdf`;
          const emailData = {
            to: datosParaPdf.userInfo.email,
            cc: ["daniel@iconmedios.com"],
            bcc: ["edgar.carmona@powerimpulse.com.mx"],
            message: {
              subject: `Resumen de Asistencias - ${mesDelReporte}`,
              html: `<p>Hola ${datosParaPdf.userInfo.username}, se adjunta tu reporte de asistencias.</p>`,
              attachments: [{ filename: nombreArchivo, content: pdfBuffer.toString("base64"), encoding: "base64", contentType: "application/pdf" }],
            },
          };
          await db.collection("mail").add(emailData);
          logger.info(`PROCESAR_RESUMENES_EMAIL_QUEUED (CON ASISTENCIA): Correo para ${datosParaPdf.userInfo.email} encolado.`);
          return { userId, status: "success_with_assists" };
        } catch (error) {
          logger.error(`PROCESAR_RESUMENES_ERROR_USER_EMAIL (CON ASISTENCIA): Para ${userId}:`, error.message);
          return { userId, status: "error", error: error.message };
        }
      })();
      promesasDeCorreoConAsistencia.push(promesa);
    }


    // --- PASO 5: Procesar empleados SIN asistencias ---
    const promesasDeCorreoSinAsistencia = empleadosSinAsistenciasIds.map(async userId => {
      const userInfo = todosLosEmpleados[userId];
      if (!userInfo || !userInfo.email) {
        logger.warn(`PROCESAR_RESUMENES_SKIP_NO_ASSISTS: Empleado ${userId} sin datos o email, no se enviará reporte de 'sin asistencias'.`);
        return { userId, status: "skipped" };
      }
      try {
        const pdfBuffer = await generarPdfSinAsistencias(userInfo, mesDelReporte, { TIME_ZONE, logger, periodoTipo });
        const nombreArchivo = `Reporte_Sin_Asistencias_${(userInfo.username || "Usuario").replace(/\s+/g, "_")}_${mesDelReporte.replace(/\s+/g, "_")}.pdf`;

        const emailData = {
          to: userInfo.email,
          cc: ["daniel@iconmedios.com"],
          bcc: ["edgar.carmona@powerimpulse.com.mx"],
          message: {
            subject: `Reporte de Asistencias (Sin Registros) - ${mesDelReporte}`,
            html: `<p>Hola ${userInfo.username || "colaborador"}, se adjunta tu reporte de asistencias para el periodo. Por favor, revisa que no se encontraron registros.</p>`,
            attachments: [{ filename: nombreArchivo, content: pdfBuffer.toString("base64"), encoding: "base64", contentType: "application/pdf" }],
          },
        };
        await db.collection("mail").add(emailData);
        logger.info(`PROCESAR_RESUMENES_EMAIL_QUEUED (SIN ASISTENCIA): Correo para ${userInfo.email} encolado.`);
        return { userId, status: "success_no_assists" };
      } catch (error) {
        logger.error(`PROCESAR_RESUMENES_ERROR_USER_EMAIL (SIN ASISTENCIA): Para ${userId}:`, error.message);
        return { userId, status: "error", error: error.message };
      }
    });

    // --- PASO 6: Esperar todos los envíos y resumir ---
    const todosLosResultados = await Promise.all([...promesasDeCorreoConAsistencia, ...promesasDeCorreoSinAsistencia]);

    const correosEncoladosExitosamente = todosLosResultados.filter(r => r.status.startsWith("success")).length;
    const totalAProcesar = promesasDeCorreoConAsistencia.length + promesasDeCorreoSinAsistencia.length;

    logger.info(`PROCESAR_RESUMENES_SUMMARY: ${correosEncoladosExitosamente} de ${totalAProcesar} correos encolados en total.`);
    return { status: "SUCCESS", message: `${correosEncoladosExitosamente} correos encolados.`, count: correosEncoladosExitosamente };
  } catch (error) {
    logger.error("PROCESAR_RESUMENES_GLOBAL_ERROR:", error);
    throw error;
  }
}

module.exports = {
  procesarYEnviarResumenes,
};
