import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  Package,
  ShieldAlert
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { LOCATIONS } from '../mockData/transfers';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const Adjustments = () => {
  const { adjustments, products, addAdjustment, loading } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [countedQty, setCountedQty] = useState(0);
  const [reason, setReason] = useState('Routine physical cycle count');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const selectedProduct = products.find((p) => p.id === productId);
  const systemQty = selectedProduct ? selectedProduct.current_stock : 0;
  const delta = countedQty - systemQty;
  const variancePercent = systemQty > 0 ? (Math.abs(delta) / systemQty) * 100 : 0;
  const isAnomaly = variancePercent > 30 && Math.abs(delta) > 5;

  const handleOpenModal = () => {
    const initialProd = products[0];
    setProductId(initialProd?.id || '');
    setCountedQty(initialProd ? initialProd.current_stock : 0);
    setLocation(LOCATIONS[0]);
    setReason('Physical warehouse audit');
    setDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleProductSelect = (id) => {
    setProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setCountedQty(prod.current_stock);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    await addAdjustment({
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      location,
      system_qty: systemQty,
      counted_qty: countedQty,
      reason,
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
            <SlidersHorizontal className="w-6 h-6 text-amber-600" />
            Inventory Adjustments (Cycle Counts)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Reconcile physical counts with system records and flag suspicious anomaly variances automatically
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Stock Adjustment</span>
        </button>
      </div>

      {/* Adjustments Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {adjustments.length === 0 ? (
          <EmptyState
            title="No Adjustments Recorded"
            description="No inventory cycle counts or damage adjustments have been logged."
            actionLabel="Record Adjustment"
            onAction={handleOpenModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-5">Adjustment Ref</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-right">System Qty</th>
                  <th className="py-3.5 px-4 text-right">Counted Qty</th>
                  <th className="py-3.5 px-4 text-right">Variance Delta</th>
                  <th className="py-3.5 px-4">Reason / Notes</th>
                  <th className="py-3.5 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adjustments.map((adj) => {
                  const isNegative = adj.delta < 0;
                  const isPositive = adj.delta > 0;
                  return (
                    <tr key={adj.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                        {adj.reference_id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {adj.date}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {adj.product_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {adj.location}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        {adj.system_qty}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {adj.counted_qty}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] ${
                            isNegative
                              ? 'bg-rose-50 text-rose-700'
                              : isPositive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-50 text-slate-600'
                          }`}
                        >
                          {isPositive ? `+${adj.delta}` : adj.delta}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate" title={adj.reason}>
                        {adj.reason}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Badge variant="success" size="sm">
                          {adj.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Adjustment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Stock Reconciliation & Physical Count Adjustment"
        subtitle="Auto-calculate count discrepancy delta and update active ledger"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Product</label>
            <select
              value={productId}
              onChange={(e) => handleProductSelect(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Recorded: {p.current_stock} {p.unit}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Warehouse Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Counts and Live Delta Calculation */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] font-medium text-slate-500">System Recorded Stock:</span>
                <p className="text-xl font-bold text-slate-800 mt-0.5">
                  {systemQty} <span className="text-xs font-normal text-slate-400">{selectedProduct?.unit}</span>
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Physical Counted Quantity *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={countedQty}
                  onChange={(e) => setCountedQty(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 text-base font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Calculated Delta */}
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Calculated Adjustment Delta:</span>
              <span
                className={`font-mono text-sm font-extrabold px-2.5 py-0.5 rounded-lg ${
                  delta < 0
                    ? 'bg-rose-100 text-rose-800'
                    : delta > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {delta > 0 ? `+${delta}` : delta} {selectedProduct?.unit}
              </span>
            </div>
          </div>

          {/* ANOMALY DETECTION WARNING BANNER (Required by problem statement / plan) */}
          {isAnomaly && (
            <div className="rounded-xl border border-amber-400 bg-amber-50 p-3.5 text-xs text-amber-900 flex items-start gap-2.5 animate-in fade-in duration-200">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">⚠️ Anomaly Detected: Unusually Large Discrepancy</p>
                <p className="mt-0.5 text-amber-800/90 leading-relaxed">
                  This adjustment represents a <strong>{variancePercent.toFixed(1)}% variance</strong> (&gt;30% threshold) from recorded inventory. Please double-check the physical count before confirming.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Reason / Notes</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. 3 kg steel damaged in transit (Step 4 Odoo Flow)"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
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
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-all"
            >
              Confirm & Post Adjustment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
