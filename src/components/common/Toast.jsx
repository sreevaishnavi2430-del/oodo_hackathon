import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

export const Toast = () => {
  const { toast, showToast } = useInventory();

  if (!toast) return null;

  const { message, type } = toast;

  const typeConfig = {
    success: {
      icon: CheckCircle2,
      containerClass: 'bg-slate-900 text-white border-slate-700 shadow-xl',
      iconClass: 'text-emerald-400'
    },
    warning: {
      icon: AlertTriangle,
      containerClass: 'bg-amber-900 text-white border-amber-700 shadow-xl',
      iconClass: 'text-amber-400'
    },
    error: {
      icon: AlertCircle,
      containerClass: 'bg-rose-950 text-white border-rose-800 shadow-xl',
      iconClass: 'text-rose-400'
    }
  };

  const current = typeConfig[type] || typeConfig.success;
  const Icon = current.icon;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex max-w-md items-center gap-3 rounded-xl border px-4 py-3 text-sm animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${current.containerClass}`}>
        <Icon className={`w-5 h-5 shrink-0 ${current.iconClass}`} />
        <p className="font-medium text-sm leading-snug">{message}</p>
        <button
          onClick={() => showToast(null)}
          className="ml-auto text-slate-400 hover:text-white p-1 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
