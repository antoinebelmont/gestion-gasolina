import React from 'react';

function SemanaSelector({ semanas, selectedId, onSelect }) {
  if (semanas.length === 0) {
    return (
      <div className="semana-selector empty">
        <p>No hay semanas registradas. Crea una nueva semana para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="semana-selector">
      <label htmlFor="semana-select">Seleccionar semana:</label>
      <select
        id="semana-select"
        value={selectedId || ''}
        onChange={e => onSelect(Number(e.target.value))}
      >
        <option value="" disabled>
          -- Selecciona una semana --
        </option>
        {semanas.map(semana => (
          <option key={semana.id} value={semana.id}>
            {formatWeekLabel(semana.fecha_inicio)}
          </option>
        ))}
      </select>
    </div>
  );
}

function formatWeekLabel(dateStr) {
  const date = new Date(dateStr);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 6);

  const options = { month: 'short', day: 'numeric' };
  return `${date.toLocaleDateString('es-MX', options)} - ${endDate.toLocaleDateString(
    'es-MX',
    options
  )}`;
}

export default SemanaSelector;
