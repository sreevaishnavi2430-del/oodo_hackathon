import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  History,
  X,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { atRiskProducts } = useInventory();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Products', path: '/products', icon: Package, badge: atRiskProducts.length > 0 ? `${atRiskProducts.length} alert` : null },
    { label: 'Receipts (Incoming)', path: '/receipts', icon: ArrowDownLeft },
    { label: 'Deliveries (Outgoing)', path: '/deliveries', icon: ArrowUpRight },
    { label: 'Transfers', path: '/transfers', icon: ArrowLeftRight },
    { label: 'Adjustments', path: '/adjustments', icon: SlidersHorizontal },
    { label: 'Stock Ledger', path: '/ledger', icon: History },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 border-r border-slate-200/80 bg-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold shadow-sm">
              <span className="text-sm font-black">SS</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">StockSense</h1>
              <p className="text-[10px] text-slate-400 font-medium">Smart Inventory OS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex flex-col justify-between h-[calc(100vh-4rem)] p-4">
          <nav className="space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Operations & Inventory
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose()}
                  className={({ isActive }) =>
                    `group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom Card: AI Differentiator Highlights */}
          <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-slate-50 p-3.5 text-xs">
            <div className="flex items-center gap-2 mb-1.5 text-indigo-700 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Predictive IMS Model</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Real-time consumption telemetry projects stockout dates using linear regression.
            </p>
            <div className="mt-2.5 pt-2 border-t border-indigo-100/70 flex items-center justify-between text-[10px] font-semibold text-slate-600">
              <span>Status: Active</span>
              <span className="text-emerald-600 font-bold">● Live Sync</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
