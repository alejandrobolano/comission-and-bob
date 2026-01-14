import React from 'react';

interface SummaryCardProps {
  label: string;
  value: string;
  color: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, color }) => (
  <div className={`${color} p-5 rounded-xl shadow-sm border border-black/5`}>
    <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">{label}</p>
    <p className="text-xl font-black">{value}</p>
  </div>
);
