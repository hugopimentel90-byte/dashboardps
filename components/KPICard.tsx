
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
      <div className="min-w-0">
        <p className="text-[9px] md:text-sm font-medium text-slate-500 truncate">{title}</p>
        <h3 className="text-base md:text-2xl font-bold text-slate-900 mt-0.5 md:mt-1 truncate">{value}</h3>
        {subtitle && (
          <p className="text-[7px] md:text-xs text-slate-400 mt-1 font-medium uppercase tracking-wider truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
};
