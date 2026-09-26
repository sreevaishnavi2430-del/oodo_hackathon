import { INITIAL_PRODUCTS } from '../mockData/products';
import { INITIAL_LEDGER_ENTRIES } from '../mockData/ledger';
import { INITIAL_RECEIPTS, SUPPLIERS } from '../mockData/receipts';
import { INITIAL_DELIVERIES, CUSTOMERS } from '../mockData/deliveries';
import { INITIAL_TRANSFERS, LOCATIONS } from '../mockData/transfers';
import { INITIAL_ADJUSTMENTS } from '../mockData/adjustments';

// Helper to simulate asynchronous network latency (300ms)
const simulateLatency = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// In-memory working copies for mock persistence
let mockProducts = [...INITIAL_PRODUCTS];
let mockLedger = [...INITIAL_LEDGER_ENTRIES];
let mockReceipts = [...INITIAL_RECEIPTS];
let mockDeliveries = [...INITIAL_DELIVERIES];
let mockTransfers = [...INITIAL_TRANSFERS];
let mockAdjustments = [...INITIAL_ADJUSTMENTS];

/* ==========================================================================
   PRODUCTS API
   ========================================================================== */

export const getProducts = async () => {
  await simulateLatency(250);
  // To connect real API: return fetch('/api/v1/products').then(res => res.json());
  return [...mockProducts];
};

export const getProductById = async (id) => {
  await simulateLatency(200);
  const found = mockProducts.find((p) => p.id === id);
  if (!found) throw new Error(`Product with ID ${id} not found.`);
  return { ...found };
};

export const createProduct = async (productData) => {
  await simulateLatency(300);
  const newProduct = {
    id: `prod-${Date.now()}`,
    name: productData.name,
    sku: productData.sku,
    category: productData.category || "General",
    unit: productData.unit || "units",
    current_stock: Number(productData.initial_stock || productData.current_stock || 0),
    predicted_stockout_date: productData.predicted_stockout_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    suggested_reorder_qty: Number(productData.suggested_reorder_qty || 100),
  };

  mockProducts = [newProduct, ...mockProducts];

  // If initial stock was provided, log an initial stock receipt into ledger
  if (newProduct.current_stock > 0) {
    const initialLedger = {
      id: `led-${Date.now()}`,
      product_id: newProduct.id,
      location_id: "Main Warehouse",
      change_qty: newProduct.current_stock,
      type: "receipt",
      timestamp: new Date().toISOString(),
      reference_id: "INIT-STOCK"
    };
    mockLedger = [initialLedger, ...mockLedger];
  }

  return newProduct;
};

export const updateProduct = async (id, updates) => {
  await simulateLatency(250);
  mockProducts = mockProducts.map((p) => (p.id === id ? { ...p, ...updates } : p));
  return mockProducts.find((p) => p.id === id);
};

export const deleteProduct = async (id) => {
  await simulateLatency(250);
  mockProducts = mockProducts.filter((p) => p.id !== id);
  return { success: true, id };
};

/* ==========================================================================
   STOCK LEDGER API
   ========================================================================== */

export const getLedgerEntries = async (productId = null, filters = {}) => {
  await simulateLatency(250);
  let entries = [...mockLedger];

  if (productId) {
    entries = entries.filter((e) => e.product_id === productId);
  }
  if (filters.type && filters.type !== "all") {
    entries = entries.filter((e) => e.type === filters.type);
  }
  if (filters.location_id) {
    entries = entries.filter((e) => e.location_id === filters.location_id);
  }

  // Sort descending by timestamp
  return entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

export const createLedgerEntry = async (entryData) => {
  await simulateLatency(200);
  const entry = {
    id: `led-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    ...entryData,
  };
  mockLedger = [entry, ...mockLedger];
  return entry;
};

/* ==========================================================================
   RECEIPTS (INCOMING STOCK) API
   ========================================================================== */

export const getReceipts = async () => {
  await simulateLatency(250);
  return [...mockReceipts];
};

export const createReceipt = async (receiptData) => {
  await simulateLatency(300);
  const refId = `REC-${new Date().getFullYear()}-${String(mockReceipts.length + 101).padStart(3, '0')}`;
  
  const newReceipt = {
    id: `rec-${Date.now()}`,
    reference_id: refId,
    date: receiptData.date || new Date().toISOString().split('T')[0],
    supplier: receiptData.supplier,
    status: "Done",
    items: receiptData.items, // [{ product_id, product_name, qty, unit }]
    total_qty: receiptData.items.reduce((sum, item) => sum + Number(item.qty), 0)
  };

  mockReceipts = [newReceipt, ...mockReceipts];

  // Update stock for each product and write ledger entries
  newReceipt.items.forEach((item) => {
    const qty = Number(item.qty);
    // Update product stock
    mockProducts = mockProducts.map((p) =>
      p.id === item.product_id ? { ...p, current_stock: p.current_stock + qty } : p
    );
    // Write to ledger
    mockLedger = [
      {
        id: `led-${Date.now()}-${item.product_id}`,
        product_id: item.product_id,
        location_id: receiptData.location_id || "Main Warehouse",
        change_qty: qty,
        type: "receipt",
        timestamp: new Date().toISOString(),
        reference_id: refId,
      },
      ...mockLedger
    ];
  });

  return newReceipt;
};

/* ==========================================================================
   DELIVERIES (OUTGOING STOCK) API
   ========================================================================== */

export const getDeliveries = async () => {
  await simulateLatency(250);
  return [...mockDeliveries];
};

export const createDelivery = async (deliveryData) => {
  await simulateLatency(300);
  const refId = `DEL-${new Date().getFullYear()}-${String(mockDeliveries.length + 101).padStart(3, '0')}`;
  
  const newDelivery = {
    id: `del-${Date.now()}`,
    reference_id: refId,
    date: deliveryData.date || new Date().toISOString().split('T')[0],
    customer: deliveryData.customer,
    status: "Done",
    items: deliveryData.items, // [{ product_id, product_name, qty, unit }]
    total_qty: deliveryData.items.reduce((sum, item) => sum + Number(item.qty), 0)
  };

  mockDeliveries = [newDelivery, ...mockDeliveries];

  // Decrease stock for each product and write negative ledger entries
  newDelivery.items.forEach((item) => {
    const qty = Number(item.qty);
    mockProducts = mockProducts.map((p) =>
      p.id === item.product_id ? { ...p, current_stock: Math.max(0, p.current_stock - qty) } : p
    );
    mockLedger = [
      {
        id: `led-${Date.now()}-${item.product_id}`,
        product_id: item.product_id,
        location_id: deliveryData.location_id || "Main Warehouse",
        change_qty: -qty,
        type: "delivery",
        timestamp: new Date().toISOString(),
        reference_id: refId,
      },
      ...mockLedger
    ];
  });

  return newDelivery;
};

/* ==========================================================================
   INTERNAL TRANSFERS API
   ========================================================================== */

export const getTransfers = async () => {
  await simulateLatency(250);
  return [...mockTransfers];
};

export const createTransfer = async (transferData) => {
  await simulateLatency(300);
  const refId = `TRF-${new Date().getFullYear()}-${String(mockTransfers.length + 101).padStart(3, '0')}`;
  
  const newTransfer = {
    id: `trf-${Date.now()}`,
    reference_id: refId,
    date: transferData.date || new Date().toISOString().split('T')[0],
    product_id: transferData.product_id,
    product_name: transferData.product_name,
    qty: Number(transferData.qty),
    unit: transferData.unit || "units",
    from_location: transferData.from_location,
    to_location: transferData.to_location,
    status: "Done"
  };

  mockTransfers = [newTransfer, ...mockTransfers];

  // Log movement to ledger (change_qty is 0 for net company stock, but registers location transfer)
  mockLedger = [
    {
      id: `led-${Date.now()}`,
      product_id: transferData.product_id,
      location_id: `${transferData.from_location} → ${transferData.to_location}`,
      change_qty: 0,
      type: "transfer",
      timestamp: new Date().toISOString(),
      reference_id: refId,
    },
    ...mockLedger
  ];

  return newTransfer;
};

/* ==========================================================================
   STOCK ADJUSTMENTS API
   ========================================================================== */

export const getAdjustments = async () => {
  await simulateLatency(250);
  return [...mockAdjustments];
};

export const createAdjustment = async (adjData) => {
  await simulateLatency(300);
  const refId = `ADJ-${new Date().getFullYear()}-${String(mockAdjustments.length + 101).padStart(3, '0')}`;
  const counted = Number(adjData.counted_qty);
  const system = Number(adjData.system_qty);
  const delta = counted - system;

  const newAdjustment = {
    id: `adj-${Date.now()}`,
    reference_id: refId,
    date: adjData.date || new Date().toISOString().split('T')[0],
    product_id: adjData.product_id,
    product_name: adjData.product_name,
    location: adjData.location || "Main Warehouse",
    system_qty: system,
    counted_qty: counted,
    delta: delta,
    reason: adjData.reason || "Physical count adjustment",
    status: "Done"
  };

  mockAdjustments = [newAdjustment, ...mockAdjustments];

  // Update product stock to counted_qty
  mockProducts = mockProducts.map((p) =>
    p.id === adjData.product_id ? { ...p, current_stock: counted } : p
  );

  // Write delta to ledger
  mockLedger = [
    {
      id: `led-${Date.now()}`,
      product_id: adjData.product_id,
      location_id: adjData.location || "Main Warehouse",
      change_qty: delta,
      type: "adjustment",
      timestamp: new Date().toISOString(),
      reference_id: refId,
    },
    ...mockLedger
  ];

  return newAdjustment;
};

/* ==========================================================================
   METADATA (SUPPLIERS, CUSTOMERS, LOCATIONS)
   ========================================================================== */

export const getLocations = async () => LOCATIONS;
export const getSuppliers = async () => SUPPLIERS;
export const getCustomers = async () => CUSTOMERS;
