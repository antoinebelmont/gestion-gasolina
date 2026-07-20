import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

function NuevaSalidaModal({ salida, onClose }) {
  const {
    vehiculos,
    chofers,
    costosCombustible,
    createSalida,
    updateSalida,
    showSuccess,
    showError
  } = useAppContext();

  const [formData, setFormData] = useState({
    destino: '',
    chofer_id: '',
    vehiculo_id: '',
    fecha: '',
    kilometros: '',
    ida_regreso: false
  });

  const [errors, setErrors] = useState({});
  const [calculatedCost, setCalculatedCost] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Initialize form with editing data
  useEffect(() => {
    if (salida) {
      setFormData({
        destino: salida.destino || '',
        chofer_id: salida.chofer_id || '',
        vehiculo_id: salida.vehiculo_id || '',
        fecha: salida.fecha || '',
        kilometros: salida.kilometros || '',
        ida_regreso: salida.ida_regreso || false
      });
    }
  }, [salida]);

  // Calculate cost when relevant fields change
  useEffect(() => {
    if (formData.vehiculo_id && formData.kilometros) {
      const vehiculo = vehiculos.find(v => v.id === Number(formData.vehiculo_id));
      if (vehiculo) {
        const precio = costosCombustible[vehiculo.combustible_tipo] || 0;
        const cost = (Number(formData.kilometros) / vehiculo.rendimiento) * precio;
        setCalculatedCost(Math.round(cost * 100) / 100);
      }
    } else {
      setCalculatedCost(0);
    }
  }, [formData.vehiculo_id, formData.kilometros, vehiculos, costosCombustible]);

  // Disable chofer selector if vehicle doesn't need chofer
  const selectedVehiculo = vehiculos.find(v => v.id === Number(formData.vehiculo_id));
  const choferDisabled = selectedVehiculo?.sin_chofer;

  const validateForm = () => {
    const newErrors = {};

    if (!formData.destino.trim()) {
      newErrors.destino = 'El destino es requerido';
    }

    if (!formData.vehiculo_id) {
      newErrors.vehiculo_id = 'El vehículo es requerido';
    }

    if (!choferDisabled && !formData.chofer_id) {
      newErrors.chofer_id = 'El chofer es requerido para este vehículo';
    }

    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es requerida';
    }

    if (!formData.kilometros || Number(formData.kilometros) <= 0) {
      newErrors.kilometros = 'Los kilómetros deben ser mayores a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    const data = {
      destino: formData.destino.trim(),
      chofer_id: choferDisabled ? null : formData.chofer_id || null,
      vehiculo_id: Number(formData.vehiculo_id),
      fecha: formData.fecha,
      kilometros: Number(formData.kilometros),
      ida_regreso: formData.ida_regreso
    };

    let result;
    if (salida) {
      result = await updateSalida({ ...data, id: salida.id });
    } else {
      result = await createSalida(data);
    }

    setSubmitting(false);

    if (result.success) {
      showSuccess(salida ? 'Salida actualizada' : 'Salida creada');
      onClose();
    } else {
      setErrors({ submit: result.error || 'Error al guardar' });
      showError(result.error || 'Error al guardar');
    }
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{salida ? 'Editar Salida' : 'Nueva Salida'}</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="destino">Destino *</label>
            <input
              type="text"
              id="destino"
              name="destino"
              value={formData.destino}
              onChange={handleChange}
              className={errors.destino ? 'error' : ''}
              placeholder="Ej: PSIQUIATRIA - NOEMI"
            />
            {errors.destino && <span className="error-message">{errors.destino}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="chofer_id">Chofer {choferDisabled ? '(No requerido)' : '*'}</label>
              <select
                id="chofer_id"
                name="chofer_id"
                value={formData.chofer_id}
                onChange={handleChange}
                disabled={choferDisabled}
                className={errors.chofer_id ? 'error' : ''}
              >
                <option value="">-- Seleccionar --</option>
                {chofers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              {errors.chofer_id && <span className="error-message">{errors.chofer_id}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="vehiculo_id">Vehículo *</label>
              <select
                id="vehiculo_id"
                name="vehiculo_id"
                value={formData.vehiculo_id}
                onChange={handleChange}
                className={errors.vehiculo_id ? 'error' : ''}
              >
                <option value="">-- Seleccionar --</option>
                {vehiculos.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.nombre} ({v.combustible_tipo}, {v.rendimiento} km/l)
                  </option>
                ))}
              </select>
              {errors.vehiculo_id && <span className="error-message">{errors.vehiculo_id}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fecha">Fecha *</label>
              <input
                type="date"
                id="fecha"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                className={errors.fecha ? 'error' : ''}
              />
              {errors.fecha && <span className="error-message">{errors.fecha}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="kilometros">Kilómetros *</label>
              <input
                type="number"
                id="kilometros"
                name="kilometros"
                value={formData.kilometros}
                onChange={handleChange}
                min="0"
                step="0.1"
                className={errors.kilometros ? 'error' : ''}
              />
              {errors.kilometros && <span className="error-message">{errors.kilometros}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="ida_regreso"
                checked={formData.ida_regreso}
                onChange={handleChange}
              />
              Ida y regreso (informativo)
            </label>
          </div>

          <div className="cost-preview">
            <span>Costo estimado:</span>
            <span className="cost-value">${calculatedCost.toFixed(2)}</span>
          </div>

          {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Guardando...' : salida ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NuevaSalidaModal;
