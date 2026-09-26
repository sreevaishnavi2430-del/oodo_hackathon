import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { id, isoDate, today, addDays } from './utils.js';
import { recalculateAll, recalculateProduct } from './services/predictionService.js';
import { checkAndDispatchAlerts } from './services/alertService.js';

dotenv.config();
const app = express();
const root = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(root, 'data', 'stocksense.json');

function seedDefaultStore() {
  const names = [
    ['Reinforced Steel Rods 12mm', 'STL-12', 'Raw Materials', 'kg', 77],
    ['Portland Cement Grade 53', 'CEM-53', 'Raw Materials', 'bags', 32],
    ['Industrial Copper Wire 2.5mm', 'CU-25', 'Electrical', 'meters', 180],
    ['PVC Conduit Pipes', 'PVC-20', 'Plumbing', 'meters', 46],
    ['Safety Helmets', 'PPE-001', 'Safety', 'units', 24],
    ['Welding Electrodes', 'WLD-001', 'Consumables', 'boxes', 18],
    ['Aluminium Sheets 2mm', 'AL-2', 'Raw Materials', 'sheets', 63],
    ['Hydraulic Oil 20L', 'OIL-20', 'Maintenance', 'cans', 12],
    ['Anchor Bolts M16', 'BLT-M16', 'Hardware', 'units', 95],
    ['Industrial Gloves', 'GLV-001', 'Safety', 'pairs', 40]
  ];
  const products = names.map(([name, sku, category, unit, stock], i) => ({
    id: `prod-${i + 1}`,
    name,
    sku,
    category,
    unit,
    current_stock: stock,
    predicted_stockout_date: isoDate(addDays(new Date(), i < 3 ? 3 + i : 20 + i)),
    suggested_reorder_qty: 25
  }));
  const ledger = [];
  for (const p of products) {
    for (let d = 7; d >= 1; d--) {
      ledger.push({
        id: id('led'),
        product_id: p.id,
        location_id: 'Main Warehouse',
        change_qty: d === 7 && p.id === 'prod-1' ? 100 : -((p.id.charCodeAt(5) + d) % 4 + 1),
        type: d === 7 && p.id === 'prod-1' ? 'receipt' : 'delivery',
        timestamp: new Date(Date.now() - d * 86400000).toISOString(),
        reference_id: `${d === 7 ? 'REC' : 'DEL'}-SEED-${d}`
      });
    }
  }
  ledger.push({
    id: id('led'),
    product_id: 'prod-1',
    location_id: 'Main Warehouse',
    change_qty: -3,
    type: 'adjustment',
    timestamp: new Date().toISOString(),
    reference_id: 'ADJ-SEED-001'
  });
  const steel = products[0];
  return {
    products: recalculateAll(products, ledger),
    ledger,
    receipts: [
      {
        id: 'rec-seed',
        reference_id: 'REC-SEED-001',
        date: isoDate(new Date()),
        supplier: 'Metro Steel Suppliers',
        status: 'Done',
        total_qty: 100,
        items: [{ product_id: steel.id, product_name: steel.name, qty: 100, unit: steel.unit }]
      }
    ],
    deliveries: [],
    transfers: [
      {
        id: 'trf-seed',
        reference_id: 'TRF-SEED-001',
        date: isoDate(new Date()),
        product_id: steel.id,
        product_name: steel.name,
        qty: 100,
        unit: steel.unit,
        from_location: 'Main Warehouse',
        to_location: 'Production Floor',
        status: 'Done'
      }
    ],
    adjustments: [
      {
        id: 'adj-seed',
        reference_id: 'ADJ-SEED-001',
        date: isoDate(new Date()),
        product_id: steel.id,
        product_name: steel.name,
        location: 'Production Floor',
        system_qty: 80,
        counted_qty: 77,
        delta: -3,
        reason: 'Damaged items',
        status: 'Done'
      }
    ]
  };
}

if (!fs.existsSync(file)) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(seedDefaultStore(), null, 2));
}

const read = () => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    const fresh = seedDefaultStore();
    fs.writeFileSync(file, JSON.stringify(fresh, null, 2));
    return fresh;
  }
};

const write = (s) => fs.writeFileSync(file, JSON.stringify(s, null, 2));
const sync = (s) => {
  s.products = recalculateAll(s.products, s.ledger);
  write(s);
  return s;
};

app.use(cors({ origin: (process.env.FRONTEND_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',') }));
app.use(express.json({ limit: '10mb' }));

const ok = (res, value) => res.json(value);
const bad = (res, msg, code = 400) => res.status(code).json({ error: msg });

// Products Endpoints
app.get('/api/products', (req, res) => {
  const s = read();
  let x = s.products;
  if (req.query.category) x = x.filter((p) => p.category === req.query.category);
  if (req.query.search) {
    const q = req.query.search.toLowerCase();
    x = x.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(q));
  }
  ok(res, x);
});

app.get('/api/products/at-risk', (req, res) => {
  const s = read();
  const cutoff = isoDate(new Date(Date.now() + 7 * 86400000));
  ok(res, s.products.filter((p) => p.predicted_stockout_date <= cutoff));
});

app.get('/api/products/:id', (req, res) => {
  const p = read().products.find((x) => x.id === req.params.id);
  return p ? ok(res, p) : bad(res, 'Product not found', 404);
});

app.post('/api/products', (req, res) => {
  const s = read();
  const b = req.body;
  if (!b.name || !b.sku) return bad(res, 'name and sku are required');
  if (s.products.some((p) => p.sku === b.sku)) return bad(res, 'sku must be unique');

  const p = {
    id: id('prod'),
    name: b.name,
    sku: b.sku,
    category: b.category || 'General',
    unit: b.unit || 'units',
    current_stock: Number(b.initial_stock ?? b.current_stock ?? 0),
    predicted_stockout_date: isoDate(new Date(Date.now() + 30 * 86400000)),
    suggested_reorder_qty: Number(b.suggested_reorder_qty || 50)
  };

  s.products.unshift(p);
  if (p.current_stock > 0) {
    s.ledger.unshift({
      id: id('led'),
      product_id: p.id,
      location_id: 'Main Warehouse',
      change_qty: p.current_stock,
      type: 'receipt',
      timestamp: new Date().toISOString(),
      reference_id: 'INIT-STOCK'
    });
  }
  sync(s);
  ok(res, s.products.find((x) => x.id === p.id));
});

app.put('/api/products/:id', (req, res) => {
  const s = read();
  const i = s.products.findIndex((p) => p.id === req.params.id);
  if (i < 0) return bad(res, 'Product not found', 404);
  s.products[i] = { ...s.products[i], ...req.body, id: req.params.id };
  sync(s);
  ok(res, s.products[i]);
});

app.delete('/api/products/:id', (req, res) => {
  const s = read();
  s.products = s.products.filter((p) => p.id !== req.params.id);
  write(s);
  ok(res, { success: true, id: req.params.id });
});

// Stock Ledger Endpoints
app.get('/api/ledger', (req, res) => {
  const s = read();
  let x = s.ledger;
  if (req.query.productId) x = x.filter((e) => e.product_id === req.query.productId);
  if (req.query.type && req.query.type !== 'all') x = x.filter((e) => e.type === req.query.type);
  ok(res, x.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
});

app.post('/api/ledger', (req, res) => {
  const s = read();
  const e = { id: id('led'), timestamp: new Date().toISOString(), ...req.body };
  s.ledger.unshift(e);
  sync(s);
  ok(res, e);
});

// Helper for Line Items
function items(body, s) {
  return (body.items || []).map((i) => ({
    ...i,
    qty: Number(i.qty),
    product_name: i.product_name || s.products.find((p) => p.id === i.product_id)?.name,
    unit: i.unit || s.products.find((p) => p.id === i.product_id)?.unit || 'units'
  }));
}

// Receipts Endpoints
app.get('/api/receipts', (req, res) => ok(res, read().receipts));
app.post('/api/receipts', (req, res) => {
  const s = read();
  const its = items(req.body, s);
  const ref = req.body.reference_id || `REC-${Date.now()}`;
  const r = {
    id: id('rec'),
    reference_id: ref,
    date: req.body.date || today(),
    supplier: req.body.supplier || 'Unknown supplier',
    status: 'Done',
    items: its,
    total_qty: its.reduce((a, i) => a + i.qty, 0)
  };

  its.forEach((i) => {
    let p = s.products.find((x) => x.id === i.product_id);
    if (!p && i.sku) {
      p = s.products.find((x) => x.sku === i.sku);
    }
    if (!p) {
      p = {
        id: id('prod'),
        name: i.product_name || 'Inbound Item',
        sku: i.sku || `SKU-${Date.now().toString().slice(-4)}`,
        category: 'General',
        unit: i.unit || 'units',
        current_stock: 0,
        predicted_stockout_date: isoDate(new Date(Date.now() + 30 * 86400000)),
        suggested_reorder_qty: 50
      };
      s.products.unshift(p);
      i.product_id = p.id;
    }
    p.current_stock += i.qty;
    s.ledger.unshift({
      id: id('led'),
      product_id: p.id,
      location_id: req.body.location_id || 'Main Warehouse',
      change_qty: i.qty,
      type: 'receipt',
      timestamp: new Date().toISOString(),
      reference_id: ref
    });
  });

  s.receipts.unshift(r);
  sync(s);
  ok(res, r);
});

// Deliveries Endpoints
app.get('/api/deliveries', (req, res) => ok(res, read().deliveries));
app.post('/api/deliveries', (req, res) => {
  const s = read();
  const its = items(req.body, s);

  for (const i of its) {
    const p = s.products.find((x) => x.id === i.product_id);
    if (!p) return bad(res, `Product not found for line item`);
    if (p.current_stock < i.qty) {
      return bad(res, `Insufficient stock for ${p.name}: requested ${i.qty}, available ${p.current_stock}`);
    }
  }

  const ref = req.body.reference_id || `DEL-${Date.now()}`;
  const d = {
    id: id('del'),
    reference_id: ref,
    date: req.body.date || today(),
    customer: req.body.customer || 'Unknown customer',
    status: 'Done',
    items: its,
    total_qty: its.reduce((a, i) => a + i.qty, 0)
  };

  its.forEach((i) => {
    const p = s.products.find((x) => x.id === i.product_id);
    p.current_stock -= i.qty;
    s.ledger.unshift({
      id: id('led'),
      product_id: p.id,
      location_id: req.body.location_id || 'Main Warehouse',
      change_qty: -i.qty,
      type: 'delivery',
      timestamp: new Date().toISOString(),
      reference_id: ref
    });
  });

  s.deliveries.unshift(d);
  sync(s);
  ok(res, d);
});

// Transfers Endpoints
app.get('/api/transfers', (req, res) => ok(res, read().transfers));
app.post('/api/transfers', (req, res) => {
  const s = read();
  const b = req.body;
  const p = s.products.find((x) => x.id === b.product_id);
  if (!p) return bad(res, 'Product not found', 404);

  const ref = req.body.reference_id || `TRF-${Date.now()}`;
  const t = {
    id: id('trf'),
    reference_id: ref,
    date: b.date || today(),
    product_id: p.id,
    product_name: p.name,
    qty: Number(b.qty),
    unit: b.unit || p.unit,
    from_location: b.from_location,
    to_location: b.to_location,
    status: 'Done'
  };

  s.transfers.unshift(t);
  s.ledger.unshift({
    id: id('led'),
    product_id: p.id,
    location_id: `${t.from_location} → ${t.to_location}`,
    change_qty: 0,
    type: 'transfer',
    timestamp: new Date().toISOString(),
    reference_id: ref
  });
  write(s);
  ok(res, t);
});

// Adjustments Endpoints
app.get('/api/adjustments', (req, res) => ok(res, read().adjustments));
app.post('/api/adjustments', (req, res) => {
  const s = read();
  const b = req.body;
  const p = s.products.find((x) => x.id === b.product_id);
  if (!p) return bad(res, 'Product not found', 404);

  const system = Number(b.system_qty ?? p.current_stock);
  const counted = Number(b.counted_qty);
  const delta = counted - system;
  const ref = req.body.reference_id || `ADJ-${Date.now()}`;

  const a = {
    id: id('adj'),
    reference_id: ref,
    date: b.date || today(),
    product_id: p.id,
    product_name: p.product_name || p.name,
    location: b.location || 'Main Warehouse',
    system_qty: system,
    counted_qty: counted,
    delta,
    reason: b.reason || 'Physical count adjustment',
    status: 'Done',
    anomaly_warning: system > 0 && Math.abs(delta) / system > 0.3
  };

  p.current_stock = counted;
  s.adjustments.unshift(a);
  s.ledger.unshift({
    id: id('led'),
    product_id: p.id,
    location_id: a.location,
    change_qty: delta,
    type: 'adjustment',
    timestamp: new Date().toISOString(),
    reference_id: ref
  });
  sync(s);
  ok(res, a);
});

// AI Query Endpoint
app.post('/api/ai/query', (req, res) => {
  const s = read();
  const q = String(req.body.query || '').toLowerCase();
  const risk = s.products.filter(
    (p) => p.predicted_stockout_date <= isoDate(new Date(Date.now() + 7 * 86400000))
  );

  let answer;
  if (q.includes('risk') || q.includes('stockout') || q.includes('run out')) {
    answer = risk.length
      ? `Identified ${risk.length} items at risk of stockout within 7 days: ${risk
          .map((p) => `${p.name} (${p.current_stock} ${p.unit}, runout on ${p.predicted_stockout_date})`)
          .join('; ')}`
      : 'All monitored products currently have healthy inventories exceeding 7-day depletion runway.';
  } else if (q.includes('reorder') || q.includes('po')) {
    answer = `Recommended replenishment orders: ${
      risk.map((p) => `${p.name} (order ${p.suggested_reorder_qty} ${p.unit})`).join(', ') ||
      'No critical items requiring emergency replenishment at this time.'
    }`;
  } else {
    const matches = s.products.filter(
      (p) =>
        q.includes(p.name.toLowerCase()) ||
        q.includes(p.sku.toLowerCase()) ||
        p.name
          .toLowerCase()
          .split(' ')
          .some((w) => w.length > 4 && q.includes(w))
    );
    answer = matches.length
      ? matches.map((p) => `${p.name} [SKU: ${p.sku}]: ${p.current_stock} ${p.unit} on hand (Est. Stockout: ${p.predicted_stockout_date}).`).join('\n')
      : `Tracking ${s.products.length} catalog items across facilities with ${risk.length} at immediate stockout risk.`;
  }
  ok(res, { answer });
});

// Bulk Import & Management Endpoints
app.post('/api/import/products', (req, res) => {
  const s = read();
  const { products: newProducts = [], replaceExisting = false } = req.body;

  if (!Array.isArray(newProducts) || newProducts.length === 0) {
    return bad(res, 'No valid products supplied in payload');
  }

  if (replaceExisting) {
    s.products = [];
    s.ledger = [];
  }

  let importedCount = 0;
  for (const item of newProducts) {
    const existingIndex = s.products.findIndex(
      (p) => p.sku && item.sku && p.sku.toLowerCase() === item.sku.toLowerCase()
    );

    if (existingIndex >= 0 && !replaceExisting) {
      // Update existing item
      s.products[existingIndex] = {
        ...s.products[existingIndex],
        ...item,
        id: s.products[existingIndex].id
      };
    } else {
      const p = {
        id: item.id || id('prod'),
        name: item.name || `Imported Item ${item.sku || importedCount + 1}`,
        sku: item.sku || `SKU-IMP-${Date.now().toString().slice(-4)}-${importedCount + 1}`,
        category: item.category || 'General',
        unit: item.unit || 'units',
        current_stock: Number(item.current_stock || 0),
        predicted_stockout_date: item.predicted_stockout_date || isoDate(new Date(Date.now() + 25 * 86400000)),
        suggested_reorder_qty: Number(item.suggested_reorder_qty || 50)
      };
      s.products.push(p);

      if (p.current_stock > 0) {
        s.ledger.unshift({
          id: id('led'),
          product_id: p.id,
          location_id: 'Main Warehouse',
          change_qty: p.current_stock,
          type: 'receipt',
          timestamp: new Date().toISOString(),
          reference_id: 'IMPORT-CATALOG'
        });
      }
    }
    importedCount++;
  }

  sync(s);
  ok(res, { success: true, count: importedCount, totalProducts: s.products.length });
});

app.post('/api/import/receipts', (req, res) => {
  const s = read();
  const { receipts: newReceipts = [] } = req.body;

  if (!Array.isArray(newReceipts) || newReceipts.length === 0) {
    return bad(res, 'No valid receipts supplied in payload');
  }

  let importedCount = 0;
  for (const r of newReceipts) {
    const formattedItems = (r.items || []).map((i) => {
      let prod = s.products.find(
        (p) =>
          (i.product_id && p.id === i.product_id) ||
          (i.sku && p.sku.toLowerCase() === i.sku.toLowerCase()) ||
          (i.product_name && p.name.toLowerCase() === i.product_name.toLowerCase())
      );

      if (!prod) {
        prod = {
          id: id('prod'),
          name: i.product_name || `Imported SKU ${i.sku || 'Item'}`,
          sku: i.sku || `SKU-${Date.now().toString().slice(-4)}`,
          category: 'General',
          unit: i.unit || 'units',
          current_stock: 0,
          predicted_stockout_date: isoDate(new Date(Date.now() + 28 * 86400000)),
          suggested_reorder_qty: 50
        };
        s.products.unshift(prod);
      }

      prod.current_stock += Number(i.qty);
      s.ledger.unshift({
        id: id('led'),
        product_id: prod.id,
        location_id: r.location_id || 'Main Warehouse',
        change_qty: Number(i.qty),
        type: 'receipt',
        timestamp: new Date().toISOString(),
        reference_id: r.reference_id || `REC-IMP-${Date.now()}`
      });

      return {
        product_id: prod.id,
        sku: prod.sku,
        product_name: prod.name,
        qty: Number(i.qty),
        unit: prod.unit
      };
    });

    const receiptObj = {
      id: r.id || id('rec'),
      reference_id: r.reference_id || `REC-IMP-${Date.now().toString().slice(-4)}`,
      date: r.date || today(),
      supplier: r.supplier || 'Imported Vendor',
      status: 'Done',
      items: formattedItems,
      total_qty: formattedItems.reduce((acc, it) => acc + it.qty, 0)
    };

    s.receipts.unshift(receiptObj);
    importedCount++;
  }

  sync(s);
  ok(res, { success: true, count: importedCount, totalReceipts: s.receipts.length });
});

// Full System Backup, Restore, and Reset
app.get('/api/backup', (req, res) => ok(res, read()));
app.post('/api/restore', (req, res) => {
  const b = req.body;
  if (!b || !Array.isArray(b.products)) {
    return bad(res, 'Invalid system backup structure');
  }
  const restored = {
    products: b.products || [],
    ledger: b.ledger || [],
    receipts: b.receipts || [],
    deliveries: b.deliveries || [],
    transfers: b.transfers || [],
    adjustments: b.adjustments || []
  };
  sync(restored);
  ok(res, { success: true, message: 'System state restored successfully' });
});

app.post('/api/reset-demo', (req, res) => {
  const fresh = seedDefaultStore();
  write(fresh);
  ok(res, fresh);
});

app.post('/api/alerts/trigger', (req, res) => ok(res, checkAndDispatchAlerts(read())));
app.get('/api/health', (req, res) => ok(res, { status: 'ok', date: new Date().toISOString() }));

app.use((err, req, res, next) => bad(res, err.message || 'Internal server error', 500));

const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log(`StockSense API listening on http://localhost:${port}`));
