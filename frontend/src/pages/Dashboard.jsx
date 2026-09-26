import React, { useState, useMemo } from 'react';
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
  ArrowRight,
  FileSpreadsheet,
  FileText,
  Database,
  Building2,
  ShoppingCart,
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { useInventory } from '../context/InventoryContext';
import { KpiCard } from '../components/common/KpiCard';
import { KpiDrillDownModal } from '../components/common/KpiDrillDownModal';
import { Badge } from '../components/common/Badge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { NaturalLanguageQueryBox } from '../components/ai/NaturalLanguageQueryBox';
import {
  exportToExcel,
  exportToCsv,
  formatProductsForExport,
  formatAtRiskForExport,
  formatReceiptsForExport,
  formatDeliveriesForExport
} from '../utils/exportUtils';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const Dashboard = () => {
  const { products, receipts, deliveries, ledger, atRiskProducts, loading, showToast } = useInventory();
  const navigate = useNavigate();

  // Drilldown modal state
  const [drillDown, setDrillDown] = useState({
    isOpen: false,
    title: '',
    subtitle: '',
    data: [],
    columns: [],
    exportFormatter: null,
    fileName: 'kpi_export',
    icon: Package,
    onRowClick: null
  });

  // Purchase Order Generation Modal state
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);

  // Calculate filtered sets
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.current_stock > 0 && p.current_stock <= 25);
  }, [products]);

  const outOfStockProducts = useMemo(() => {
    return products.filter((p) => p.current_stock === 0);
  }, [products]);

  const pendingReceipts = useMemo(() => {
    return receipts.filter((r) => r.status === 'Waiting');
  }, [receipts]);

  const pendingDeliveries = useMemo(() => {
    return deliveries.filter((d) => d.status === 'Waiting' || d.status === 'Ready');
  }, [deliveries]);

  const atRiskIds = useMemo(() => new Set(atRiskProducts.map((p) => p.id)), [atRiskProducts]);

  // Visual Category Distribution for Recharts
  const categoryData = useMemo(() => {
    const counts = products.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + Number(p.current_stock || 0);
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [products]);

  // Floor Velocity Trend (Inflow vs Outflow by Day)
  const velocityData = useMemo(() => {
    const daysMap = {};
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const key = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      daysMap[key] = { day: key, inbound: 0, outbound: 0, net: 0 };
    }

    ledger.forEach((entry) => {
      const d = new Date(entry.timestamp);
      const key = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      if (daysMap[key]) {
        if (entry.change_qty > 0) {
          daysMap[key].inbound += entry.change_qty;
        } else if (entry.change_qty < 0) {
          daysMap[key].outbound += Math.abs(entry.change_qty);
        }
      }
    });

    return Object.values(daysMap).map((item) => ({
      ...item,
      net: item.inbound - item.outbound
    }));
  }, [ledger]);

  // Location Allocation
  const locationStats = useMemo(() => {
    const locMap = { 'Main Warehouse': 0, 'Production Floor': 0, 'Warehouse 2': 0 };
    ledger.forEach((entry) => {
      const loc = entry.location_id || 'Main Warehouse';
      if (loc.includes('Production')) locMap['Production Floor'] += Math.abs(entry.change_qty);
      else if (loc.includes('Warehouse 2')) locMap['Warehouse 2'] += Math.abs(entry.change_qty);
      else locMap['Main Warehouse'] += Math.abs(entry.change_qty);
    });
    const totalMoves = Object.values(locMap).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(locMap).map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / totalMoves) * 100)
    }));
  }, [ledger]);

  const recentMovements = useMemo(() => ledger.slice(0, 6), [ledger]);

  // Product columns config for Drill-down modal
  const productColumns = [
    { key: 'sku', label: 'SKU / Code' },
    { key: 'name', label: 'Product Name' },
    { key: 'category', label: 'Category' },
    {
      key: 'current_stock',
      label: 'On-Hand Stock',
      align: 'right',
      render: (v, item) => (
        <span className={`font-bold ${v === 0 ? 'text-rose-600' : v <= 25 ? 'text-amber-600' : 'text-emerald-700'}`}>
          {v} {item.unit}
        </span>
      )
    },
    { key: 'predicted_stockout_date', label: 'Predicted Stockout' },
    { key: 'suggested_reorder_qty', label: 'Reorder Qty', align: 'right' }
  ];

  // Receipts columns
  const receiptColumns = [
    { key: 'reference_id', label: 'Reference' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'date', label: 'Date' },
    {
      key: 'total_qty',
      label: 'Units Received',
      align: 'right',
      render: (v) => <span className="font-bold text-emerald-600">+{v} units</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => <Badge variant={v === 'Done' ? 'success' : 'warning'}>{v}</Badge>
    }
  ];

  // Deliveries columns
  const deliveryColumns = [
    { key: 'reference_id', label: 'Reference' },
    { key: 'customer', label: 'Customer' },
    { key: 'date', label: 'Date' },
    {
      key: 'total_qty',
      label: 'Units Dispatched',
      align: 'right',
      render: (v) => <span className="font-bold text-rose-600">-{v} units</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => <Badge variant={v === 'Done' ? 'success' : 'warning'}>{v}</Badge>
    }
  ];

  // KPI Handlers with direct Excel/CSV download capability
  const openProductsDrillDown = () => {
    setDrillDown({
      isOpen: true,
      title: 'Total Active Products Catalog',
      subtitle: 'Complete breakdown of all monitored SKUs across warehouses',
      data: products,
      columns: productColumns,
      exportFormatter: (data) => formatProductsForExport(data, atRiskIds),
      fileName: 'stocksense_products_catalog',
      icon: Package,
      onRowClick: (p) => navigate(`/products/${p.id}`)
    });
  };

  const openLowStockDrillDown = () => {
    setDrillDown({
      isOpen: true,
      title: 'Low Stock Inventory Alert',
      subtitle: 'Items currently below standard 25 unit safety threshold',
      data: lowStockProducts,
      columns: productColumns,
      exportFormatter: (data) => formatProductsForExport(data, atRiskIds),
      fileName: 'stocksense_low_stock_items',
      icon: AlertTriangle,
      onRowClick: (p) => navigate(`/products/${p.id}`)
    });
  };

  const openOutOfStockDrillDown = () => {
    setDrillDown({
      isOpen: true,
      title: 'Out of Stock SKUs (Zero Balance)',
      subtitle: 'Critical stockouts requiring immediate purchase order placement',
      data: outOfStockProducts,
      columns: productColumns,
      exportFormatter: (data) => formatProductsForExport(data, atRiskIds),
      fileName: 'stocksense_out_of_stock_items',
      icon: XCircle,
      onRowClick: (p) => navigate(`/products/${p.id}`)
    });
  };

  const openReceiptsDrillDown = () => {
    setDrillDown({
      isOpen: true,
      title: 'Inbound Supplier Receipts',
      subtitle: 'Verified vendor shipments and incoming delivery manifests',
      data: receipts,
      columns: receiptColumns,
      exportFormatter: formatReceiptsForExport,
      fileName: 'stocksense_inbound_receipts',
      icon: ArrowDownLeft,
      onRowClick: () => navigate('/receipts')
    });
  };

  const openDeliveriesDrillDown = () => {
    setDrillDown({
      isOpen: true,
      title: 'Outbound Customer Deliveries',
      subtitle: 'Dispatched sales orders and customer shipments',
      data: deliveries,
      columns: deliveryColumns,
      exportFormatter: formatDeliveriesForExport,
      fileName: 'stocksense_outbound_deliveries',
      icon: ArrowUpRight,
      onRowClick: () => navigate('/deliveries')
    });
  };

  const openAtRiskDrillDown = () => {
    setDrillDown({
      isOpen: true,
      title: 'AI Predicted Stockout Items (< 7 Days)',
      subtitle: 'Linear regression consumption models detect imminent zero-stock intercept',
      data: atRiskProducts,
      columns: productColumns,
      exportFormatter: formatAtRiskForExport,
      fileName: 'stocksense_ai_at_risk_stockouts',
      icon: TrendingDown,
      onRowClick: (p) => navigate(`/products/${p.id}`)
    });
  };

  // Instant KPI direct download trigger
  const handleKpiDirectDownload = (type, format) => {
    const dateStr = new Date().toISOString().split('T')[0];
    let dataToExport = [];
    let fileName = '';

    switch (type) {
      case 'total':
        dataToExport = formatProductsForExport(products, atRiskIds);
        fileName = `stocksense_all_products_${dateStr}`;
        break;
      case 'low':
        dataToExport = formatProductsForExport(lowStockProducts, atRiskIds);
        fileName = `stocksense_low_stock_${dateStr}`;
        break;
      case 'out':
        dataToExport = formatProductsForExport(outOfStockProducts, atRiskIds);
        fileName = `stocksense_out_of_stock_${dateStr}`;
        break;
      case 'receipts':
        dataToExport = formatReceiptsForExport(receipts);
        fileName = `stocksense_receipts_${dateStr}`;
        break;
      case 'deliveries':
        dataToExport = formatDeliveriesForExport(deliveries);
        fileName = `stocksense_deliveries_${dateStr}`;
        break;
      case 'at_risk':
        dataToExport = formatAtRiskForExport(atRiskProducts);
        fileName = `stocksense_ai_stockout_risk_${dateStr}`;
        break;
      default:
        return;
    }

    if (dataToExport.length === 0) {
      showToast(`No records available to export for this metric.`, 'info');
      return;
    }

    if (format === 'xlsx') {
      exportToExcel(dataToExport, fileName, 'KPI Data');
      showToast(`Exported ${fileName}.xlsx successfully!`, 'success');
    } else {
      exportToCsv(dataToExport, fileName);
      showToast(`Exported ${fileName}.csv successfully!`, 'success');
    }
  };

  // Purchase Order Generation Action
  const handleExportPurchaseOrder = (format) => {
    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const dateStr = new Date().toISOString().split('T')[0];
    const poRows = atRiskProducts.map((p, idx) => ({
      'PO Number': poNumber,
      'Order Date': dateStr,
      'Line #': idx + 1,
      'SKU': p.sku,
      'Item Description': p.name,
      'Category': p.category,
      'Current On Hand': p.current_stock,
      'Order Quantity': p.suggested_reorder_qty,
      'Unit': p.unit,
      'Target Delivery Warehouse': 'Main Warehouse',
      'Urgency': p.current_stock === 0 ? 'CRITICAL / ASAP' : 'HIGH (< 7 Days)'
    }));

    if (poRows.length === 0) {
      showToast('No at-risk items to generate a purchase order for!', 'info');
      return;
    }

    if (format === 'xlsx') {
      exportToExcel(poRows, `${poNumber}_Replenishment_Order`, 'Purchase Order');
      showToast(`Purchase Order ${poNumber}.xlsx generated!`, 'success');
    } else {
      exportToCsv(poRows, `${poNumber}_Replenishment_Order`);
      showToast(`Purchase Order ${poNumber}.csv generated!`, 'success');
    }
    setIsPoModalOpen(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="cards" />
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            Inventory Operations Command
            <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Telemetry
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time stock ledger synchronization, granular Excel/CSV exports, and automated predictive depletion models
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
            to="/data-hub"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-xl shadow-xs transition-all"
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Import Dataset</span>
          </Link>

          {atRiskProducts.length > 0 && (
            <button
              onClick={() => setIsPoModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-all animate-pulse"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Auto PO ({atRiskProducts.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* 6 KPI Cards Grid (Each equipped with integrated Excel/CSV download & Drilldown) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Total Products */}
        <KpiCard
          title="Total Products"
          value={products.length}
          subtitle="Monitored active SKUs"
          icon={Package}
          onClick={openProductsDrillDown}
          onExport={(fmt) => handleKpiDirectDownload('total', fmt)}
        />

        {/* 2. Low Stock Items */}
        <KpiCard
          title="Low Stock Items"
          value={lowStockProducts.length}
          subtitle="Under safe threshold"
          icon={AlertTriangle}
          badgeText={lowStockProducts.length > 0 ? 'Warning' : 'Optimal'}
          onClick={openLowStockDrillDown}
          onExport={(fmt) => handleKpiDirectDownload('low', fmt)}
        />

        {/* 3. Out of Stock Items */}
        <KpiCard
          title="Out of Stock Items"
          value={outOfStockProducts.length}
          subtitle="Zero balance inventory"
          icon={XCircle}
          badgeText={outOfStockProducts.length > 0 ? 'Critical' : 'None'}
          onClick={openOutOfStockDrillDown}
          onExport={(fmt) => handleKpiDirectDownload('out', fmt)}
        />

        {/* 4. Inbound Receipts */}
        <KpiCard
          title="Inbound Receipts"
          value={receipts.length}
          subtitle="Recorded shipments"
          icon={ArrowDownLeft}
          onClick={openReceiptsDrillDown}
          onExport={(fmt) => handleKpiDirectDownload('receipts', fmt)}
        />

        {/* 5. Customer Deliveries */}
        <KpiCard
          title="Customer Deliveries"
          value={deliveries.length}
          subtitle="Dispatched orders"
          icon={ArrowUpRight}
          onClick={openDeliveriesDrillDown}
          onExport={(fmt) => handleKpiDirectDownload('deliveries', fmt)}
        />

        {/* 6. AI DIFFERENTIATOR: Products at Risk of Stockout (< 7 Days) */}
        <KpiCard
          title="Products at Risk (7 Days)"
          value={atRiskProducts.length}
          subtitle="Depletes before safety lead"
          icon={TrendingDown}
          badgeText="High Urgency"
          isAiRisk={true}
          onClick={openAtRiskDrillDown}
          onExport={(fmt) => handleKpiDirectDownload('at_risk', fmt)}
        />
      </div>

      {/* AI Natural Language Query Box */}
      <div className="w-full">
        <NaturalLanguageQueryBox />
      </div>

      {/* High-Visual Charts Grid (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recharts Warehouse Velocity Flow */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Floor Movement Velocity
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  Last 7 Days Flow
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparison of received incoming stock vs dispatched outbound customer deliveries
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 inline-block"></span>
                Inbound Received
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block"></span>
                Outbound Sent
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={velocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="outboundGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '11px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)'
                  }}
                  formatter={(val, name) => [
                    `${val} units`,
                    name === 'inbound' ? 'Inbound Received' : 'Outbound Dispatched'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="inbound"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#inboundGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="outbound"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#outboundGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Recharts Category Inventory Volume Breakdown */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Stock Volume by Category</h2>
              <p className="text-xs text-slate-500 mt-0.5">Physical distribution of on-hand units</p>
            </div>
            <Package className="w-4 h-4 text-indigo-500" />
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData.slice(0, 5)} layout="vertical" margin={{ top: 0, right: 20, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#334155' }} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '11px',
                    border: 'none'
                  }}
                  formatter={(val) => [`${val} units`, 'Stock']}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]}>
                  {categoryData.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Location Breakdown Footer */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
              Warehouse Facility Allocation
            </span>
            <div className="space-y-1.5">
              {locationStats.map((loc) => (
                <div key={loc.name} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {loc.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-600" style={{ width: `${loc.pct}%` }} />
                    </div>
                    <span className="font-bold text-slate-900 text-[11px] w-8 text-right">{loc.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Ledger Audit Trail */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Floor Operations</h2>
            <p className="text-xs text-slate-500 mt-0.5">Latest immutable entries committed to the Stock Ledger</p>
          </div>
          <Link
            to="/ledger"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Open Audit Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recentMovements.map((movement) => (
            <div key={movement.id} className="flex items-center justify-between px-5 py-3 text-xs hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <span
                  className={`p-1.5 rounded-lg ${
                    movement.change_qty > 0
                      ? 'bg-emerald-50 text-emerald-700'
                      : movement.change_qty < 0
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-indigo-50 text-indigo-700'
                  }`}
                >
                  {movement.change_qty > 0 ? (
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                  ) : movement.change_qty < 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <Layers className="w-3.5 h-3.5" />
                  )}
                </span>
                <div>
                  <span className="font-semibold text-slate-800 capitalize mr-2">{movement.type}</span>
                  <span className="font-mono text-[11px] text-slate-400">{movement.reference_id}</span>
                  <span className="text-slate-400 mx-1.5">•</span>
                  <span className="text-slate-500 text-[11px]">{movement.location_id}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`font-mono font-bold text-xs ${
                    movement.change_qty > 0
                      ? 'text-emerald-600'
                      : movement.change_qty < 0
                      ? 'text-rose-600'
                      : 'text-slate-500'
                  }`}
                >
                  {movement.change_qty > 0 ? `+${movement.change_qty}` : `${movement.change_qty}`}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(movement.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Products at Risk Table (AI Differentiator Core View) with Manual Export */}
      <div id="at-risk-table" className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-slate-100 gap-3 bg-gradient-to-r from-amber-50/60 via-white to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs">
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

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Export for At-Risk Table */}
            <button
              onClick={() => handleKpiDirectDownload('at_risk', 'xlsx')}
              disabled={atRiskProducts.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all disabled:opacity-50"
              title="Download At-Risk SKUs in Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={() => handleKpiDirectDownload('at_risk', 'csv')}
              disabled={atRiskProducts.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all disabled:opacity-50"
              title="Download At-Risk SKUs in CSV"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            {atRiskProducts.length > 0 && (
              <button
                onClick={() => setIsPoModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-2xs transition-all"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Create Purchase Order</span>
              </button>
            )}
          </div>
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
                      <td className="py-3.5 px-4 text-slate-600">{product.category}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`font-bold inline-flex items-center gap-1 ${
                            isCritical ? 'text-rose-600' : 'text-amber-700'
                          }`}
                        >
                          {isCritical && <XCircle className="w-3.5 h-3.5" />}
                          {product.current_stock} {product.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[11px]">
                          {product.predicted_stockout_date}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                        +{product.suggested_reorder_qty} {product.unit}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <span className="inline-flex items-center gap-1 text-indigo-600 group-hover:text-indigo-800 font-semibold text-[11px]">
                          Analyze Curve <ExternalLink className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drill-down Modal */}
      <KpiDrillDownModal
        isOpen={drillDown.isOpen}
        onClose={() => setDrillDown((prev) => ({ ...prev, isOpen: false }))}
        title={drillDown.title}
        subtitle={drillDown.subtitle}
        data={drillDown.data}
        columns={drillDown.columns}
        exportFormatter={drillDown.exportFormatter}
        fileName={drillDown.fileName}
        icon={drillDown.icon}
        onRowClick={drillDown.onRowClick}
      />

      {/* Purchase Order Modal */}
      {isPoModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 text-white rounded-xl">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Automated Purchase Order Generator
                  </h3>
                  <p className="text-xs text-slate-500">
                    Calculated for {atRiskProducts.length} items projected to deplete in &lt; 7 days
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3 text-right">Current</th>
                      <th className="py-2.5 px-3 text-right">Recommended PO Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {atRiskProducts.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{p.sku}</td>
                        <td className="py-2 px-3 font-bold text-slate-800">{p.name}</td>
                        <td className="py-2 px-3 text-right text-rose-600 font-bold">{p.current_stock}</td>
                        <td className="py-2 px-3 text-right text-emerald-700 font-bold">
                          +{p.suggested_reorder_qty} {p.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                <span>Select format to generate official vendor purchase order:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportPurchaseOrder('xlsx')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs transition-all"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Download PO (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => handleExportPurchaseOrder('csv')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-xs transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Download PO (.csv)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
