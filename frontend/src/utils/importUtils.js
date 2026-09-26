import * as XLSX from 'xlsx';
import { exportToExcel, exportToCsv } from './exportUtils';

/**
 * Reads any Excel (.xlsx, .xls) or CSV (.csv) File into JSON rows
 */
export async function parseSpreadsheetFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target.result;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('The uploaded file does not contain any sheets.');
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          throw new Error('The spreadsheet appears to be empty. Please check the file.');
        }

        const headers = Object.keys(rawRows[0] || {});
        resolve({ rawRows, headers, sheetNames: workbook.SheetNames });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file from disk.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Normalizes an arbitrary header string for fuzzy matching
 */
function cleanKey(str = '') {
  return String(str).toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Finds the value from a row using alias matches
 */
function extractValue(row, aliases) {
  const rowKeys = Object.keys(row);
  for (const alias of aliases) {
    const target = cleanKey(alias);
    const matchedKey = rowKeys.find((k) => cleanKey(k) === target);
    if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== '') {
      return row[matchedKey];
    }
  }
  return undefined;
}

/**
 * Map raw rows to validated Product objects
 */
export function normalizeProductRows(rawRows) {
  const validProducts = [];
  const errors = [];

  rawRows.forEach((row, index) => {
    const rowNum = index + 2; // account for header line

    const name = extractValue(row, ['name', 'product name', 'item', 'item name', 'description', 'title', 'product']);
    const sku = extractValue(row, ['sku', 'code', 'item code', 'product code', 'part number', 'barcode', 'id']);
    const category = extractValue(row, ['category', 'group', 'type', 'classification', 'department']) || 'General';
    const currentStockRaw = extractValue(row, ['current stock', 'stock', 'qty', 'quantity', 'on hand', 'current_stock', 'inventory', 'balance']);
    const unit = extractValue(row, ['unit', 'uom', 'measure', 'unit of measure']) || 'units';
    const reorderRaw = extractValue(row, ['reorder', 'reorder qty', 'min stock', 'safety stock', 'suggested_reorder_qty', 'reorder level']) || 50;

    if (!name && !sku) {
      errors.push(`Row ${rowNum}: Skipped because neither Product Name nor SKU could be detected.`);
      return;
    }

    const current_stock = Number(currentStockRaw);
    const safeStock = isNaN(current_stock) ? 0 : Math.max(0, current_stock);
    const safeReorder = Number(reorderRaw) || 50;
    const finalSku = String(sku || `SKU-${Date.now().toString().slice(-4)}-${index + 1}`).trim();
    const finalName = String(name || `Item ${finalSku}`).trim();

    validProducts.push({
      id: `prod-imp-${Date.now()}-${index}`,
      name: finalName,
      sku: finalSku,
      category: String(category).trim(),
      unit: String(unit).trim().toLowerCase(),
      current_stock: safeStock,
      suggested_reorder_qty: safeReorder
    });
  });

  return { validProducts, errors };
}

/**
 * Map raw rows to validated Receipt orders
 */
export function normalizeReceiptRows(rawRows, existingProducts = []) {
  const errors = [];
  const groups = {};

  rawRows.forEach((row, index) => {
    const rowNum = index + 2;

    const supplier = extractValue(row, ['supplier', 'vendor', 'from', 'company', 'source']) || 'Direct Supplier';
    const dateRaw = extractValue(row, ['date', 'receipt date', 'delivery date', 'timestamp']);
    const sku = extractValue(row, ['sku', 'code', 'item code', 'part number', 'product sku']);
    const productName = extractValue(row, ['product', 'product name', 'item', 'item name', 'description']);
    const qtyRaw = extractValue(row, ['qty', 'quantity', 'received qty', 'units', 'count', 'amount']);
    const location = extractValue(row, ['location', 'warehouse', 'destination', 'dest location']) || 'Main Warehouse';
    const unit = extractValue(row, ['unit', 'uom']) || 'units';

    const qty = Number(qtyRaw);
    if (!qtyRaw || isNaN(qty) || qty <= 0) {
      errors.push(`Row ${rowNum}: Invalid quantity "${qtyRaw}". Must be a positive number.`);
      return;
    }

    if (!sku && !productName) {
      errors.push(`Row ${rowNum}: Missing product identifier (SKU or Name).`);
      return;
    }

    // Attempt to match with existing product
    let matchedProd = existingProducts.find(
      (p) =>
        (sku && p.sku.toLowerCase() === String(sku).toLowerCase().trim()) ||
        (productName && p.name.toLowerCase() === String(productName).toLowerCase().trim())
    );

    const safeSku = String(sku || (matchedProd ? matchedProd.sku : `SKU-${index + 1}`)).trim();
    const safeName = String(productName || (matchedProd ? matchedProd.name : `Product ${safeSku}`)).trim();

    // Group by supplier and date
    let dateStr = new Date().toISOString().split('T')[0];
    if (dateRaw) {
      const parsed = new Date(dateRaw);
      if (!isNaN(parsed.getTime())) {
        dateStr = parsed.toISOString().split('T')[0];
      }
    }

    const groupKey = `${supplier}_${dateStr}_${location}`;
    if (!groups[groupKey]) {
      groups[groupKey] = {
        supplier: String(supplier).trim(),
        date: dateStr,
        location_id: String(location).trim(),
        items: []
      };
    }

    groups[groupKey].items.push({
      product_id: matchedProd ? matchedProd.id : null,
      sku: safeSku,
      product_name: safeName,
      qty: Math.round(qty),
      unit: String(unit || (matchedProd ? matchedProd.unit : 'units')).trim()
    });
  });

  const parsedReceipts = Object.values(groups).map((group, gIdx) => ({
    id: `rec-imp-${Date.now()}-${gIdx}`,
    reference_id: `REC-IMP-${Date.now().toString().slice(-4)}${gIdx + 1}`,
    supplier: group.supplier,
    date: group.date,
    location_id: group.location_id,
    status: 'Done',
    items: group.items,
    total_qty: group.items.reduce((sum, item) => sum + item.qty, 0)
  }));

  return { parsedReceipts, errors };
}

/**
 * Downloads a sample Excel or CSV template for Products
 */
export function downloadSampleProductTemplate(format = 'xlsx') {
  const sampleData = [
    {
      'SKU': 'STL-ROD-16',
      'Product Name': 'High Tensile Steel Rebar 16mm',
      'Category': 'Raw Materials',
      'Current Stock': 120,
      'Unit': 'kg',
      'Suggested Reorder Qty': 40
    },
    {
      'SKU': 'CEM-OPC-53',
      'Product Name': 'UltraTech Cement 50kg Bags',
      'Category': 'Raw Materials',
      'Current Stock': 45,
      'Unit': 'bags',
      'Suggested Reorder Qty': 25
    },
    {
      'SKU': 'CU-WIRE-4',
      'Product Name': 'Industrial Copper Cable 4 sq mm',
      'Category': 'Electrical',
      'Current Stock': 300,
      'Unit': 'meters',
      'Suggested Reorder Qty': 80
    },
    {
      'SKU': 'SAFETY-HLM-YEL',
      'Product Name': 'Industrial Safety Helmets (Yellow)',
      'Category': 'Safety & PPE',
      'Current Stock': 15,
      'Unit': 'units',
      'Suggested Reorder Qty': 30
    },
    {
      'SKU': 'HYD-OIL-68',
      'Product Name': 'Hydraulic Fluid ISO VG 68',
      'Category': 'Consumables',
      'Current Stock': 8,
      'Unit': 'drums',
      'Suggested Reorder Qty': 12
    }
  ];

  if (format === 'xlsx') {
    exportToExcel(sampleData, 'stocksense_products_sample_template', 'Products');
  } else {
    exportToCsv(sampleData, 'stocksense_products_sample_template');
  }
}

/**
 * Downloads a sample Excel or CSV template for Receipts
 */
export function downloadSampleReceiptTemplate(format = 'xlsx') {
  const sampleData = [
    {
      'Supplier': 'Apex Metals & Alloys Corp',
      'Receipt Date': new Date().toISOString().split('T')[0],
      'SKU': 'STL-ROD-16',
      'Product Name': 'High Tensile Steel Rebar 16mm',
      'Quantity': 80,
      'Unit': 'kg',
      'Location': 'Main Warehouse'
    },
    {
      'Supplier': 'Apex Metals & Alloys Corp',
      'Receipt Date': new Date().toISOString().split('T')[0],
      'SKU': 'CU-WIRE-4',
      'Product Name': 'Industrial Copper Cable 4 sq mm',
      'Quantity': 150,
      'Unit': 'meters',
      'Location': 'Main Warehouse'
    },
    {
      'Supplier': 'National Safety Gear Ltd',
      'Receipt Date': new Date().toISOString().split('T')[0],
      'SKU': 'SAFETY-HLM-YEL',
      'Product Name': 'Industrial Safety Helmets (Yellow)',
      'Quantity': 25,
      'Unit': 'units',
      'Location': 'Warehouse 2'
    }
  ];

  if (format === 'xlsx') {
    exportToExcel(sampleData, 'stocksense_receipts_sample_template', 'Receipts');
  } else {
    exportToCsv(sampleData, 'stocksense_receipts_sample_template');
  }
}
