export const exportToCSV = <T extends Record<string, any>>(
  headers: string[],
  obj: T[],
  fileName: string
) => {
  let csvContent = "data:text/csv;charset=utf-8,";

  // Encabezado del CSV
  const header = headers.join(";");
  csvContent += header + "\n";

  // Filas de datos
  const rows = obj
    .map((row) => {
      const rowData = headers.map((key) => {
        const value = row[key];

        if (
          value &&
          typeof value === "object" &&
          typeof value.toDate === "function"
        ) {
          return value.toDate().toISOString();
        }

        return value ?? "";
      });

      return rowData.join(";");
    })
    .join("\n");

  csvContent += rows;

  // Crear y descargar el archivo CSV
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
