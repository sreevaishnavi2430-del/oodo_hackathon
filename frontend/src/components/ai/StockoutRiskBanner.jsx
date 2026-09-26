import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const StockoutRiskBanner = ({ count, items = [] }) => {
  if (count === 0) return null;

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-500 text-white rounded-lg shrink-0 mt-0.5 md:mt-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-950">
            AI Alert: {count} {count === 1 ? 'Product' : 'Products'} at Imminent Stockout Risk (&lt; 7 Days)
          </h4>
          <p className="text-xs text-amber-900/80 mt-0.5">
            Depletion rate forecasting indicates these items will exhaust buffer before next regular delivery cycle.
            {items.length > 0 && ` Affects: ${items.slice(0, 3).map(i => i.name).join(', ')}${items.length > 3 ? '...' : ''}`}
          </p>
        </div>
      </div>
      <Link
        to="/products"
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shrink-0 shadow-sm transition-all"
      >
        <span>Review At-Risk SKUs</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
};
