import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  XCircle,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  Sparkles,
  ExternalLink,
  PlusCircle,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { KpiCard } from '../components/common/KpiCard';
import { Badge } from '../components/common/Badge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { NaturalLanguageQueryBox } from '../components/ai/NaturalLanguageQueryBox';

export const Dashboard = () => {
  const { products, receipts, deliveries, ledger, atRiskProducts, loading } = useInventory();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="cards" />
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  // Calculate KPIs
  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => p.current_stock > 0 && p.current_stock <= 25);
  const outOfStockProducts = products.filter((p) => p.current_stock === 0);
  const pendingReceipts = receipts.filter((r) => r.status === 'Waiting').length;
  const pendingDeliveries = deliveries.filter((d) => d.status === 'Waiting' || d.status === 'Ready').length;
  const categoryStats = Object.entries(products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + Number(product.current_stock || 0);
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCategoryStock = Math.max(...categoryStats.map(([, value]) => value), 1);
  const recentMovements = ledger.slice(0, 6);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            Inventory Operations Command
            <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
              Live Real-Time
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time stock ledger synchronization and automated predictive depletion models
          </p>
        </div>

        {/* Quick Operations Button Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/receipts"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Receive Stock</span>
          </Link>
          <Link
            to="/deliveries"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Dispatch Delivery</span>
          </Link>
          <Link
            to="/adjustments"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl shadow-xs transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Cycle Count</span>
          </Link>
        </div>
      </div>

      {/* 6 KPI Cards Grid (5 Standard + 1 Distinct AI Differentiator) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Total Products */}
        <KpiCard
          title="Total Products"
          value={totalProducts}
          subtitle="Monitored active SKUs"
          icon={Package}
          onClick={() => navigate('/products')}
        />

        {/* 2. Low Stock Items */}
        <KpiCard
          title="Low Stock Items"
          value={lowStockProducts.length}
          subtitle="Units under safe threshold"
          icon={AlertTriangle}
          badgeText={lowStockProducts.length > 0 ? "Warning" : "Optimal"}
          onClick={() => navigate('/products')}
        />

        {/* 3. Out of Stock Items */}
        <KpiCard
          title="Out of Stock Items"
          value={outOfStockProducts.length}
          subtitle="Zero balance inventory"
          icon={XCircle}
          badgeText={outOfStockProducts.length > 0 ? "Critical" : "None"}
          onClick={() => navigate('/products')}
        />

        {/* 4. Pending Receipts */}
        <KpiCard
          title="Pending Receipts"
          value={pendingReceipts}
          subtitle="Inbound vendor shipments"
          icon={ArrowDownLeft}
          onClick={() => navigate('/receipts')}
        />

        {/* 5. Pending Deliveries */}
        <KpiCard
          title="Pending Deliveries"
          value={pendingDeliveries}
          subtitle="Awaiting dispatch/pack"
          icon={ArrowUpRight}
          onClick={() => navigate('/deliveries')}
        />

        {/* 6. AI DIFFERENTIATOR CARD: Products at Risk of Stockout (7 days) */}
        <KpiCard
          title="Products at Risk (7 Days)"
          value={atRiskProducts.length}
          subtitle="Depletes before reorder"
          icon={TrendingDown}
          badgeText="High Urgency"
          isAiRisk={true}
          onClick={() => {
            const tableElem = document.getElementById('at-risk-table');
            if (tableElem) tableElem.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      </div>

      {/* AI Natural Language Query Box */}
      <div className="w-full">
        <NaturalLanguageQueryBox />
      </div>

      {/* Visual stock overview */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div><h2 className="text-sm font-bold text-slate-900">Stock by Category</h2><p className="text-xs text-slate-500 mt-1">Current on-hand inventory volume</p></div>
            <Package className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="space-y-4">
            {categoryStats.map(([category, value]) => (
              <div key={category}>
                <div className="flex justify-between text-xs mb-1.5"><span className="font-medium text-slate-700">{category}</span><span className="font-bold text-slate-900">{value.toLocaleString()}</span></div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" style={{ width: `${Math.max(4, value / maxCategoryStock * 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900">Inventory Health</h2><p className="text-xs text-slate-500 mt-1 mb-5">Live product distribution</p>
          <div className="flex items-center gap-5">
            <div className="relative w-28 h-28 rounded-full" style={{ background: `conic-gradient(#f43f5e ${outOfStockProducts.length / Math.max(totalProducts, 1) * 100}%, #f59e0b 0 ${lowStockProducts.length / Math.max(totalProducts, 1) * 100 + outOfStockProducts.length / Math.max(totalProducts, 1) * 100}%, #10b981 0)` }}><div className="absolute inset-3 rounded-full bg-white flex flex-col items-center justify-center"><span className="text-2xl font-black text-slate-900">{totalProducts}</span><span className="text-[10px] text-slate-500">SKUs</span></div></div>
            <div className="space-y-3 text-xs"><div><span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2" />Healthy <b>{Math.max(0, totalProducts - lowStockProducts.length - outOfStockProducts.length)}</b></div><div><span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-2" />Low stock <b>{lowStockProducts.length}</b></div><div><span className="inline-block w-2 h-2 rounded-full bg-rose-500 mr-2" />Out of stock <b>{outOfStockProducts.length}</b></div></div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"><div className="p-5 border-b border-slate-100"><h2 className="text-sm font-bold text-slate-900">Recent Stock Movement</h2><p className="text-xs text-slate-500 mt-1">Latest events from the immutable ledger</p></div><div className="divide-y divide-slate-100">{recentMovements.map((movement) => <div key={movement.id} className="flex items-center justify-between px-5 py-3 text-xs"><div><span className="font-semibold text-slate-800 capitalize">{movement.type}</span><span className="text-slate-400 ml-2">{movement.reference_id}</span></div><span className={movement.change_qty > 0 ? 'font-bold text-emerald-600' : movement.change_qty < 0 ? 'font-bold text-rose-600' : 'text-slate-500'}>{movement.change_qty > 0 ? '+' : ''}{movement.change_qty}</span></div>)}</div></div>

      {/* Products at Risk Table (AI Differentiator Core View) */}
      <div id="at-risk-table" className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-slate-100 gap-3 bg-gradient-to-r from-amber-50/50 via-white to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Products at Risk of Stockout (&lt; 7 Days)
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  {atRiskProducts.length} Identified
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                AI consumption velocity model detects run-out before safety lead-time expires
              </p>
            </div>
          </div>
          <Link
            to="/products"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 self-start sm:self-center"
          >
            <span>View All Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {atRiskProducts.length === 0 ? (
          <EmptyState
            title="No At-Risk Inventory Found"
            description="The predictive burn rate engine confirms all current stock levels exceed the 7-day depletion threshold."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-5">Product Name</th>
                  <th className="py-3 px-4">SKU / Code</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Current Stock</th>
                  <th className="py-3 px-4">Predicted Stockout</th>
                  <th className="py-3 px-4 text-right">Suggested Reorder</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {atRiskProducts.map((product) => {
                  const isCritical = product.current_stock === 0;
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-amber-50/30 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      <td className="py-3.5 px-5 font-semibold text-slate-900 group-hover:text-indigo-600">
                        {product.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {product.sku}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {product.category}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`font-bold ${
                            isCritical ? 'text-rose-600 font-extrabold' : 'text-slate-900'
                          }`}
                        >
                          {product.current_stock}
                        </span>{' '}
                        <span className="text-[11px] text-slate-400 font-normal">{product.unit}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100/80 text-amber-900 border border-amber-300 font-semibold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span>
                          <span>{product.predicted_stockout_date}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-indigo-700">
                        +{product.suggested_reorder_qty} <span className="text-[11px] text-slate-400 font-normal">{product.unit}</span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/products/${product.id}`);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg text-xs font-semibold shadow-2xs transition-all"
                        >
                          <span>Analyze</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
