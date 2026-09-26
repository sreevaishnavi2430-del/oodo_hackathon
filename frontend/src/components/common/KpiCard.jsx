import React from 'react';

export const KpiCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  isAiRisk = false,
  onClick
}) => {
  if (isAiRisk) {
    return (
      <div 
        onClick={onClick}
        className={`relative overflow-hidden rounded-xl border border-amber-300 bg-gradient-to-br from-amber-500/10 via-amber-50 to-orange-50/50 p-5 shadow-sm transition-all hover:shadow-md ${onClick ? 'cursor-pointer hover:border-amber-400' : ''}`}
      >
        <div className="absolute top-0 right-0 h-16 w-16 -mr-4 -mt-4 rounded-full bg-amber-400/15 blur-lg pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            AI Prediction Engine
          </span>
          {badgeText && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-200 text-amber-900 border border-amber-300">
              {badgeText}
            </span>
          )}
        </div>
        <div className="flex items-baseline justify-between">
          <div>
            <h3 className="text-3xl font-extrabold text-amber-950 tracking-tight">{value}</h3>
            <p className="text-sm font-medium text-amber-900 mt-1">{title}</p>
          </div>
          {Icon && (
            <div className="p-3 bg-amber-200/70 text-amber-800 rounded-xl">
              <Icon className="w-6 h-6" />
            </div>
          )}
        </div>
        {subtitle && (
          <p className="mt-3 text-xs text-amber-800/80 font-medium border-t border-amber-200/60 pt-2 flex items-center justify-between">
            <span>{subtitle}</span>
            <span className="text-[11px] underline">Inspect items →</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={`rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md ${onClick ? 'cursor-pointer hover:border-slate-300' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500">{title}</span>
        {badgeText && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
            {badgeText}
          </span>
        )}
      </div>
      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
        {Icon && (
          <div className="p-2.5 bg-slate-50 text-slate-600 rounded-lg border border-slate-100">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {subtitle && (
        <p className="mt-2 text-xs text-slate-500 font-normal">{subtitle}</p>
      )}
    </div>
  );
};
