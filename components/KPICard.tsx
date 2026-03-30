
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 flex items-start space-x-3 md:space-x-4 transition-all hover:shadow-md hover-card">
      <div className={`p-2.5 md:p-3 rounded-lg ${colorClass} bg-opacity-10 shrink-0`}>
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { size: 18, className: (icon as React.ReactElement).props.className + " md:w-6 md:h-6" }) : icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs md:text-sm font-medium text-slate-500 leading-tight">{title}</p>
        <h3 className="text-xl md:text-2xl font-bold text-slate-900 mt-1 leading-tight tracking-tight break-words">{value}</h3>
        {subtitle && (
          <p className="text-[10px] md:text-xs text-slate-400 mt-1 font-bold uppercase tracking-wider leading-tight">{subtitle}</p>
        )}
      </div>
    </div>
  );
};
