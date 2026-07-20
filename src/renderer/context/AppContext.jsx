import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const AppContext = createContext(null);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}

export function AppProvider({ children }) {
  const [chofers, setChofers] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [costosCombustible, setCostosCombustible] = useState({ gasolina: 0, diesel: 0 });
  const [semanas, setSemanas] = useState([]);
  const [currentSemanaId, setCurrentSemanaId] = useState(null);
  const [currentSalidas, setCurrentSalidas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Load chofers
      const chofersResult = await window.api.db.chofers.getAll();
      if (chofersResult.success) {
        setChofers(chofersResult.data);
      }

      // Load vehiculos
      const vehiculosResult = await window.api.db.vehiculos.getAll();
      if (vehiculosResult.success) {
        setVehiculos(vehiculosResult.data);
      }

      // Load costos
      const costosResult = await window.api.db.costos.get();
      if (costosResult.success) {
        setCostosCombustible(costosResult.data);
      }

      // Load semanas
      const semanasResult = await window.api.db.semanas.getAll();
      if (semanasResult.success) {
        setSemanas(semanasResult.data);
        // Select first semana if none selected
        if (semanasResult.data.length > 0 && !currentSemanaId) {
          setCurrentSemanaId(semanasResult.data[0].id);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentSemanaId]);

  // Load salidas when semana changes
  const loadSalidas = useCallback(async () => {
    if (!currentSemanaId) {
      setCurrentSalidas([]);
      return;
    }

    setLoading(true);
    try {
      const result = await window.api.db.salidas.getBySemana(currentSemanaId);
      if (result.success) {
        setCurrentSalidas(result.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentSemanaId]);

  // Initial load
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load salidas when semana changes
  useEffect(() => {
    loadSalidas();
  }, [loadSalidas]);

  // CRUD operations
  const refreshChofers = async () => {
    const result = await window.api.db.chofers.getAll();
    if (result.success) {
      setChofers(result.data);
    }
    return result;
  };

  const refreshVehiculos = async () => {
    const result = await window.api.db.vehiculos.getAll();
    if (result.success) {
      setVehiculos(result.data);
    }
    return result;
  };

  const refreshCostos = async () => {
    const result = await window.api.db.costos.get();
    if (result.success) {
      setCostosCombustible(result.data);
    }
    return result;
  };

  const refreshSemanas = async () => {
    const result = await window.api.db.semanas.getAll();
    if (result.success) {
      setSemanas(result.data);
    }
    return result;
  };

  const selectSemana = id => {
    setCurrentSemanaId(id);
  };

  const createSemana = async fecha_inicio => {
    const result = await window.api.db.semanas.create({ fecha_inicio });
    if (result.success) {
      await refreshSemanas();
      setCurrentSemanaId(result.data.id);
    }
    return result;
  };

  const deleteSemana = async id => {
    const result = await window.api.db.semanas.delete(id);
    if (result.success) {
      await refreshSemanas();
      if (currentSemanaId === id) {
        const remaining = semanas.filter(s => s.id !== id);
        setCurrentSemanaId(remaining.length > 0 ? remaining[0].id : null);
      }
    }
    return result;
  };

  const createSalida = async data => {
    const result = await window.api.db.salidas.create({
      ...data,
      semana_id: currentSemanaId
    });
    if (result.success) {
      await loadSalidas();
    }
    return result;
  };

  const updateSalida = async data => {
    const result = await window.api.db.salidas.update(data);
    if (result.success) {
      await loadSalidas();
    }
    return result;
  };

  const deleteSalida = async id => {
    const result = await window.api.db.salidas.delete(id);
    if (result.success) {
      await loadSalidas();
    }
    return result;
  };

  // Dashboard data
  const getDashboardData = async () => {
    const [weeklyTotal, totalKm, topChofers, topVehiculos, weeklyCosts] = await Promise.all([
      window.api.db.dashboard.getWeeklyTotal(),
      window.api.db.dashboard.getTotalKilometers(),
      window.api.db.dashboard.getTopChofers(5),
      window.api.db.dashboard.getTopVehiculos(5),
      window.api.db.dashboard.getWeeklyCosts(4)
    ]);

    return {
      weeklyTotal: weeklyTotal.success ? weeklyTotal.data : 0,
      totalKilometers: totalKm.success ? totalKm.data : 0,
      topChofers: topChofers.success ? topChofers.data : [],
      topVehiculos: topVehiculos.success ? topVehiculos.data : [],
      weeklyCosts: weeklyCosts.success ? weeklyCosts.data : []
    };
  };

  // Toast notifications
  const showToast = useCallback((message, type = 'info') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const hideToast = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Toast shortcuts
  const showSuccess = useCallback(message => showToast(message, 'success'), [showToast]);
  const showError = useCallback(message => showToast(message, 'error'), [showToast]);
  const showInfo = useCallback(message => showToast(message, 'info'), [showToast]);

  const value = {
    // State
    chofers,
    vehiculos,
    costosCombustible,
    semanas,
    currentSemanaId,
    currentSalidas,
    loading,
    error,
    toasts,

    // Actions
    loadInitialData,
    refreshChofers,
    refreshVehiculos,
    refreshCostos,
    refreshSemanas,
    selectSemana,
    createSemana,
    deleteSemana,
    loadSalidas,
    createSalida,
    updateSalida,
    deleteSalida,
    getDashboardData,

    // Toast
    showToast,
    hideToast,
    showSuccess,
    showError,
    showInfo,

    // Setters
    setError
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
