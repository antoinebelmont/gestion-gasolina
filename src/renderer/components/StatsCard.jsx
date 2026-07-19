import React from 'react';

function StatsCard({ title, value, description }) {
  return (
    <div className="stats-card">
      <div className="stats-title">{title}</div>
      <div className="stats-value">{value}</div>
      <div className="stats-description">{description}</div>
    </div>
  );
}

export default StatsCard;
