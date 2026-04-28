import React, { useRef, useLayoutEffect, useState } from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  colorClass: string;
}

const AutoShrinkText: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const adjustScale = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const textWidth = textRef.current.offsetWidth;
        
        if (textWidth > containerWidth && containerWidth > 0) {
          // Deixa uma pequena margem (ex: 0.98) para não ficar grudado na borda
          setScale((containerWidth / textWidth) * 0.98);
        } else {
          setScale(1);
        }
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      adjustScale();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    // Initial adjustment
    adjustScale();
    
    return () => resizeObserver.disconnect();
  }, [children]);

  return (
    <div ref={containerRef} className="w-full flex items-center overflow-hidden">
      <div 
        className={`whitespace-nowrap origin-left inline-block ${className || ''}`}
        style={{ transform: `scale(${scale})`, transition: 'transform 0.1s ease-out' }}
      >
        <span ref={textRef}>{children}</span>
      </div>
    </div>
  );
};

export const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, icon, colorClass }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 flex items-start space-x-3 md:space-x-4 transition-all hover:shadow-md hover-card min-w-0">
      <div className={`p-2.5 md:p-3 rounded-lg ${colorClass} bg-opacity-10 shrink-0`}>
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { size: 18, className: (icon as React.ReactElement).props.className + " md:w-6 md:h-6" }) : icon}
      </div>
      <div className="min-w-0 flex-1 flex flex-col justify-center space-y-1">
        <AutoShrinkText className="text-xs md:text-sm font-medium text-slate-500 leading-tight">
          {title}
        </AutoShrinkText>
        <AutoShrinkText className="text-xl md:text-2xl font-bold text-slate-900 leading-tight tracking-tight">
          {value}
        </AutoShrinkText>
        {subtitle && (
          <AutoShrinkText className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider leading-tight">
            {subtitle}
          </AutoShrinkText>
        )}
      </div>
    </div>
  );
};
