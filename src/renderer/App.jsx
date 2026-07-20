import React, { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RegistroSemanal from './pages/RegistroSemanal';
import Configuracion from './pages/Configuracion';
import ToastContainer from './components/ToastContainer';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { toasts, hideToast } = useAppContext();

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'registro':
        return <RegistroSemanal />;
      case 'configuracion':
        return <Configuracion />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderPage()}
      </Layout>
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
