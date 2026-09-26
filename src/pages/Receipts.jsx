import React, { useState } from 'react';
import {
  ArrowDownLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Building2,
  Package,
  Boxes
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { SUPPLIERS } from '../mockData/receipts';
import { LOCATIONS } from '../mockData/transfers';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const Receipts = () => {
  const { receipts, products, addReceipt, loading } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [supplier, setSupplier] = useState(SUPPLIERS[0]);
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState([
    { product_id: products[0]?.id || '', qty: 50 }
  ]);

  const handleOpenModal = () => {
    setSupplier(SUPPLIERS[0]);
    setLocation(LOCATIONS[0]);
    setDate(new Date().toISOString().split('T')[0]);
    setItems([{ product_id: products[0]?.id || '', qty: 50 }]);
    setIsModalOpen(true);
  };

  const handleAddItemRow = () => {
    setItems([...items, { product_id: products[0]?.id || '', qty: 10 }]);
  };

  const handleRemoveItemRow = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;

    // Build line items payload
    const formattedItems = items.map((item) => {
      const prod = products.find((p) => p.id === item.product_id);
      return {
        product_id: item.product_id,
        product_name: prod?.name || "Inventory Item",
        qty: Number(item.qty),
        unit: prod?.unit || "units"
      };
    });

    await addReceipt({
      supplier,
      location_id: location,
      date,
      items: formattedItems
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
            <ArrowDownLeft className="w-6 h-6 text-emerald-600" />
            Receipts (Incoming Goods)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Receive inventory orders from suppliers, validate quantities, and update stock ledgers automatically
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Inbound Receipt</span>
        </button>
      </div>

      {/* Receipts Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {receipts.length === 0 ? (
          <EmptyState
            title="No Receipts Found"
            description="No inbound shipment orders have been registered yet."
            actionLabel="Create Inbound Receipt"
            onAction={handleOpenModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-5">Receipt Ref</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Supplier</th>
                  <th className="py-3.5 px-4">Line Items</th>
                  <th className="py-3.5 px-4 text-right">Total Units</th>
                  <th className="py-3.5 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipts.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                      {rec.reference_id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {rec.date}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {rec.supplier}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="space-y-1">
                        {rec.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800">{item.product_name}</span>
                            <span className="text-[11px] text-slate-400">({item.qty} {item.unit})</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-700 font-mono">
                      +{rec.total_qty}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Badge
                        variant={rec.status === 'Done' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {rec.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Receipt Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Inbound Stock Receipt"
        subtitle="Log received goods from vendor to increment warehouse on-hand balances"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier</label>
              <select
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {SUPPLIERS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Line items table */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700">Product Line Items</label>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Row</span>
              </button>
            </div>

            <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              {items.map((item, idx) => {
                const prod = products.find((p) => p.id === item.product_id);
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={item.product_id}
                      onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>

                    <div className="w-32 flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleItemChange(idx, 'qty', Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                      />
                      <span className="text-[11px] text-slate-500 w-12 truncate">{prod?.unit || "units"}</span>
                    </div>

                    <button
                      type="button"
                      disabled={items.length <= 1}
                      onClick={() => handleRemoveItemRow(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Total Units: <strong className="text-emerald-700 font-bold">{items.reduce((s, i) => s + (parseInt(i.qty) || 0), 0)}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all"
              >
                Validate & Increment Stock
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
