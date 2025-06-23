const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const logger = require("firebase-functions/logger");

// 🔧 Mapa de empresas según dominio
const empresasMap = [
  {
    domain: "powerimpulse.com.mx",
    logo: "assets/logopi.png",
    color: "#3d5ba9",
    name: "Expertos en energia y climatizacion SA de CV",
  },
  {
    domain: "appcore.mx",
    logo: "assets/logoac.png",
    color: "#AA1F2E",
    name: "Expertos en energia y climatizacion SA de CV",
  },
];

function generarPdfConPdfKit(datosUsuario, mesReporteStr, options = {}) {
  const TIME_ZONE = options.TIME_ZONE || "America/Mexico_City";

  return new Promise((resolve, reject) => {
    // --> MODIFICADO: Extraemos las nuevas propiedades del objeto
    const { userInfo, asistencias, diasFaltantes, reporteMesAnio } = datosUsuario;
    const doc = new PDFDocument({
      size: "Letter",
      margins: { top: 28, bottom: 28, left: 30, right: 30 },
    });

    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // Detectar tema dinámico por dominio del email ////////////

    let logoToUsePath; let colorPrincipal; let empresaNombre;
    const match = empresasMap.find(cfg => userInfo.email?.toLowerCase().includes(cfg.domain));
    if (match) {
      logoToUsePath = path.join(__dirname, "..", match.logo);
      colorPrincipal = match.color;
      empresaNombre = match.name;
    } else {
      logger.warn(`WARN_TEMA: No se pudo determinar tema para: ${userInfo.email}. Usando valores por defecto.`);
      logoToUsePath = path.join(__dirname, "..", "assets/logopi.png");
      colorPrincipal = "#000000";
      empresaNombre = "Reporte General";
    }
    // Mostrar logo (dinámico) //////////////

    const logoX = doc.page.margins.left;
    const logoY = doc.page.margins.top;
    const logoWidth = 100;
    const logoHeight = 50;
    const rightBlockX = logoX + logoWidth + 20;
    const rightBlockWidth = doc.page.width - rightBlockX - doc.page.margins.right;

    try {
      if (fs.existsSync(logoToUsePath)) {
        doc.image(logoToUsePath, logoX, logoY, { width: logoWidth });
      } else {
        logger.warn(`LOGO_WARN: Logo no encontrado en ${logoToUsePath}`);
        doc.fontSize(8).text("[Logo de la Empresa]", logoX, logoY);
      }
    } catch (imgError) {
      logger.error("LOGO_ERROR:", imgError.message);
      doc.fontSize(8).text("[Error al cargar logo]", logoX, logoY);
    }

    // Encabezado /////////////
    doc.fontSize(16).text("Resumen de Asistencias", rightBlockX, logoY, {
      width: rightBlockWidth,
      align: "right",
    });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Colaborador: ${userInfo.username || "N/A"}`, { align: "right", width: rightBlockWidth });
    doc.text(`ID de Usuario: ${userInfo.userId || "N/A"}`, { align: "right", width: rightBlockWidth });
    doc.text(`Email: ${userInfo.email || "N/A"}`, { align: "right", width: rightBlockWidth });

    doc.y = logoY + logoHeight + 30;
    doc.moveDown(1);
    doc.fontSize(12).text(`Periodo: ${mesReporteStr}`, { align: "center" });
    doc.moveDown(1);

    //  Línea decorativa con color personalizado ///////////////
    const lineY = doc.y;
    doc.save();
    doc.lineWidth(5)
      .strokeColor(colorPrincipal)
      .moveTo(doc.page.margins.left, lineY)
      .lineTo(doc.page.width - doc.page.margins.right, lineY)
      .stroke();
    doc.restore();
    doc.moveDown(2);

    const headers = ["Fecha Ini", "Hora Ini", "Descripción", "Ubic. Ini", "Fecha Fin", "Hora Fin", "Ubic. Fin"];
    const headerColWidths = [60, 50, 120, 70, 60, 50, 70];
    const cellPadding = 5;
    const itemSpacing = 15;
    const headerRowSpacing = itemSpacing * 0.75;
    const dataRowSpacing = itemSpacing * 0.5;

    function drawTableHeaders(currentTableTop) {
      let currentX = doc.page.margins.left;
      doc.fontSize(8);
      headers.forEach((header, i) => {
        doc.text(header, currentX, currentTableTop, {
          width: headerColWidths[i],
          align: "left",
        });
        currentX += headerColWidths[i] + cellPadding;
      });
      doc.y = currentTableTop + headerRowSpacing;
    }

    const tableTopStart = doc.y;
    drawTableHeaders(tableTopStart);

    const asistenciasOrdenadas = [...asistencias].sort((a, b) => {
      if (a.startTime && b.startTime) {
        return a.startTime.toMillis() - b.startTime.toMillis();
      }
      return 0;
    });

    asistenciasOrdenadas.forEach(asistencia => {
      // ... (código existente para dibujar cada fila de la tabla, sin cambios)
      const fechaInicioStr = asistencia.startTime ?
        asistencia.startTime.toDate().toLocaleDateString("es-MX", {
          timeZone: TIME_ZONE,
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }) :
        "N/A";

      const horaInicioStr = asistencia.startTime ?
        asistencia.startTime.toDate().toLocaleTimeString("es-MX", {
          timeZone: TIME_ZONE,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }) :
        "N/A";

      const fechaFinStr = asistencia.endTime ?
        asistencia.endTime.toDate().toLocaleDateString("es-MX", {
          timeZone: TIME_ZONE,
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }) :
        "N/A";

      const horaFinStr = asistencia.endTime ?
        asistencia.endTime.toDate().toLocaleTimeString("es-MX", {
          timeZone: TIME_ZONE,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }) :
        "N/A";

      const rowData = [
        fechaInicioStr,
        horaInicioStr,
        asistencia.description || "N/A", // <-- Aquí había un error en tu código original, se invirtió description y startLocation
        asistencia.startLocation || "N/A",
        fechaFinStr,
        horaFinStr,
        asistencia.endLocation || "N/A",
      ];
      // Corregí el orden de los datos para que coincida con las cabeceras
      const correctedRowData = [
        rowData[0], // Fecha Ini
        rowData[1], // Hora Ini
        rowData[2], // Descripción
        rowData[3], // Ubic. Ini
        rowData[4], // Fecha Fin
        rowData[5], // Hora Fin
        rowData[6], // Ubic. Fin
      ];

      let currentX = doc.page.margins.left;
      const currentRowY = doc.y;
      let maxYForRow = currentRowY;

      // Corregí el bucle para usar los datos en el orden correcto
      correctedRowData.forEach((text, i) => {
        doc.text(text, currentX, currentRowY, {
          width: headerColWidths[i],
          align: "left",
        });
        if (doc.y > maxYForRow) maxYForRow = doc.y;
        currentX += headerColWidths[i] + cellPadding;
      });

      doc.y = maxYForRow + dataRowSpacing;

      if (doc.y > doc.page.height - doc.page.margins.bottom - itemSpacing * 4) {
        doc.addPage();
        drawTableHeaders(doc.page.margins.top);
      }
    });

    // --> INICIO DEL NUEVO BLOQUE: DÍAS DE INASISTENCIA
    doc.moveDown(2);
    if (diasFaltantes && diasFaltantes.length > 0) {
      doc.fontSize(9).text(
        `Días con inasistencia registrada en el periodo: ${diasFaltantes.join(", ")} de ${reporteMesAnio}.`, {
          align: "left",
        },
      );
    } else {
      doc.fontSize(9).text(
        "No se registraron inasistencias en este periodo.", {
          align: "left",
        },
      );
    }
    // --> FIN DEL NUEVO BLOQUE

    doc.fontSize(10).moveDown(2);

    // --- Espacio para Firma ---
    const firmaHeight = 65;
    const firmaBlockWidth = 200;
    const espacioSobreFirma = 15;
    const espacioBajoFirma = 30;

    let firmaYPosition = doc.page.height - doc.page.margins.bottom - espacioBajoFirma - firmaHeight;

    // Se ajusta la lógica de paginación para la firma
    const contentAndSignatureHeight = doc.y + espacioSobreFirma + firmaHeight + espacioBajoFirma;
    if (contentAndSignatureHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      // Al agregar página nueva, el contenido empieza arriba, la firma va al final
      firmaYPosition = doc.page.height - doc.page.margins.bottom - espacioBajoFirma - firmaHeight;
    } else {
      // Hay espacio, poner la firma después del contenido actual
      firmaYPosition = doc.y + espacioSobreFirma;
    }


    const firmaX = (doc.page.width - firmaBlockWidth) / 2;

    doc.fontSize(9).text("Firma de conformidad del colaborador:", firmaX, firmaYPosition, { align: "center", width: firmaBlockWidth });
    doc.rect(firmaX, firmaYPosition + 12, firmaBlockWidth, firmaHeight -12).stroke();
    doc.fontSize(8).text("_________________________", firmaX, firmaYPosition + firmaHeight -25, { align: "center", width: firmaBlockWidth });
    doc.fontSize(8).text(`${userInfo.username || "N/A"}`, firmaX, firmaYPosition + firmaHeight -15, { align: "center", width: firmaBlockWidth });


    // Pie de página con nombre de empresa personalizado
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);

      // No añadir el pie de página general si interfiere con la firma
      const spaceForFooter = doc.page.height - doc.page.margins.bottom - 12;
      if (firmaYPosition + firmaHeight < spaceForFooter) {
        doc.fontSize(8).text(
          `Reporte generado el ${new Date().toLocaleDateString("es-MX", { timeZone: TIME_ZONE })}. ${empresaNombre}`,
          doc.page.margins.left,
          doc.page.height - doc.page.margins.bottom - 12,
          {
            align: "center",
            width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
          },
        );
      }
    }


    doc.end();
  });
}

module.exports = { generarPdfConPdfKit };
