import React, { useState } from 'react'
import ChoferesTab from '../components/ChoferesTab'
import VehiculosTab from '../components/VehiculosTab'
import CombustibleTab from '../components/CombustibleTab'

function Configuracion() {
  const [activeTab, setActiveTab] = useState('chofers')

  const tabs = [
    { id: 'chofers', label: 'Chofers' },
    { id: 'vehiculos', label: 'Vehículos' },
    { id: 'combustible', label: 'Combustible' }
  ]

  return (
    <div className="configuracion">
      <h1>Configuración</h1>

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'chofers' && <ChoferesTab />}
        {activeTab === 'vehiculos' && <VehiculosTab />}
        {activeTab === 'combustible' && <CombustibleTab />}
      </div>
    </div>
  )
}

export default Configuracion
