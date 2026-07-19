import React from 'react';

function WeeklyChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <p>No hay datos de semanas disponibles</p>
      </div>
    );
  }

  // Get max value for scaling
  const maxValue = Math.max(...data.map(d => d.total), 1);

  return (
    <div className="weekly-chart">
      {data.map(item => (
        <div key={item.semana} className="chart-bar-container">
          <div className="chart-bar-wrapper">
            <div
              className="chart-bar"
              style={{ height: `${(item.total / maxValue) * 100}%` }}
              title={`$${item.total.toFixed(2)}`}
            >
              <span className="chart-bar-value">${item.total.toFixed(0)}</span>
            </div>
          </div>
          <div className="chart-label">{formatDate(item.semana)}</div>
        </div>
      ))}
    </div>
  );
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
}

export default WeeklyChart;
