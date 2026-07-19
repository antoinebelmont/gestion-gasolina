import React, { useState } from 'react'
import { useAppContext } from '../context/AppContext'

function ChoferesTab() {
  const { chofers, refreshChofers } = useAppContext()
  const [nombre, setNombre] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('El nombre es requerido')
      return
    }

    try {
      let result
      if (editingId) {
        result = await window.api.db.chofers.update({ id: editingId, nombre: nombre.trim() })
      } else {
        result = await window.api.db.chofers.create({ nombre: nombre.trim() })
      }

      if (result.success) {
        await refreshChofers()
        setNombre('')
        setEditingId(null)
        setError('')
      } else {
        setError(result.error || 'Error al guardar')
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEdit = (chofer) => {
    setNombre(chofer.nombre)
    setEditingId(chofer.id)
    setError('')
  }

  const handleCancel = () => {
    setNombre('')
    setEditingId(null)
    setError('')
  }

  const handleDelete = async (id) => {
    if (confirmingDelete === id) {
      try {
        const result = await window.api.db.chofers.delete(id)
        if (result.success) {
          await refreshChofers()
          setConfirmingDelete(null)
        } else {
          setError(result.error || 'Error al eliminar')
        }
      } catch (err) {
        setError(err.message)
      }
    } else {
      setConfirmingDelete(id)
      setTimeout(() => setConfirmingDelete(null), 3000)
    }
  }

  return (
    <div className="tab-panel">
      <form onSubmit={handleSubmit} className="form-inline">
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del chofer"
          className={error ? 'error' : ''}
        />
        <button type="submit" className="btn btn-primary">
          {editingId ? 'Actualizar' : 'Agregar'}
        </button>
        {editingId && (
          <button type="button" className="btn btn-secondary" onClick={handleCancel}>
            Cancelar
          </button>
        )}
        {error && <span className="error-message">{error}</span>}
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {chofers.map((chofer) => (
            <tr key={chofer.id}>
              <td>{chofer.nombre}</td>
              <td>
                <button
                  className="btn btn-small btn-secondary"
                  onClick={() => handleEdit(chofer)}
                >
                  Editar
                </button>
                <button
                  className={`btn btn-small ${confirmingDelete === chofer.id ? 'btn-danger' : 'btn-outline'}`}
                  onClick={() => handleDelete(chofer.id)}
                >
                  {confirmingDelete === chofer.id ? 'Confirmar' : 'Eliminar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ChoferesTab
