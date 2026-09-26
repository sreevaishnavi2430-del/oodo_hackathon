import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Database,
  ArrowDownLeft,
  Package,
  Layers,
  Sparkles,
  Info,
  Save,
  Trash2,
  FileCode
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import {
  parseSpreadsheetFile,
  normalizeProductRows,
  normalizeReceiptRows,
  downloadSampleProductTemplate,
  downloadSampleReceiptTemplate
} from '../utils/importUtils';

export const DataHub = () => {
  const {
    products,
    receipts,
    importProducts,
    importReceipts,
    resetToDemoData,
    exportSystemBackup,
    exportSystemBackupExcel,
    importSystemBackup,
    isBackendOnline,
    showToast
  } = useInventory();

  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'receipts' | 'backup' | 'templates'

  // Product Import State
  const [productFile, setProductFile] = useState(null);
  const [parsedProducts, setParsedProducts] = useState([]);
  const [productErrors, setProductErrors] = useState([]);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [isProcessingProducts, setIsProcessingProducts] = useState(false);

  // Receipts Import State
  const [receiptFile, setReceiptFile] = useState(null);
  const [parsedReceipts, setParsedReceipts] = useState([]);
  const [receiptErrors, setReceiptErrors] = useState([]);
  const [isProcessingReceipts, setIsProcessingReceipts] = useState(false);

  // Backup State
  const [isRestoring, setIsRestoring] = useState(false);

  // Handle Product File Upload
  const handleProductFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProductFile(file);
    try {
      const { rawRows } = await parseSpreadsheetFile(file);
      const { validProducts, errors } = normalizeProductRows(rawRows);
      setParsedProducts(validProducts);
      setProductErrors(errors);
      if (validProducts.length > 0) {
        showToast(`Parsed ${validProducts.length} items from ${file.name}`, 'info');
      } else {
        showToast('No valid product rows recognized in file.', 'warning');
      }
    } catch (err) {
      showToast(err.message || 'Failed to parse file.', 'error');
      setParsedProducts([]);
      setProductErrors([err.message]);
    }
  };

  const handleConfirmProductImport = async () => {
    if (parsedProducts.length === 0) return;
    setIsProcessingProducts(true);
    try {
      await importProducts(parsedProducts, replaceExisting);
      setProductFile(null);
      setParsedProducts([]);
      setProductErrors([]);
    } catch (err) {
      showToast(err.message || 'Import failed.', 'error');
    } finally {
      setIsProcessingProducts(false);
    }
  };

  // Handle Receipt File Upload
  const handleReceiptFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setReceiptFile(file);
    try {
      const { rawRows } = await parseSpreadsheetFile(file);
      const { parsedReceipts: receiptsList, errors } = normalizeReceiptRows(rawRows, products);
      setParsedReceipts(receiptsList);
      setReceiptErrors(errors);
      if (receiptsList.length > 0) {
        const totalUnits = receiptsList.reduce((acc, r) => acc + r.total_qty, 0);
        showToast(`Parsed ${receiptsList.length} receipt shipments (${totalUnits} total units)`, 'info');
      } else {
        showToast('No valid receipts parsed.', 'warning');
      }
    } catch (err) {
      showToast(err.message || 'Failed to parse file.', 'error');
      setParsedReceipts([]);
      setReceiptErrors([err.message]);
    }
  };

  const handleConfirmReceiptImport = async () => {
    if (parsedReceipts.length === 0) return;
    setIsProcessingReceipts(true);
    try {
      await importReceipts(parsedReceipts);
      setReceiptFile(null);
      setParsedReceipts([]);
      setReceiptErrors([]);
    } catch (err) {
      showToast(err.message || 'Receipt import failed.', 'error');
    } finally {
      setIsProcessingReceipts(false);
    }
  };

  // Handle System Backup Restore
  const handleBackupFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsRestoring(true);
        const json = JSON.parse(event.target.result);
        await importSystemBackup(json);
      } catch (err) {
        showToast('Invalid JSON backup file or corrupted data.', 'error');
      } finally {
        setIsRestoring(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 lg:p-8 text-white shadow-xl">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-indigo-200 border border-white/10">
            <Database className="w-3.5 h-3.5" />
            <span>Custom Dataset & Document Ingestion</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
            Data Management & Ingestion Hub
          </h1>
          <p className="text-xs lg:text-sm text-indigo-100/80 leading-relaxed">
            Import your own real-world inventory catalogs, supplier delivery packing slips, or receipt spreadsheets.
            StockSense runs live depletion models and AI intelligence directly against <strong>your custom business data</strong>.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={() => {
              if (window.confirm('Reset inventory back to initial demonstration dataset? All custom items will be replaced with demo seeds.')) {
                resetToDemoData();
              }
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold rounded-xl backdrop-blur-sm transition-all shadow-sm"
          >
            <RotateCcw className="w-4 h-4 text-amber-300" />
            <span>Reset Demo Data</span>
          </button>

          <button
            onClick={exportSystemBackup}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Export Full Backup</span>
          </button>
          <button onClick={exportSystemBackupExcel} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"><FileSpreadsheet className="w-4 h-4" /><span>Excel Snapshot</span></button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'products'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Import Inventory Dataset</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
            {products.length} Active
          </span>
        </button>

        <button
          onClick={() => setActiveTab('receipts')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'receipts'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          <span>Import Receipts & Invoices</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
            {receipts.length} Recorded
          </span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'backup'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>System Backup & Restore</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'templates'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
          <span>Download Sample Templates</span>
        </button>
      </div>

      {/* TAB 1: IMPORT PRODUCTS */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Box */}
            <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Upload Product Spreadsheet</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Supports Excel (.xlsx, .xls) and CSV (.csv). Column headers are auto-detected (SKU, Name, Category, Stock, Unit, Reorder Qty).
                </p>
              </div>

              {/* Drag & Drop File Input */}
              <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-2xl cursor-pointer transition-all group">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleProductFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="p-3 bg-indigo-100 group-hover:bg-indigo-200 rounded-xl text-indigo-600 transition-colors mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-800 text-center">
                  {productFile ? productFile.name : 'Select or drop inventory file'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">.xlsx, .xls, or .csv up to 10MB</span>
              </label>

              {/* Ingestion Mode Toggle */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">Catalog Ingestion Strategy:</span>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="radio"
                    name="strategy"
                    checked={!replaceExisting}
                    onChange={() => setReplaceExisting(false)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>
                    <strong>Append / Merge</strong> (Updates matching SKUs, adds new items)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="radio"
                    name="strategy"
                    checked={replaceExisting}
                    onChange={() => setReplaceExisting(true)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-rose-700 font-semibold">
                    <strong>Replace Entire Catalog</strong> (Wipes current demo items)
                  </span>
                </label>
              </div>

              {replaceExisting && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Replacing catalog will reset the active product list and ledger to match your newly uploaded dataset exclusively.
                  </span>
                </div>
              )}

              {/* Sample Template Quick Download */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Need a starting file?</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadSampleProductTemplate('xlsx')}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Sample .xlsx</span>
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={() => downloadSampleProductTemplate('csv')}
                    className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>.csv</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Preview & Confirmation Box */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      Parsed Items Preview
                      {parsedProducts.length > 0 && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                          {parsedProducts.length} Ready
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Verify mapped columns before committing to the live inventory system
                    </p>
                  </div>

                  {parsedProducts.length > 0 && (
                    <button
                      onClick={handleConfirmProductImport}
                      disabled={isProcessingProducts}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isProcessingProducts ? 'Ingesting...' : 'Confirm & Ingest Catalog'}</span>
                    </button>
                  )}
                </div>

                {productErrors.length > 0 && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Notice during parsing:</span>
                    </div>
                    {productErrors.slice(0, 3).map((err, i) => (
                      <div key={i}>• {err}</div>
                    ))}
                  </div>
                )}

                {parsedProducts.length === 0 ? (
                  <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">No file uploaded yet</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                      Choose an Excel or CSV file on the left or download our ready sample template to see preview here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">SKU</th>
                          <th className="py-2.5 px-3">Product Name</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3 text-right">Initial Stock</th>
                          <th className="py-2.5 px-3">Unit</th>
                          <th className="py-2.5 px-3 text-right">Reorder Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedProducts.slice(0, 8).map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 font-semibold">{p.sku}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{p.name}</td>
                            <td className="py-2.5 px-3 text-slate-600">{p.category}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-indigo-600">{p.current_stock}</td>
                            <td className="py-2.5 px-3 text-slate-500">{p.unit}</td>
                            <td className="py-2.5 px-3 text-right text-slate-600">{p.suggested_reorder_qty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedProducts.length > 8 && (
                      <div className="p-2 text-center text-[11px] bg-slate-50 text-slate-500 border-t border-slate-200">
                        + {parsedProducts.length - 8} more items will be ingested
                      </div>
                    )}
                  </div>
                )}
              </div>

              {parsedProducts.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Ingestion will trigger automated AI depletion velocity recalculation and register initial ledger transactions.
                  </span>
                  <button
                    onClick={handleConfirmProductImport}
                    disabled={isProcessingProducts}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isProcessingProducts ? 'Ingesting...' : 'Confirm & Ingest Catalog'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: IMPORT RECEIPTS */}
      {activeTab === 'receipts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Box */}
            <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Upload Inbound Receipts / Invoices</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Upload incoming supplier invoices, delivery manifests, or packing lists.
                  Recognizes Supplier, Date, SKU/Product, Quantity, Unit, and Warehouse Location.
                </p>
              </div>

              <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-emerald-200 hover:border-emerald-400 bg-emerald-50/30 hover:bg-emerald-50/60 rounded-2xl cursor-pointer transition-all group">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleReceiptFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="p-3 bg-emerald-100 group-hover:bg-emerald-200 rounded-xl text-emerald-600 transition-colors mb-3">
                  <ArrowDownLeft className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-800 text-center">
                  {receiptFile ? receiptFile.name : 'Select or drop receipt spreadsheet'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">.xlsx, .xls, or .csv</span>
              </label>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-500" />
                  What happens upon processing:
                </span>
                <p>1. Physical on-hand stock increases immediately for each listed item.</p>
                <p>2. Automatically maps to existing SKUs (or creates new SKU entries if not found).</p>
                <p>3. Writes an immutable audit entry into the Stock Ledger for complete traceability.</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Need a sample invoice file?</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadSampleReceiptTemplate('xlsx')}
                    className="text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sample .xlsx</span>
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={() => downloadSampleReceiptTemplate('csv')}
                    className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>.csv</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Box */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      Parsed Receipts Preview
                      {parsedReceipts.length > 0 && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                          {parsedReceipts.length} Orders Ready
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Review parsed incoming deliveries and items before committing
                    </p>
                  </div>

                  {parsedReceipts.length > 0 && (
                    <button
                      onClick={handleConfirmReceiptImport}
                      disabled={isProcessingReceipts}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isProcessingReceipts ? 'Processing...' : 'Confirm & Process Receipts'}</span>
                    </button>
                  )}
                </div>

                {receiptErrors.length > 0 && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Parsing Notes:</span>
                    </div>
                    {receiptErrors.slice(0, 3).map((err, i) => (
                      <div key={i}>• {err}</div>
                    ))}
                  </div>
                )}

                {parsedReceipts.length === 0 ? (
                  <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <ArrowDownLeft className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">No receipt spreadsheet selected</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                      Drop an inbound shipments spreadsheet to preview and process into physical warehouse stock.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {parsedReceipts.map((rec, rIdx) => (
                      <div key={rIdx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{rec.supplier}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-slate-600">
                              {rec.reference_id}
                            </span>
                            <span className="text-xs text-slate-500">Date: {rec.date}</span>
                          </div>
                          <span className="text-xs font-bold text-emerald-700">
                            +{rec.total_qty} units received
                          </span>
                        </div>

                        <div className="bg-white rounded-lg border border-slate-100 p-2 text-xs divide-y divide-slate-100">
                          {rec.items.map((it, iIdx) => (
                            <div key={iIdx} className="py-1.5 flex items-center justify-between">
                              <span className="font-medium text-slate-800">
                                {it.product_name} <span className="text-slate-400 text-[11px]">({it.sku})</span>
                              </span>
                              <span className="font-bold text-emerald-600">
                                +{it.qty} {it.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {parsedReceipts.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Incoming receipts will instantly update product stock levels and the historical consumption graph.
                  </span>
                  <button
                    onClick={handleConfirmReceiptImport}
                    disabled={isProcessingReceipts}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isProcessingReceipts ? 'Processing...' : 'Confirm & Process Receipts'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Snapshot */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit">
              <Save className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Export Complete System Snapshot</h3>
              <p className="text-xs text-slate-500 mt-1">
                Download a complete, portable JSON backup of your current inventory catalog, stock ledger audit logs,
                receipts, deliveries, transfers, and physical adjustments.
              </p>
            </div>
            <button
              onClick={exportSystemBackup}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download System Snapshot (.json)</span>
            </button>
          </div>

          {/* Restore Snapshot */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Restore System Snapshot</h3>
              <p className="text-xs text-slate-500 mt-1">
                Upload a previously exported StockSense backup file to restore the entire warehouse database instantly.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer transition-all shadow-xs">
              <UploadCloud className="w-4 h-4" />
              <span>{isRestoring ? 'Restoring System...' : 'Select Backup JSON File'}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleBackupFileUpload}
                className="hidden"
                disabled={isRestoring}
              />
            </label>
          </div>
        </div>
      )}

      {/* TAB 4: SAMPLE TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Pre-built Downloadable Templates</h3>
            <p className="text-xs text-slate-500 mt-1">
              Download clean, pre-formatted Excel or CSV templates to easily fill in your own business items and receipts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-600" />
                  Product Catalog Template
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                  Inventory Master
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Includes sample industrial items with SKU, Product Name, Category, Initial Stock, Unit, and Reorder Point.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => downloadSampleProductTemplate('xlsx')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Download .xlsx</span>
                </button>
                <button
                  onClick={() => downloadSampleProductTemplate('csv')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-all"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download .csv</span>
                </button>
              </div>
            </div>

            <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                  Receipts / Inbound Shipments Template
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                  Vendor Orders
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Includes sample supplier orders with Supplier Name, Date, SKU, Product Name, Received Quantity, and Warehouse Location.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => downloadSampleReceiptTemplate('xlsx')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Download .xlsx</span>
                </button>
                <button
                  onClick={() => downloadSampleReceiptTemplate('csv')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-all"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download .csv</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
