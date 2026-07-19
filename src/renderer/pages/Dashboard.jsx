import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import StatsCard from '../components/StatsCard';
import WeeklyChart from '../components/WeeklyChart';
import TopList from '../components/TopList';

function Dashboard() {
  const { getDashboardData } = useAppContext();
  const [data, setData] = useState({
    weeklyTotal: 0,
    totalKilometers: 0,
    topChofers: [],
    topVehiculos: [],
    weeklyCosts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const dashboardData = await getDashboardData();
      setData(dashboardData);
      setLoading(false);
    };
    loadData();
  }, [getDashboardData]);

  if (loading) {
    return <div className="loading">Cargando dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="stats-grid">
        <StatsCard
          title="Total Semanal"
          value={`$${data.weeklyTotal.toFixed(2)}`}
          description="Costo de la semana actual"
        />
        <StatsCard
          title="Kilómetros Totales"
          value={data.totalKilometers.toFixed(1)}
          description="Kilómetros acumulados"
        />
        <StatsCard
          title="Top Chofer"
          value={data.topChofers[0]?.nombre || '-'}
          description={`${data.topChofers[0]?.total_salidas || 0} salidas`}
        />
        <StatsCard
          title="Vehículo Más Usado"
          value={data.topVehiculos[0]?.nombre || '-'}
          description={`${data.topVehiculos[0]?.total_salidas || 0} salidas`}
        />
      </div>

      <div className="dashboard-row">
        <div className="chart-section">
          <h2>Costos por Semana</h2>
          <WeeklyChart data={data.weeklyCosts} />
        </div>

        <div className="top-section">
          <div className="top-list-container">
            <h2>Top Chofers</h2>
            <TopList items={data.topChofers} field="nombre" countField="total_salidas" />
          </div>
          <div className="top-list-container">
            <h2>Top Vehículos</h2>
            <TopList items={data.topVehiculos} field="nombre" countField="total_salidas" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
