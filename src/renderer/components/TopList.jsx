import React from 'react';

function TopList({ items, field, countField }) {
  if (!items || items.length === 0) {
    return (
      <div className="top-list-empty">
        <p>No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <ul className="top-list">
      {items.map((item, index) => (
        <li key={index} className="top-list-item">
          <span className="top-list-rank">#{index + 1}</span>
          <span className="top-list-name">{item[field]}</span>
          <span className="top-list-count">{item[countField]}</span>
        </li>
      ))}
    </ul>
  );
}

export default TopList;
