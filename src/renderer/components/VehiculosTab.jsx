import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

function VehiculosTab() {
  const { vehiculos, refreshVehiculos } = useAppContext();
  const [formData, setFormData] = useState({
    nombre: '',
    sin_chofer: false,
    rendimiento: '',
    combustible_tipo: 'diesel'
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(null);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (!formData.rendimiento || Number(formData.rendimiento) <= 0) {
      setError('El rendimiento debe ser mayor a 0');
      return;
    }

    try {
      const data = {
        ...formData,
        rendimiento: Number(formData.rendimiento)
      };

      let result;
      if (editingId) {
        result = await window.api.db.vehiculos.update({ id: editingId, ...data });
      } else {
        result = await window.api.db.vehiculos.create(data);
      }

      if (result.success) {
        await refreshVehiculos();
        resetForm();
      } else {
        setError(result.error || 'Error al guardar');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = vehiculo => {
    setFormData({
      nombre: vehiculo.nombre,
      sin_chofer: vehiculo.sin_chofer,
      rendimiento: vehiculo.rendimiento,
      combustible_tipo: vehiculo.combustible_tipo
    });
    setEditingId(vehiculo.id);
    setError('');
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      sin_chofer: false,
      rendimiento: '',
      combustible_tipo: 'diesel'
    });
    setEditingId(null);
    setError('');
  };

  const handleDelete = async id => {
    if (confirmingDelete === id) {
      try {
        const result = await window.api.db.vehiculos.delete(id);
        if (result.success) {
          await refreshVehiculos();
          setConfirmingDelete(null);
        } else {
          setError(result.error || 'Error al eliminar');
        }
      } catch (err) {
        setError(err.message);
      }
    } else {
      setConfirmingDelete(id);
      setTimeout(() => setConfirmingDelete(null), 3000);
    }
  };

  return (
    <div className="tab-panel">
      <form onSubmit={handleSubmit} className="vehiculo-form">
        <div className="form-group">
          <label>Nombre:</label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ej: JETTA, 482, CAMION 380"
          />
        </div>

        <div className="form-group">
          <label>Tipo combustible:</label>
          <select name="combustible_tipo" value={formData.combustible_tipo} onChange={handleChange}>
            <option value="gasolina">Gasolina</option>
            <option value="diesel">Diésel</option>
          </select>
        </div>

        <div className="form-group">
          <label>Rendimiento (km/l):</label>
          <input
            type="number"
            name="rendimiento"
            value={formData.rendimiento}
            onChange={handleChange}
            min="1"
          />
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="sin_chofer"
              checked={formData.sin_chofer}
              onChange={handleChange}
            />
            Sin chofer (ej: camión)
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {editingId ? 'Actualizar' : 'Agregar'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancelar
            </button>
          )}
        </div>

        {error && <span className="error-message">{error}</span>}
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Combustible</th>
            <th>Rendimiento</th>
            <th>Sin Chofer</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {vehiculos.map(vehiculo => (
            <tr key={vehiculo.id}>
              <td>{vehiculo.nombre}</td>
              <td>{vehiculo.combustible_tipo}</td>
              <td>{vehiculo.rendimiento} km/l</td>
              <td>{vehiculo.sin_chofer ? 'Sí' : 'No'}</td>
              <td>
                <button
                  className="btn btn-small btn-secondary"
                  onClick={() => handleEdit(vehiculo)}
                >
                  Editar
                </button>
                <button
                  className={`btn btn-small ${confirmingDelete === vehiculo.id ? 'btn-danger' : 'btn-outline'}`}
                  onClick={() => handleDelete(vehiculo.id)}
                >
                  {confirmingDelete === vehiculo.id ? 'Confirmar' : 'Eliminar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default VehiculosTab;
