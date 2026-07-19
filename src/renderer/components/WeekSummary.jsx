import React from 'react';

function WeekSummary({ salidas }) {
  const totalKm = salidas.reduce((sum, s) => sum + s.kilometros, 0);
  const totalCosto = salidas.reduce((sum, s) => sum + s.costo_total, 0);

  return (
    <div className="week-summary">
      <div className="summary-item">
        <span className="summary-label">Total Kilómetros:</span>
        <span className="summary-value">{totalKm.toFixed(1)} km</span>
      </div>
      <div className="summary-item">
        <span className="summary-label">Total Costo:</span>
        <span className="summary-value">${totalCosto.toFixed(2)}</span>
      </div>
      <div className="summary-item">
        <span className="summary-label">Salidas:</span>
        <span className="summary-value">{salidas.length}</span>
      </div>
    </div>
  );
}

export default WeekSummary;
