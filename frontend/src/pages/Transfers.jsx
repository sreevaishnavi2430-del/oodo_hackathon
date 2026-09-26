import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Plus,
  ArrowRight,
  Building2,
  Calendar,
  Package,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { LOCATIONS } from '../mockData/transfers';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { exportToExcel, exportToCsv, formatTransfersForExport } from '../utils/exportUtils';

export const Transfers = () => {
  const { transfers, products, addTransfer, loading, showToast } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [qty, setQty] = useState(25);
  const [fromLocation, setFromLocation] = useState(LOCATIONS[0]);
  const [toLocation, setToLocation] = useState(LOCATIONS[1]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleOpenModal = () => {
    setProductId(products[0]?.id || '');
    setQty(25);
    setFromLocation(LOCATIONS[0]);
    setToLocation(LOCATIONS[1]);
    setDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (fromLocation === toLocation) {
      showToast("Source and destination locations cannot be the same.", 'warning');
      return;
    }

    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    await addTransfer({
      product_id: prod.id,
      product_name: prod.name,
      qty: Number(qty),
      unit: prod.unit,
      from_location: fromLocation,
      to_location: toLocation,
      date
    });

    setIsModalOpen(false);
  };

  if (loading) {
    return <LoadingSkeleton rows={6} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-indigo-600" />
            Internal Warehouse Transfers
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Relocate stock across warehouses, staging bins, or production racks without altering aggregate balances
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              exportToExcel(formatTransfersForExport(transfers), `stocksense_transfers_${new Date().toISOString().split('T')[0]}`, 'Transfers');
              showToast('Exported warehouse transfers to Excel (.xlsx)', 'success');
            }}
            disabled={transfers.length === 0}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all disabled:opacity-50"
            title="Export transfers to Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => {
              exportToCsv(formatTransfersForExport(transfers), `stocksense_transfers_${new Date().toISOString().split('T')[0]}`);
              showToast('Exported warehouse transfers to CSV (.csv)', 'success');
            }}
            disabled={transfers.length === 0}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all disabled:opacity-50"
            title="Export transfers to CSV"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Internal Transfer</span>
          </button>
        </div>
      </div>

      {/* Transfers Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {transfers.length === 0 ? (
          <EmptyState
            title="No Transfers Found"
            description="No internal location transfers have been logged yet."
            actionLabel="Schedule Transfer"
            onAction={handleOpenModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-5">Transfer Ref</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4 text-center">Movement Route</th>
                  <th className="py-3.5 px-4 text-right">Quantity</th>
                  <th className="py-3.5 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map((trf) => (
                  <tr key={trf.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                      {trf.reference_id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {trf.date}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {trf.product_name}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 font-medium">
                        <span>{trf.from_location}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{trf.to_location}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-indigo-900 font-mono">
                      {trf.qty} <span className="text-[10px] text-slate-400 font-normal">{trf.unit}</span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Badge variant={trf.status === 'Done' ? 'success' : 'info'} size="sm">
                        {trf.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Transfer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Internal Stock Movement"
        subtitle="Transfer products between warehouse facilities, racking zones, or shop floors"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Product</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Available: {p.current_stock} {p.unit}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Source Location (From)</label>
              <select
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Location (To)</label>
              <select
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Quantity</label>
              <input
                type="number"
                min="1"
                required
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="rounded-lg bg-indigo-50/60 p-3 text-[11px] text-indigo-900 border border-indigo-100 flex items-start gap-2">
            <span className="font-bold shrink-0">ℹ️ Rule:</span>
            <span>Total organization-wide inventory will remain constant. Movement event will be audited in the permanent Stock Ledger.</span>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
            >
              Execute Transfer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
