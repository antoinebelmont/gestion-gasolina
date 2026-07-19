import React, { useState } from 'react';

function ExportButtons({ semanaId }) {
  const [exporting, setExporting] = useState(null);

  const handleExportGGW = async () => {
    setExporting('ggw');
    try {
      const result = await window.api.file.export.ggw(semanaId);
      if (result.success) {
        alert('Semana exportada exitosamente');
      } else if (!result.canceled) {
        alert(result.error || 'Error al exportar');
      }
    } catch (error) {
      alert('Error al exportar: ' + error.message);
    }
    setExporting(null);
  };

  const handleExportXLSX = async () => {
    setExporting('xlsx');
    try {
      const result = await window.api.file.export.xlsx(semanaId);
      if (result.success) {
        alert('Archivo Excel exportado exitosamente');
      } else if (!result.canceled) {
        alert(result.error || 'Error al exportar');
      }
    } catch (error) {
      alert('Error al exportar: ' + error.message);
    }
    setExporting(null);
  };

  return (
    <div className="export-buttons">
      <button className="btn btn-secondary" onClick={handleExportGGW} disabled={exporting}>
        {exporting === 'ggw' ? 'Exportando...' : 'Exportar .ggw'}
      </button>
      <button className="btn btn-secondary" onClick={handleExportXLSX} disabled={exporting}>
        {exporting === 'xlsx' ? 'Exportando...' : 'Exportar Excel'}
      </button>
    </div>
  );
}

export default ExportButtons;
