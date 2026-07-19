import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import SemanaSelector from '../components/SemanaSelector';
import NuevaSalidaModal from '../components/NuevaSalidaModal';
import SalidaRow from '../components/SalidaRow';
import WeekSummary from '../components/WeekSummary';
import ExportButtons from '../components/ExportButtons';

function RegistroSemanal() {
  const { semanas, currentSemanaId, currentSalidas, loading, selectSemana, createSemana } =
    useAppContext();

  const [showSalidaModal, setShowSalidaModal] = useState(false);
  const [editingSalida, setEditingSalida] = useState(null);
  const [showNewWeekInput, setShowNewWeekInput] = useState(false);
  const [newWeekDate, setNewWeekDate] = useState('');

  const currentSemana = semanas.find(s => s.id === currentSemanaId);

  const handleCreateWeek = async () => {
    if (!newWeekDate) return;

    const result = await createSemana(newWeekDate);
    if (result.success) {
      setShowNewWeekInput(false);
      setNewWeekDate('');
    } else {
      alert(result.error || 'Error al crear la semana');
    }
  };

  const handleNuevaSalida = () => {
    setEditingSalida(null);
    setShowSalidaModal(true);
  };

  const handleEditarSalida = salida => {
    setEditingSalida(salida);
    setShowSalidaModal(true);
  };

  const handleCloseModal = () => {
    setShowSalidaModal(false);
    setEditingSalida(null);
  };

  return (
    <div className="registro-semanal">
      <div className="page-header">
        <h1>Registro Semanal</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => setShowNewWeekInput(true)}>
            Nueva Semana
          </button>
        </div>
      </div>

      {showNewWeekInput && (
        <div className="new-week-form">
          <label>Selecciona el lunes de la semana:</label>
          <input type="date" value={newWeekDate} onChange={e => setNewWeekDate(e.target.value)} />
          <button className="btn btn-primary" onClick={handleCreateWeek}>
            Crear
          </button>
          <button className="btn btn-secondary" onClick={() => setShowNewWeekInput(false)}>
            Cancelar
          </button>
        </div>
      )}

      <SemanaSelector semanas={semanas} selectedId={currentSemanaId} onSelect={selectSemana} />

      {currentSemana && (
        <>
          <div className="semana-header">
            <h2>Semana del {formatDate(currentSemana.fecha_inicio)}</h2>
            <div className="semana-actions">
              <button className="btn btn-primary" onClick={handleNuevaSalida}>
                Nueva Salida
              </button>
              <ExportButtons semanaId={currentSemanaId} />
            </div>
          </div>

          <WeekSummary salidas={currentSalidas} />

          {loading ? (
            <div className="loading">Cargando...</div>
          ) : currentSalidas.length === 0 ? (
            <div className="empty-state">
              <p>No hay salidas registradas para esta semana.</p>
              <button className="btn btn-primary" onClick={handleNuevaSalida}>
                Agregar primera salida
              </button>
            </div>
          ) : (
            <table className="salidas-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Destino</th>
                  <th>Chofer</th>
                  <th>Vehículo</th>
                  <th>Km</th>
                  <th>Ida/Regreso</th>
                  <th>Costo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentSalidas.map(salida => (
                  <SalidaRow
                    key={salida.id}
                    salida={salida}
                    onEdit={() => handleEditarSalida(salida)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {showSalidaModal && <NuevaSalidaModal salida={editingSalida} onClose={handleCloseModal} />}
    </div>
  );
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export default RegistroSemanal;
