import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';

export const KpiCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  isAiRisk = false,
  onClick,
  onExport,
  drilldownHint = 'Click to inspect records →'
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportClick = (e, format) => {
    e.stopPropagation();
    setShowExportMenu(false);
    if (onExport) {
      onExport(format);
    }
  };

  const toggleMenu = (e) => {
    e.stopPropagation();
    setShowExportMenu((prev) => !prev);
  };

  if (isAiRisk) {
    return (
      <div
        onClick={onClick}
        className={`relative overflow-hidden rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-500/10 via-amber-50 to-orange-50/50 p-5 shadow-sm transition-all hover:shadow-md ${
          onClick ? 'cursor-pointer hover:border-amber-400 group' : ''
        }`}
      >
        <div className="absolute top-0 right-0 h-16 w-16 -mr-4 -mt-4 rounded-full bg-amber-400/20 blur-lg pointer-events-none" />

        <div className="flex items-center justify-between mb-3 relative z-10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            AI Prediction Engine
          </span>

          <div className="flex items-center gap-1.5" ref={menuRef}>
            {badgeText && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                {badgeText}
              </span>
            )}

            {onExport && (
              <div className="relative">
                <button
                  type="button"
                  onClick={toggleMenu}
                  className="p-1 text-amber-800/80 hover:text-amber-950 hover:bg-amber-200/60 rounded-lg transition-colors"
                  title="Download KPI Data (Excel / CSV)"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={(e) => handleExportClick(e, 'xlsx')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700 hover:text-emerald-700"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Excel (.xlsx)</span>
                    </button>
                    <button
                      onClick={(e) => handleExportClick(e, 'csv')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700 hover:text-slate-900"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>CSV (.csv)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-baseline justify-between relative z-10">
          <div>
            <h3 className="text-3xl font-extrabold text-amber-950 tracking-tight">{value}</h3>
            <p className="text-xs font-semibold text-amber-900 mt-1">{title}</p>
          </div>
          {Icon && (
            <div className="p-3 bg-amber-200/80 text-amber-800 rounded-xl shadow-2xs group-hover:scale-105 transition-transform">
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>

        {subtitle && (
          <div className="mt-3 text-[11px] text-amber-900/80 font-medium border-t border-amber-200/70 pt-2 flex items-center justify-between relative z-10">
            <span>{subtitle}</span>
            <span className="text-[10px] font-bold underline text-amber-900">{drilldownHint}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md ${
        onClick ? 'cursor-pointer hover:border-slate-300 group' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500 truncate mr-1">{title}</span>

        <div className="flex items-center gap-1.5 shrink-0" ref={menuRef}>
          {badgeText && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
              {badgeText}
            </span>
          )}

          {onExport && (
            <div className="relative">
              <button
                type="button"
                onClick={toggleMenu}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Download KPI Data (Excel / CSV)"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={(e) => handleExportClick(e, 'xlsx')}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700 hover:text-emerald-700"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={(e) => handleExportClick(e, 'csv')}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700 hover:text-slate-900"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>CSV (.csv)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
        {Icon && (
          <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl border border-slate-100 group-hover:scale-105 transition-transform">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {subtitle && (
        <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
          <span className="truncate mr-2">{subtitle}</span>
          {onClick && <span className="text-[10px] text-indigo-600 font-semibold shrink-0 group-hover:underline">Inspect →</span>}
        </div>
      )}
    </div>
  );
};
