import ExcelJS from 'exceljs';
import * as db from '../database/index.js';
import log from 'electron-log/main';

export async function exportWeekToExcel(semanaId, filePath) {
  log.info(`Exporting week ${semanaId} to Excel: ${filePath}`);

  // Get semana data
  const semanas = db.getSemanas(true);
  const semana = semanas.find(s => s.id === semanaId);
  if (!semana) {
    throw new Error('Semana no encontrada');
  }

  // Get all salidas for the week
  const salidas = db.getSalidasBySemana(semanaId);

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Gestion Gasolina';
  workbook.created = new Date();

  // Create worksheet
  const worksheet = workbook.addWorksheet('Semana');

  // Set column widths
  worksheet.columns = [
    { header: 'Destino', key: 'destino', width: 30 },
    { header: 'Chofer', key: 'chofer', width: 20 },
    { header: 'Vehículo', key: 'vehiculo', width: 15 },
    { header: 'Fecha', key: 'fecha', width: 12 },
    { header: 'Km', key: 'km', width: 10 },
    { header: 'Ida y Regreso', key: 'idaRegreso', width: 15 },
    { header: 'Costo', key: 'costo', width: 12 }
  ];

  // Header style
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  headerRow.alignment = { horizontal: 'center' };

  // Add title row
  const titleRow = worksheet.insertRow(1, ['PROGRAMACIÓN SEMANAL']);
  titleRow.font = { bold: true, size: 14 };
  worksheet.mergeCells('A1:G1');

  // Add headers in row 2
  worksheet.getRow(2).values = [
    'Destino',
    'Chofer',
    'Vehículo',
    'Fecha',
    'Km',
    'Ida y Regreso',
    'Costo'
  ];
  worksheet.getRow(2).font = { bold: true };
  worksheet.getRow(2).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD3D3D3' }
  };

  // Add data rows
  let totalKm = 0;
  let totalCosto = 0;

  for (const salida of salidas) {
    worksheet.addRow({
      destino: salida.destino,
      chofer: salida.chofer_nombre || '-',
      vehiculo: salida.vehiculo_nombre,
      fecha: salida.fecha,
      km: salida.kilometros,
      idaRegreso: salida.ida_regreso ? 'Sí' : 'No',
      costo: salida.costo_total
    });

    totalKm += salida.kilometros;
    totalCosto += salida.costo_total;
  }

  // Add totals row
  const totalRow = worksheet.addRow({
    destino: 'TOTAL',
    chofer: '',
    vehiculo: '',
    fecha: '',
    km: totalKm,
    idaRegreso: '',
    costo: totalCosto
  });
  totalRow.font = { bold: true };
  totalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFB8D4B8' }
  };

  // Format numbers
  worksheet.getColumn('km').numFmt = '#,##0.00';
  worksheet.getColumn('costo').numFmt = '$#,##0.00';

  // Write file
  await workbook.xlsx.writeFile(filePath);
  log.info(`Excel export completed: ${salidas.length} salidas`);
}
