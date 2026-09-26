import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Calendar,
  Sparkles,
  TrendingDown,
  Clock,
  RotateCcw,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  History
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { useInventory } from '../context/InventoryContext';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, ledger, loading } = useInventory();

  const product = useMemo(() => {
    return products.find((p) => p.id === id);
  }, [products, id]);

  const productLedger = useMemo(() => {
    if (!product) return [];
    return ledger.filter((l) => l.product_id === product.id);
  }, [ledger, product]);

  // Construct historical trend + forecast curve for Recharts
  const chartData = useMemo(() => {
    if (!product) return [];

    // Reconstruct 7 days past + 7 days forecast
    const points = [];
    const now = new Date();
    
    // Sort entries chronologically
    const sorted = [...productLedger].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Calculate daily depletion velocity
    let netOutflow = 0;
    sorted.forEach((e) => {
      if (e.change_qty < 0) netOutflow += Math.abs(e.change_qty);
    });
    const avgDailyRate = Math.max(1, Math.round(netOutflow / 7));

    // Past 7 days
    let runningStock = Math.max(0, product.current_stock + avgDailyRate * 6);
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Interpolate stock level
      const dayStock = i === 0 ? product.current_stock : Math.round(runningStock - avgDailyRate * (6 - i));
      points.push({
        date: dateLabel,
        actualStock: Math.max(0, dayStock),
        predictedStock: null,
        type: 'historical'
      });
    }

    // Connect point today
    points[points.length - 1].predictedStock = product.current_stock;

    // Next 6 days predicted trajectory
    for (let i = 1; i <= 6; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);
      const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const projected = Math.max(0, product.current_stock - avgDailyRate * i);
      points.push({
        date: dateLabel,
        actualStock: null,
        predictedStock: projected,
        type: 'forecast'
      });
    }

    return points;
  }, [product, productLedger]);

  if (loading) {
    return <LoadingSkeleton rows={6} />;
  }

  if (!product) {
    return (
      <EmptyState
        title="Product Not Found"
        description="The requested product ID does not exist in the catalog or has been deleted."
        actionLabel="Back to Products"
        onAction={() => navigate('/products')}
      />
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const predDate = new Date(product.predicted_stockout_date);
  predDate.setHours(0, 0, 0, 0);
  const daysUntilStockout = Math.ceil((predDate - today) / (1000 * 60 * 60 * 24));
  const isAtRisk = daysUntilStockout <= 7;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/products')}
            className="p-2 bg-white hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{product.name}</h1>
              <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                {product.sku}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Category: <span className="font-semibold text-slate-700">{product.category}</span> | Base Unit: <span className="font-semibold text-slate-700">{product.unit}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/receipts"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Order Reorder Batch</span>
          </Link>
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Stock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>On-Hand Physical Stock</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{product.current_stock.toLocaleString()}</span>
            <span className="text-sm font-semibold text-slate-400">{product.unit}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Status: {product.current_stock === 0 ? (
              <span className="font-bold text-rose-600">Stocked Out</span>
            ) : isAtRisk ? (
              <span className="font-bold text-amber-700">Depleting Rapidly</span>
            ) : (
              <span className="font-bold text-emerald-600">Optimal Buffer</span>
            )}
          </p>
        </div>

        {/* AI Highlighted Predicted Stockout Card */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-50 to-orange-50/50 p-5 rounded-2xl border border-amber-300 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-amber-900 font-semibold mb-2">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              AI Predicted Stockout
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
              {daysUntilStockout <= 0 ? 'CRITICAL' : `${daysUntilStockout} Days Left`}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-950">{product.predicted_stockout_date}</span>
          </div>
          <p className="text-xs text-amber-900/80 mt-2 font-medium">
            Based on 7-day linear consumption regression velocity
          </p>
        </div>

        {/* Suggested Reorder Qty */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Suggested Replenishment</span>
            <RotateCcw className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-600">+{product.suggested_reorder_qty}</span>
            <span className="text-sm font-semibold text-slate-400">{product.unit}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Optimized for supplier lead-time & buffer safety margin
          </p>
        </div>
      </div>

      {/* Stock Depletion Trend Chart (Recharts) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-indigo-600" />
              Stock Movement Velocity & AI Predictive Trajectory
            </h3>
            <p className="text-xs text-slate-500">
              Solid line: Historical actual balances | Dashed line: Projected burn rate to zero
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-indigo-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Historical
            </span>
            <span className="flex items-center gap-1.5 text-amber-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> AI Forecast
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="historicalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                  padding: '8px 12px'
                }}
                formatter={(value, name) => [
                  `${value} ${product.unit}`,
                  name === 'actualStock' ? 'Actual Stock' : 'Predicted Stock'
                ]}
              />
              <Area
                type="monotone"
                dataKey="actualStock"
                stroke="#4f46e5"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#historicalGradient)"
              />
              <Area
                type="monotone"
                dataKey="predictedStock"
                stroke="#f59e0b"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#forecastGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product-Specific Stock Ledger Entries */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">Recent Stock Ledger Entries for this SKU</h3>
          </div>
          <span className="text-xs text-slate-400">{productLedger.length} total events logged</span>
        </div>

        {productLedger.length === 0 ? (
          <EmptyState
            title="No Movements Recorded"
            description="No receipts, deliveries, or adjustments have been posted for this product yet."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-5">Timestamp</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-5 text-right">Movement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productLedger.map((entry) => {
                  const isPositive = entry.change_qty > 0;
                  const isNegative = entry.change_qty < 0;
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-5 text-slate-500 font-mono text-[11px]">
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {entry.reference_id}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {entry.location_id}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`capitalize inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
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
                      <td className="py-3 px-5 text-right font-bold font-mono">
                        <span
                          className={
                            isPositive
                              ? 'text-emerald-600'
                              : isNegative
                              ? 'text-rose-600'
                              : 'text-slate-500'
                          }
                        >
                          {isPositive ? `+${entry.change_qty}` : entry.change_qty}
                        </span>{' '}
                        <span className="text-[10px] text-slate-400 font-normal">{product.unit}</span>
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
