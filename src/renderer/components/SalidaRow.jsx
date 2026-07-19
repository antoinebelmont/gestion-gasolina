import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

function SalidaRow({ salida, onEdit }) {
  const { deleteSalida } = useAppContext();
  const [confirming, setConfirming] = useState(false);

  const handleDelete = async () => {
    if (confirming) {
      await deleteSalida(salida.id);
      setConfirming(false);
    } else {
      setConfirming(true);
      // Reset after 3 seconds
      setTimeout(() => setConfirming(false), 3000);
    }
  };

  return (
    <tr>
      <td>{formatDate(salida.fecha)}</td>
      <td>{salida.destino}</td>
      <td>{salida.chofer_nombre || '-'}</td>
      <td>{salida.vehiculo_nombre}</td>
      <td className="number">{salida.kilometros.toFixed(1)}</td>
      <td className="center">
        {salida.ida_regreso ? (
          <span className="badge badge-yes">Sí</span>
        ) : (
          <span className="badge badge-no">No</span>
        )}
      </td>
      <td className="number cost">${salida.costo_total.toFixed(2)}</td>
      <td className="actions">
        <button className="btn btn-small btn-secondary" onClick={onEdit}>
          Editar
        </button>
        <button
          className={`btn btn-small ${confirming ? 'btn-danger' : 'btn-outline'}`}
          onClick={handleDelete}
        >
          {confirming ? 'Confirmar' : 'Eliminar'}
        </button>
      </td>
    </tr>
  );
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short'
  });
}

export default SalidaRow;
