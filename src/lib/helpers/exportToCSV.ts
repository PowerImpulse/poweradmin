export const exportToCSV = <T extends Record<string, any>>(
  headers: string[],
  obj: T[],
  fileName: string
) => {
  let csvContent = "\uFEFF";

  const header = headers.join(";");
  csvContent += header + "\n";

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

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", "asistencia.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
