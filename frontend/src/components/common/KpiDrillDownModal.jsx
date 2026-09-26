import React, { useState, useMemo } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  Package,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  ExternalLink
} from 'lucide-react';
import { exportToExcel, exportToCsv } from '../../utils/exportUtils';
import { Badge } from './Badge';

export const KpiDrillDownModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  data = [],
  exportFormatter,
  fileName = 'kpi_drilldown',
  icon: Icon = Package,
  columns = [],
  onRowClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((item) => {
      return Object.values(item).some((val) =>
        val !== null && val !== undefined && String(val).toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm]);

  const handleExport = (format) => {
    const formatted = exportFormatter ? exportFormatter(filteredData) : filteredData;
    if (format === 'xlsx') {
      exportToExcel(formatted, `${fileName}_${new Date().toISOString().split('T')[0]}`, title);
    } else {
      exportToCsv(formatted, `${fileName}_${new Date().toISOString().split('T')[0]}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-2xs">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{title}</h3>
                <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-800 rounded-full">
                  {data.length} records
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{subtitle || 'Granular breakdown of KPI metric'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Export Buttons */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
              <button
                onClick={() => handleExport('xlsx')}
                disabled={filteredData.length === 0}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors disabled:opacity-50"
                title="Download Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Excel</span>
              </button>
              <div className="w-px h-4 bg-slate-200 my-auto" />
              <button
                onClick={() => handleExport('csv')}
                disabled={filteredData.length === 0}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
                title="Download CSV (.csv)"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">CSV</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar & Summary Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search records in this KPI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-800">{filteredData.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{data.length}</span> entries
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto max-h-96 divide-y divide-slate-100">
          {filteredData.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No matching records found in this metric.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} className={`py-3 px-4 ${col.align === 'right' ? 'text-right' : ''}`}>
                      {col.label}
                    </th>
                  ))}
                  {onRowClick && <th className="py-3 px-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredData.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                  >
                    {columns.map((col) => {
                      const val = item[col.key];
                      return (
                        <td
                          key={col.key}
                          className={`py-3 px-4 ${col.align === 'right' ? 'text-right font-medium' : ''}`}
                        >
                          {col.render ? col.render(val, item) : String(val ?? '—')}
                        </td>
                      );
                    })}
                    {onRowClick && (
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold text-[11px]">
                          Inspect <ExternalLink className="w-3 h-3" />
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Direct manual export available in Excel (.xlsx) and CSV formats.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl transition-all shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
