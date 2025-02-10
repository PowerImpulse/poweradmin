import * as XLSX from 'xlsx';

export const exportToExcel = <T extends Record<string, any>>(
  headers: string[],
  data: T[],
  fileName: string
) => {
  // Create an array of rows starting with the header row
  const wsData = [
    headers,
    ...data.map((record) =>
      headers.map((key) => {
        let value = record[key];
        if (
          value &&
          typeof value === 'object' &&
          typeof value.toDate === 'function'
        ) {
          value = value.toDate().toISOString();
        }
        return value ?? '';
      })
    )
  ];

  // Generate a worksheet from the array of arrays
  const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(wsData);

  // Create a new workbook and append the worksheet
  const workbook: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  // Write the workbook to a file and trigger a download
  XLSX.writeFile(workbook, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
};