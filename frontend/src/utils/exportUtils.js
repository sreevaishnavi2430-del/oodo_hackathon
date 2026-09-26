import * as XLSX from 'xlsx';

/**
 * Auto-fits column widths for XLSX sheets based on cell contents
 */
function fitColumns(sheet, data) {
  if (!data || data.length === 0) return;
  const keys = Object.keys(data[0]);
  const colWidths = keys.map((key) => {
    let maxLen = key.length;
    data.forEach((row) => {
      const val = row[key] !== null && row[key] !== undefined ? String(row[key]) : '';
      if (val.length > maxLen) maxLen = Math.min(val.length, 50);
    });
    return { wch: Math.max(maxLen + 3, 10) };
  });
  sheet['!cols'] = colWidths;
}

/**
 * Export data array to an Excel (.xlsx) file
 */
export function exportToExcel(data, fileName = 'stocksense_export', sheetName = 'Sheet1') {
  if (!data || data.length === 0) {
    throw new Error('No data available to export');
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  fitColumns(worksheet, data);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));

  const cleanName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(workbook, cleanName);
}

/**
 * Export data array to a CSV (.csv) file
 */
export function exportToCsv(data, fileName = 'stocksense_export') {
  if (!data || data.length === 0) {
    throw new Error('No data available to export');
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  const cleanName = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
  XLSX.writeFile(workbook, cleanName, { bookType: 'csv' });
}

/**
 * Formatter: Products Catalog
 */
export function formatProductsForExport(products = [], atRiskIds = new Set()) {
  return products.map((p) => {
    let status = 'Healthy';
    if (p.current_stock === 0) status = 'Out of Stock';
    else if (atRiskIds.has(p.id)) status = 'At Risk (< 7 Days)';
    else if (p.current_stock <= 25) status = 'Low Stock';

    return {
      'SKU / Code': p.sku,
      'Product Name': p.name,
      'Category': p.category,
      'Current On-Hand Stock': Number(p.current_stock ?? 0),
      'Unit of Measure': p.unit || 'units',
      'Inventory Status': status,
      'Predicted Stockout Date': p.predicted_stockout_date || 'N/A',
      'Suggested Reorder Qty': Number(p.suggested_reorder_qty ?? 50)
    };
  });
}

/**
 * Formatter: Low Stock & At-Risk Items
 */
export function formatAtRiskForExport(products = []) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return products.map((p) => {
    let daysRemaining = 'N/A';
    if (p.predicted_stockout_date) {
      const pred = new Date(p.predicted_stockout_date);
      pred.setHours(0, 0, 0, 0);
      const diffMs = pred.getTime() - today.getTime();
      daysRemaining = Math.max(0, Math.round(diffMs / 86400000));
    }

    return {
      'SKU': p.sku,
      'Product Name': p.name,
      'Category': p.category,
      'Current Stock': Number(p.current_stock ?? 0),
      'Unit': p.unit || 'units',
      'Days Until Stockout': daysRemaining,
      'Predicted Stockout Date': p.predicted_stockout_date || 'N/A',
      'Suggested Reorder Qty': Number(p.suggested_reorder_qty ?? 50),
      'Urgency Level': p.current_stock === 0 ? 'CRITICAL (Depleted)' : 'HIGH (< 7 Days)'
    };
  });
}

/**
 * Formatter: Inbound Receipts
 */
export function formatReceiptsForExport(receipts = []) {
  return receipts.map((r) => ({
    'Receipt Reference': r.reference_id,
    'Date Received': r.date,
    'Supplier / Vendor': r.supplier,
    'Total Units Received': Number(r.total_qty ?? 0),
    'Status': r.status || 'Done',
    'Items Summary': (r.items || []).map((i) => `${i.product_name || i.product_id} (${i.qty} ${i.unit || 'units'})`).join('; ')
  }));
}

/**
 * Formatter: Outbound Deliveries
 */
export function formatDeliveriesForExport(deliveries = []) {
  return deliveries.map((d) => ({
    'Delivery Reference': d.reference_id,
    'Dispatch Date': d.date,
    'Customer / Destination': d.customer,
    'Total Units Dispatched': Number(d.total_qty ?? 0),
    'Status': d.status || 'Done',
    'Items Summary': (d.items || []).map((i) => `${i.product_name || i.product_id} (${i.qty} ${i.unit || 'units'})`).join('; ')
  }));
}

/**
 * Formatter: Stock Transfers
 */
export function formatTransfersForExport(transfers = []) {
  return transfers.map((t) => ({
    'Transfer Reference': t.reference_id,
    'Transfer Date': t.date,
    'Product Name': t.product_name,
    'Quantity Moved': Number(t.qty ?? 0),
    'Unit': t.unit || 'units',
    'From Location': t.from_location,
    'To Location': t.to_location,
    'Status': t.status || 'Done'
  }));
}

/**
 * Formatter: Physical Adjustments
 */
export function formatAdjustmentsForExport(adjustments = []) {
  return adjustments.map((a) => ({
    'Adjustment Reference': a.reference_id,
    'Date of Count': a.date,
    'Product Name': a.product_name,
    'Warehouse Location': a.location,
    'System Expected Qty': Number(a.system_qty ?? 0),
    'Physical Counted Qty': Number(a.counted_qty ?? 0),
    'Variance Delta': Number(a.delta ?? 0),
    'Reason / Notes': a.reason || 'Routine Audit',
    'Anomaly Flag (>30%)': a.anomaly_warning ? 'YES (FLAGGED)' : 'No'
  }));
}

/**
 * Formatter: Stock Ledger Audit Trail
 */
export function formatLedgerForExport(ledger = [], productsMap = {}) {
  return ledger.map((entry) => {
    const prod = productsMap[entry.product_id];
    return {
      'Audit Timestamp': new Date(entry.timestamp).toISOString(),
      'Transaction Reference': entry.reference_id,
      'Product Name': prod?.name || entry.product_name || 'Unknown',
      'SKU': prod?.sku || entry.sku || 'N/A',
      'Location / Route': entry.location_id,
      'Operation Type': (entry.type || '').toUpperCase(),
      'Change Quantity': entry.change_qty > 0 ? `+${entry.change_qty}` : `${entry.change_qty}`,
      'Unit': prod?.unit || entry.unit || 'units'
    };
  });
}
