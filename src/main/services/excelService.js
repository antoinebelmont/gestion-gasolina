import ExcelJS from 'exceljs';
import * as db from '../database/index.js';
import log from 'electron-log/main';

const DIAS = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
const MESES = [
  '',
  'ENERO',
  'FEBRERO',
  'MARZO',
  'ABRIL',
  'MAYO',
  'JUNIO',
  'JULIO',
  'AGOSTO',
  'SEPTIEMBRE',
  'OCTUBRE',
  'NOVIEMBRE',
  'DICIEMBRE'
];

function formatDateSpanish(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const dia = DIAS[date.getDay()];
  const num = date.getDate();
  const mes = MESES[date.getMonth() + 1];
  const anio = date.getFullYear();
  return `${dia} ${num} DE ${mes} DE ${anio}`;
}

function groupByDate(salidas) {
  const groups = {};
  for (const s of salidas) {
    if (!groups[s.fecha]) {
      groups[s.fecha] = [];
    }
    groups[s.fecha].push(s);
  }
  return groups;
}

export async function exportWeekToExcel(semanaId, filePath) {
  log.info(`Exporting week ${semanaId} to Excel: ${filePath}`);

  const semanas = db.getSemanas(true);
  const semana = semanas.find(s => s.id === semanaId);
  if (!semana) {
    throw new Error('Semana no encontrada');
  }

  const salidas = db.getSalidasBySemana(semanaId);
  const costos = db.getCostosCombustible();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Gestion Gasolina';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Semana');

  worksheet.columns = [
    { key: 'colA', width: 32 },
    { key: 'colB', width: 28 },
    { key: 'colC', width: 18 },
    { key: 'colD', width: 16 },
    { key: 'colE', width: 18 },
    { key: 'colF', width: 15 },
    { key: 'colG', width: 16 }
  ];

  const GREEN_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
  const BORDER_THIN = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } }
  };

  const byDate = groupByDate(salidas);
  const dates = Object.keys(byDate).sort();

  let weekTotalKm = 0;
  let weekTotalCosto = 0;
  const vehicleWeekTotals = {};

  let currentRow = 1;

  currentRow++;
  const headerRow = worksheet.getRow(currentRow);
  headerRow.height = 40;
  headerRow.alignment = { horizontal: 'left', vertical: 'middle' };
  headerRow.font = { bold: true, size: 14 };
  const titleCell = headerRow.getCell(1);
  titleCell.value = `Programacion del dia ${formatDateSpanish(dates[0])}`;
  titleCell.fill = GREEN_FILL;
  worksheet.mergeCells(currentRow, 1, currentRow, 2);
  headerRow.getCell(2).fill = GREEN_FILL;

  headerRow.getCell(3).value = 'RENDIMIENTO\nKILOMETROS\nX LITRO';
  headerRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  headerRow.getCell(3).font = { bold: false, size: 10 };
  headerRow.getCell(4).value = 'COSTO LITRO\nDISEL';
  headerRow.getCell(4).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  headerRow.getCell(4).font = { bold: false, size: 10 };
  headerRow.getCell(5).value = 'COSTO LITRO\nGASOLINA';
  headerRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  headerRow.getCell(5).font = { bold: false, size: 10 };
  headerRow.getCell(6).value = 'TOTAL\nKILOMETROS';
  headerRow.getCell(6).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  headerRow.getCell(6).font = { bold: false, size: 10 };
  headerRow.getCell(7).value = 'MONTO EN\nDINERO';
  headerRow.getCell(7).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  headerRow.getCell(7).font = { bold: false, size: 10 };
  for (let col = 1; col <= 7; col++) {
    headerRow.getCell(col).border = BORDER_THIN;
  }

  currentRow++;

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const daySalidas = byDate[date];

    if (i > 0) {
      currentRow++;
      const dayHeaderRow = worksheet.getRow(currentRow);
      dayHeaderRow.height = 40;
      dayHeaderRow.alignment = { horizontal: 'left', vertical: 'middle' };
      dayHeaderRow.font = { bold: true, size: 14 };
      const dayTitleCell = dayHeaderRow.getCell(1);
      dayTitleCell.value = `Programacion del dia ${formatDateSpanish(date)}`;
      dayTitleCell.fill = GREEN_FILL;
      worksheet.mergeCells(currentRow, 1, currentRow, 2);
      dayHeaderRow.getCell(2).fill = GREEN_FILL;

      dayHeaderRow.getCell(3).value = 'RENDIMIENTO\nKILOMETROS\nX LITRO';
      dayHeaderRow.getCell(3).alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true
      };
      dayHeaderRow.getCell(3).font = { bold: false, size: 10 };
      dayHeaderRow.getCell(4).value = 'COSTO LITRO\nDISEL';
      dayHeaderRow.getCell(4).alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true
      };
      dayHeaderRow.getCell(4).font = { bold: false, size: 10 };
      dayHeaderRow.getCell(5).value = 'COSTO LITRO\nGASOLINA';
      dayHeaderRow.getCell(5).alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true
      };
      dayHeaderRow.getCell(5).font = { bold: false, size: 10 };
      dayHeaderRow.getCell(6).value = 'TOTAL\nKILOMETROS';
      dayHeaderRow.getCell(6).alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true
      };
      dayHeaderRow.getCell(6).font = { bold: false, size: 10 };
      dayHeaderRow.getCell(7).value = 'MONTO EN\nDINERO';
      dayHeaderRow.getCell(7).alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true
      };
      dayHeaderRow.getCell(7).font = { bold: false, size: 10 };
      for (let col = 1; col <= 7; col++) {
        dayHeaderRow.getCell(col).border = BORDER_THIN;
      }
    }

    let dayTotalCosto = 0;

    for (const salida of daySalidas) {
      currentRow++;
      const row = worksheet.getRow(currentRow);
      row.alignment = { horizontal: 'left', vertical: 'middle' };
      row.font = { size: 10 };

      const choferText = salida.chofer_nombre
        ? `${salida.chofer_nombre}-${salida.vehiculo_nombre}`
        : `${salida.vehiculo_nombre}`;
      const idaRegresoText = salida.ida_regreso ? ' (salida y regreso)' : '';
      const choferVehiculo = `${choferText}${idaRegresoText}`;

      row.getCell(1).value = salida.destino;
      row.getCell(2).value = choferVehiculo;
      row.getCell(3).value = salida.vehiculo_rendimiento;
      row.getCell(4).value = costos.diesel || 0;
      row.getCell(5).value = costos.gasolina || 0;
      row.getCell(6).value = salida.kilometros;
      row.getCell(7).value = salida.costo_total;

      row.getCell(6).numFmt = '#,##0.00';
      row.getCell(7).numFmt = '$#,##0.00';

      for (let col = 1; col <= 7; col++) {
        row.getCell(col).border = BORDER_THIN;
      }

      dayTotalCosto += salida.costo_total;
      weekTotalKm += salida.kilometros;
      weekTotalCosto += salida.costo_total;

      const vKey = salida.vehiculo_nombre;
      if (!vehicleWeekTotals[vKey]) {
        vehicleWeekTotals[vKey] = 0;
      }
      vehicleWeekTotals[vKey] += salida.costo_total;
    }

    currentRow++;
    const dayTotalRow = worksheet.getRow(currentRow);
    dayTotalRow.getCell(7).value = dayTotalCosto;
    dayTotalRow.getCell(7).numFmt = '$#,##0.00';
    for (let col = 1; col <= 7; col++) {
      dayTotalRow.getCell(col).border = BORDER_THIN;
    }

    currentRow++;
    worksheet.addRow({});
  }

  currentRow++;
  const totalRow = worksheet.getRow(currentRow);
  totalRow.height = 20;
  totalRow.alignment = { horizontal: 'left', vertical: 'middle' };
  totalRow.font = { bold: true, size: 12 };
  totalRow.fill = GREEN_FILL;

  totalRow.getCell(2).value = 'TOTAL';
  totalRow.getCell(6).value = weekTotalKm;
  totalRow.getCell(7).value = weekTotalCosto;
  totalRow.getCell(6).numFmt = '#,##0.00';
  totalRow.getCell(7).numFmt = '$#,##0.00';

  for (let col = 1; col <= 7; col++) {
    totalRow.getCell(col).border = BORDER_THIN;
  }

  currentRow++;
  worksheet.addRow({});

  const sortedVehicles = Object.keys(vehicleWeekTotals).sort();

  for (let i = 0; i < sortedVehicles.length; i++) {
    currentRow++;
    const vName = sortedVehicles[i];
    const vRow = worksheet.getRow(currentRow);
    vRow.alignment = { horizontal: 'left', vertical: 'middle' };
    vRow.font = { size: 10 };
    vRow.getCell(6).value = vName;
    vRow.getCell(7).value = vehicleWeekTotals[vName];
    vRow.getCell(7).numFmt = '$#,##0.00';
    for (let col = 6; col <= 7; col++) {
      vRow.getCell(col).border = BORDER_THIN;
    }
  }

  currentRow++;
  const totalVehicleRow = worksheet.getRow(currentRow);
  totalVehicleRow.alignment = { horizontal: 'left', vertical: 'middle' };
  totalVehicleRow.font = { bold: true, size: 12 };
  totalVehicleRow.fill = GREEN_FILL;
  totalVehicleRow.getCell(6).value = 'TOTAL';
  totalVehicleRow.getCell(7).value = weekTotalCosto;
  totalVehicleRow.getCell(7).numFmt = '$#,##0.00';
  for (let col = 6; col <= 7; col++) {
    totalVehicleRow.getCell(col).border = BORDER_THIN;
  }

  await workbook.xlsx.writeFile(filePath);
  log.info(`Excel export completed: ${salidas.length} salidas, ${dates.length} días`);
}
