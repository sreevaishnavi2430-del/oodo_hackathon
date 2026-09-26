import React, { useRef, useEffect } from 'react';
import { AlertTriangle, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';

export const NotificationDropdown = ({ isOpen, onClose }) => {
  const { atRiskProducts } = useInventory();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider">AI Stockout Alerts</span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
          {atRiskProducts.length} at risk
        </span>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-1">
        {atRiskProducts.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
            <p className="text-xs font-semibold text-slate-700">No Imminent Stockouts</p>
            <p className="text-[11px] text-slate-400 mt-1">All monitored inventory levels are within safe operating limits.</p>
          </div>
        ) : (
          atRiskProducts.map((p) => (
            <Link
              key={p.id}
              to={`/products/${p.id}`}
              onClick={onClose}
              className="flex items-start gap-3 p-3 hover:bg-amber-50/50 rounded-xl transition-colors group"
            >
              <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5 group-hover:bg-amber-200">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-amber-900">
                    {p.name}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Stock: <strong className="text-slate-800">{p.current_stock} {p.unit}</strong> | Reorder: <strong className="text-indigo-600">+{p.suggested_reorder_qty}</strong>
                </p>
                <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-amber-700">
                  <Clock className="w-3 h-3" />
                  <span>Depletes by {p.predicted_stockout_date}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-500">Proactive WhatsApp/SMS alerts active</span>
        <Link
          to="/products"
          onClick={onClose}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
