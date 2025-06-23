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
    const { userInfo, asistencias } = datosUsuario;
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
        asistencia.startLocation || "N/A",
        fechaFinStr,
        horaFinStr,
        asistencia.description || "N/A",
        asistencia.endLocation || "N/A",
      ];

      let currentX = doc.page.margins.left;
      const currentRowY = doc.y;
      let maxYForRow = currentRowY;

      rowData.forEach((text, i) => {
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

    doc.fontSize(10).moveDown(2);

    // --- Espacio para Firma ---
    const firmaHeight = 65; // Altura del rectángulo de la firma
    const firmaBlockWidth = 200; // Ancho del bloque de firma
    const espacioSobreFirma = 15; // Espacio antes de la etiqueta "Firma del Técnico"
    const espacioBajoFirma = 30; // Espacio que queremos dejar para el pie de página general

    // Calcular Y para la firma, asegurando espacio para el footer general
    let firmaYPosition = doc.page.height - doc.page.margins.bottom - espacioBajoFirma - firmaHeight;


    if (doc.y + espacioSobreFirma + firmaHeight > firmaYPosition ) {
      // Si el contenido actual está muy abajo, y no hay espacio suficiente para la firma Y el footer en esta página
      if (doc.y + espacioSobreFirma + firmaHeight + espacioBajoFirma > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();

        firmaYPosition = doc.page.height - doc.page.margins.bottom - espacioBajoFirma - firmaHeight;
      } else {
        // Hay espacio, poner la firma después del contenido actual, pero respetando el espacio del footer
        firmaYPosition = doc.y + espacioSobreFirma;
      }
    }

    // Calcular X para centrar el bloque de firma
    const firmaX = (doc.page.width - firmaBlockWidth) / 2;

    doc.fontSize(9).text("Firma de conformidad del colaborador:", firmaX, firmaYPosition, { align: "center", width: firmaBlockWidth });
    doc.rect(firmaX, firmaYPosition + 12, firmaBlockWidth, firmaHeight -12).stroke(); // Rectángulo debajo de la etiqueta
    doc.fontSize(8).text("_________________________", firmaX, firmaYPosition + firmaHeight -25, { align: "center", width: firmaBlockWidth });
    doc.fontSize(8).text(`${userInfo.username || "N/A"}`, firmaX, firmaYPosition + firmaHeight -15, { align: "center", width: firmaBlockWidth });


    // Pie de página con nombre de empresa personalizado
    const finalPageNumber = doc.bufferedPageRange().count > 0 ?
      doc.bufferedPageRange().start + doc.bufferedPageRange().count - 1 :
      0;
    doc.switchToPage(finalPageNumber);
    doc.fontSize(8).text(
      `Reporte generado el ${new Date().toLocaleDateString("es-MX", { timeZone: TIME_ZONE })}. ${empresaNombre}`,
      doc.page.margins.left,
      doc.page.height - doc.page.margins.bottom - 12,
      {
        align: "center",
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      },
    );


    doc.end();
  });
}

module.exports = { generarPdfConPdfKit };
