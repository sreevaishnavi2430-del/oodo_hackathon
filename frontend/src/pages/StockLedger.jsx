import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Calendar,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const StockLedger = () => {
  const { ledger, products, loading, showToast } = useInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState('all');

  const productsMap = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [products]);

  const filteredEntries = useMemo(() => {
    return ledger.filter((entry) => {
      const prod = productsMap[entry.product_id];
      const prodName = prod?.name?.toLowerCase() || '';
      const prodSku = prod?.sku?.toLowerCase() || '';
      const ref = entry.reference_id?.toLowerCase() || '';
      const loc = entry.location_id?.toLowerCase() || '';
      const s = searchTerm.toLowerCase();

      const matchesSearch = !s || prodName.includes(s) || prodSku.includes(s) || ref.includes(s) || loc.includes(s);
      const matchesType = selectedType === 'all' || entry.type === selectedType;
      const matchesProduct = selectedProduct === 'all' || entry.product_id === selectedProduct;

      return matchesSearch && matchesType && matchesProduct;
    });
  }, [ledger, productsMap, searchTerm, selectedType, selectedProduct]);

  const handleExportCSV = () => {
    if (filteredEntries.length === 0) return;
    const headers = ["Timestamp", "Reference", "Product Name", "SKU", "Location", "Type", "Change Qty", "Unit"];
    const rows = filteredEntries.map((e) => {
      const prod = productsMap[e.product_id];
      return [
        `"${new Date(e.timestamp).toISOString()}"`,
        `"${e.reference_id}"`,
        `"${prod?.name || 'Unknown'}"`,
        `"${prod?.sku || ''}"`,
        `"${e.location_id}"`,
        `"${e.type}"`,
        e.change_qty,
        `"${prod?.unit || ''}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `stocksense_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Stock Ledger exported successfully to CSV", "success");
  };

  if (loading) {
    return <LoadingSkeleton rows={10} />;
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-slate-800" />
            Stock Ledger (Single Source of Truth)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable audit trail of every receipt, delivery dispatch, warehouse transfer, and physical count adjustment
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={filteredEntries.length === 0}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl shadow-2xs transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Filter and Query Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by reference, product name, SKU, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        {/* Filter by Type */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full md:w-36 py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 capitalize"
          >
            <option value="all">All Types</option>
            <option value="receipt">Receipts</option>
            <option value="delivery">Deliveries</option>
            <option value="transfer">Transfers</option>
            <option value="adjustment">Adjustments</option>
          </select>

          {/* Filter by Product */}
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full md:w-48 py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 truncate"
          >
            <option value="all">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dense Spreadsheet-Style Table */}
      <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm overflow-hidden font-sans">
        {filteredEntries.length === 0 ? (
          <EmptyState
            title="No Matching Ledger Entries"
            description="No movement logs match your selected filter criteria."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearchTerm('');
              setSelectedType('all');
              setSelectedProduct('all');
            }}
          />
        ) : (
          <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200 shadow-2xs">
                <tr>
                  <th className="py-2.5 px-4 border-r border-slate-200">Date & Time</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Ref ID</th>
                  <th className="py-2.5 px-4 border-r border-slate-200">Product</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">SKU</th>
                  <th className="py-2.5 px-4 border-r border-slate-200">Location / Route</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Type</th>
                  <th className="py-2.5 px-4 text-right">Quantity Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredEntries.map((entry) => {
                  const prod = productsMap[entry.product_id];
                  const isPositive = entry.change_qty > 0;
                  const isNegative = entry.change_qty < 0;

                  return (
                    <tr key={entry.id} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="py-2 px-4 text-slate-500 whitespace-nowrap border-r border-slate-100">
                        {new Date(entry.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-800 border-r border-slate-100">
                        {entry.reference_id}
                      </td>
                      <td className="py-2 px-4 font-sans font-medium text-slate-900 truncate max-w-xs border-r border-slate-100">
                        {prod?.name || 'Unknown Item'}
                      </td>
                      <td className="py-2 px-3 text-slate-500 border-r border-slate-100">
                        {prod?.sku || '---'}
                      </td>
                      <td className="py-2 px-4 font-sans text-slate-600 border-r border-slate-100 truncate max-w-xs">
                        {entry.location_id}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-100">
                        <span
                          className={`capitalize inline-block px-1.5 py-0.2 rounded font-sans text-[10px] font-semibold ${
                            entry.type === 'receipt'
                              ? 'bg-emerald-50 text-emerald-700'
                              : entry.type === 'delivery'
                              ? 'bg-rose-50 text-rose-700'
                              : entry.type === 'adjustment'
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-indigo-50 text-indigo-700'
                          }`}
                        >
                          {entry.type}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-right font-bold whitespace-nowrap">
                        <span
                          className={
                            isPositive
                              ? 'text-emerald-600 font-extrabold'
                              : isNegative
                              ? 'text-rose-600 font-extrabold'
                              : 'text-slate-500'
                          }
                        >
                          {isPositive ? `+${entry.change_qty}` : entry.change_qty}
                        </span>{' '}
                        <span className="text-[10px] text-slate-400 font-normal">{prod?.unit}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Showing {filteredEntries.length} of {ledger.length} total transaction events</span>
        <span>Auto-synced with active memory state</span>
      </div>
    </div>
  );
};
