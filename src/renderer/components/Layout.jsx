import React from 'react';

function Layout({ children, currentPage, onNavigate }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'registro', label: 'Registro Semanal' },
    { id: 'configuracion', label: 'Configuración' }
  ];

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-brand">Gestión de Gasolina</div>
        <div className="navbar-menu">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
}

export default Layout;
