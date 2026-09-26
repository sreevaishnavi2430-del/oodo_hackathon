import React, { useState } from 'react';
import {
  ArrowUpRight,
  Plus,
  Trash2,
  Calendar,
  Building2,
  Truck,
  AlertCircle
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { CUSTOMERS } from '../mockData/deliveries';
import { LOCATIONS } from '../mockData/transfers';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const Deliveries = () => {
  const { deliveries, products, addDelivery, loading, showToast } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [customer, setCustomer] = useState(CUSTOMERS[0]);
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState([
    { product_id: products[0]?.id || '', qty: 20 }
  ]);

  const handleOpenModal = () => {
    setCustomer(CUSTOMERS[0]);
    setLocation(LOCATIONS[0]);
    setDate(new Date().toISOString().split('T')[0]);
    setItems([{ product_id: products[0]?.id || '', qty: 20 }]);
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

    // Check available stock
    for (const item of items) {
      const prod = products.find((p) => p.id === item.product_id);
      if (prod && Number(item.qty) > prod.current_stock) {
        showToast(`Cannot deliver ${item.qty} ${prod.unit} of ${prod.name}: only ${prod.current_stock} currently available!`, 'error');
        return;
      }
    }

    const formattedItems = items.map((item) => {
      const prod = products.find((p) => p.id === item.product_id);
      return {
        product_id: item.product_id,
        product_name: prod?.name || "Inventory Item",
        qty: Number(item.qty),
        unit: prod?.unit || "units"
      };
    });

    await addDelivery({
      customer,
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
            <ArrowUpRight className="w-6 h-6 text-rose-600" />
            Deliveries (Outgoing Orders)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pick, pack, and validate customer shipments to decrement inventory and log dispatch telemetry
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Outgoing Delivery</span>
        </button>
      </div>

      {/* Deliveries Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {deliveries.length === 0 ? (
          <EmptyState
            title="No Deliveries Found"
            description="No customer delivery orders have been created yet."
            actionLabel="Create Delivery Order"
            onAction={handleOpenModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-5">Delivery Ref</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Customer / Destination</th>
                  <th className="py-3.5 px-4">Products Dispatched</th>
                  <th className="py-3.5 px-4 text-right">Total Dispatched</th>
                  <th className="py-3.5 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveries.map((del) => (
                  <tr key={del.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                      {del.reference_id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {del.date}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {del.customer}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="space-y-1">
                        {del.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800">{item.product_name}</span>
                            <span className="text-[11px] text-slate-400">({item.qty} {item.unit})</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-rose-600 font-mono">
                      -{del.total_qty}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Badge
                        variant={del.status === 'Done' ? 'success' : del.status === 'Ready' ? 'info' : 'warning'}
                        size="sm"
                      >
                        {del.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Delivery Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Outgoing Delivery Order"
        subtitle="Validate stock reduction and register customer shipment"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Project Site</label>
              <select
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {CUSTOMERS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dispatching Warehouse</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Scheduled Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Line items table */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700">Dispatch Items</label>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Row</span>
              </button>
            </div>

            <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              {items.map((item, idx) => {
                const prod = products.find((p) => p.id === item.product_id);
                const isOutOfStock = prod && prod.current_stock < item.qty;

                return (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex-1">
                      <select
                        value={item.product_id}
                        onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Available: {p.current_stock} {p.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-32 flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleItemChange(idx, 'qty', Math.max(1, parseInt(e.target.value) || 1))}
                        className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded-lg focus:outline-none ${
                          isOutOfStock ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-slate-300'
                        }`}
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
              Total Units to Dispatch: <strong className="text-rose-600 font-bold">{items.reduce((s, i) => s + (parseInt(i.qty) || 0), 0)}</strong>
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
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all"
              >
                Validate & Dispatch Goods
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
