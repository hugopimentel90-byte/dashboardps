
import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  colorClass: string;
}

export const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, icon, colorClass }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-start space-x-4 transition-all hover:shadow-md hover-card">
      <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wider">{subtitle}</p>
        )}
      </div>
    </div>
  );
};
