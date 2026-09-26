import React, { useState } from 'react';
import { Search, Bell, Menu, LogOut, User, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useInventory } from '../../context/InventoryContext';
import { NotificationDropdown } from './NotificationDropdown';

export const Topbar = ({ onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const { atRiskProducts } = useInventory();
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-6 backdrop-blur-md">
      {/* Left: Mobile hamburger & Logo/Name */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold shadow-sm shadow-indigo-200">
            <span className="text-base tracking-tight font-black">SS</span>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-slate-900">StockSense</span>
              <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.2 text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Sparkles className="w-2.5 h-2.5" /> AI IMS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Search bar placeholder */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search SKUs, receipts, deliveries, or locations..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Right: Notification bell + User profile / Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
            className={`relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors ${isAlertsOpen ? 'bg-slate-100 text-slate-900' : ''}`}
            aria-label="Stockout Alerts"
          >
            <Bell className="w-5 h-5" />
            {atRiskProducts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
                {atRiskProducts.length}
              </span>
            )}
          </button>

          <NotificationDropdown
            isOpen={isAlertsOpen}
            onClose={() => setIsAlertsOpen(false)}
          />
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* User Info & Logout */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-white font-semibold text-xs shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name || "Inventory Mgr"}</p>
              <p className="text-[10px] text-slate-400 leading-tight">{user?.role || "Staff"}</p>
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign out"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
