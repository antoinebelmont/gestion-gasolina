import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

function CombustibleTab() {
  const { costosCombustible, refreshCostos, showSuccess, showError } = useAppContext();
  const [formData, setFormData] = useState({
    gasolina: '',
    diesel: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (costosCombustible) {
      setFormData({
        gasolina: costosCombustible.gasolina?.toString() || '',
        diesel: costosCombustible.diesel?.toString() || ''
      });
    }
  }, [costosCombustible]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();

    const gasolina = parseFloat(formData.gasolina);
    const diesel = parseFloat(formData.diesel);

    if (isNaN(gasolina) || gasolina < 0) {
      setError('El precio de gasolina debe ser un número válido');
      return;
    }

    if (isNaN(diesel) || diesel < 0) {
      setError('El precio de diésel debe ser un número válido');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const result = await window.api.db.costos.update({
        gasolina,
        diesel
      });

      if (result.success) {
        await refreshCostos();
        showSuccess('Precios actualizados');
      } else {
        setError(result.error || 'Error al guardar');
        showError(result.error || 'Error al guardar');
      }
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tab-panel">
      <form onSubmit={handleSubmit} className="combustible-form">
        <div className="form-group">
          <label htmlFor="gasolina">Precio Gasolina ($/litro):</label>
          <input
            type="number"
            id="gasolina"
            name="gasolina"
            value={formData.gasolina}
            onChange={handleChange}
            min="0"
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label htmlFor="diesel">Precio Diésel ($/litro):</label>
          <input
            type="number"
            id="diesel"
            name="diesel"
            value={formData.diesel}
            onChange={handleChange}
            min="0"
            step="0.01"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Precios'}
          </button>
        </div>

        {error && <span className="error-message">{error}</span>}
      </form>
    </div>
  );
}

export default CombustibleTab;
