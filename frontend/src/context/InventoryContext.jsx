import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import * as api from '../api/inventoryApi';
import { INITIAL_PRODUCTS } from '../mockData/products';
import { INITIAL_LEDGER_ENTRIES } from '../mockData/ledger';
import { INITIAL_RECEIPTS } from '../mockData/receipts';
import { INITIAL_DELIVERIES } from '../mockData/deliveries';
import { INITIAL_TRANSFERS } from '../mockData/transfers';
import { INITIAL_ADJUSTMENTS } from '../mockData/adjustments';
import { exportToExcel, formatProductsForExport, formatLedgerForExport, formatReceiptsForExport, formatDeliveriesForExport, formatTransfersForExport, formatAdjustmentsForExport } from '../utils/exportUtils';

const InventoryContext = createContext(null);
const STORAGE_KEY = 'stocksense_inventory_state_v1';

/**
 * Recalculate dynamic depletion velocity and predictive stockout dates
 * based on actual ledger movements over the past 7 days.
 */
export function calculateDynamicPredictions(productsList, ledgerEntries) {
  const cutoff = Date.now() - 7 * 86400000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return productsList.map((product) => {
    const depleted = ledgerEntries
      .filter(
        (entry) =>
          entry.product_id === product.id &&
          new Date(entry.timestamp).getTime() >= cutoff &&
          (entry.type === 'delivery' || (entry.type === 'adjustment' && entry.change_qty < 0))
      )
      .reduce((sum, entry) => sum + Math.abs(Number(entry.change_qty)), 0);

    // Minimum depletion velocity of 0.1 units/day to avoid division by zero
    const rate = Math.max(0.1, depleted / 7);
    const stock = Math.max(0, Number(product.current_stock || 0));
    const daysToStockout = stock / rate;

    const predictedDate = new Date(today.getTime() + daysToStockout * 86400000);
    const dateStr = predictedDate.toISOString().split('T')[0];
    const reorderQty = Math.max(15, Math.round(rate * 7));

    return {
      ...product,
      current_stock: stock,
      predicted_stockout_date: product.predicted_stockout_date || dateStr,
      suggested_reorder_qty: product.suggested_reorder_qty || reorderQty,
      depletion_rate: Number(rate.toFixed(2))
    };
  });
}

export const InventoryProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [adjustments, setAdjustments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'warning' | 'error' | 'info' }

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  }, []);

  // Save current snapshot into localStorage as offline fallback
  const persistLocally = (prods, led, recs, dels, trfs, adjs) => {
    try {
      const payload = {
        products: prods,
        ledger: led,
        receipts: recs,
        deliveries: dels,
        transfers: trfs,
        adjustments: adjs,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  };

  // Dual-mode data loader: Attempts backend first, falls back gracefully to localStorage or mockData
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [prods, led, recs, dels, trfs, adjs] = await Promise.all([
        api.getProducts(),
        api.getLedgerEntries(),
        api.getReceipts(),
        api.getDeliveries(),
        api.getTransfers(),
        api.getAdjustments()
      ]);

      const calculatedProds = calculateDynamicPredictions(prods, led);
      setProducts(calculatedProds);
      setLedger(led);
      setReceipts(recs);
      setDeliveries(dels);
      setTransfers(trfs);
      setAdjustments(adjs);
      setIsBackendOnline(true);
      persistLocally(calculatedProds, led, recs, dels, trfs, adjs);
    } catch (err) {
      console.info('Backend unreachable, engaging standalone resilient local engine...', err.message);
      setIsBackendOnline(false);

      // Check localStorage
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const calculatedProds = calculateDynamicPredictions(parsed.products || [], parsed.ledger || []);
          setProducts(calculatedProds);
          setLedger(parsed.ledger || []);
          setReceipts(parsed.receipts || []);
          setDeliveries(parsed.deliveries || []);
          setTransfers(parsed.transfers || []);
          setAdjustments(parsed.adjustments || []);
          return;
        } catch (e) {
          console.error('Cached data parse error:', e);
        }
      }

      // Initial fallback to seed mockData
      const seededLed = INITIAL_LEDGER_ENTRIES;
      const calculatedProds = calculateDynamicPredictions(INITIAL_PRODUCTS, seededLed);
      setProducts(calculatedProds);
      setLedger(seededLed);
      setReceipts(INITIAL_RECEIPTS);
      setDeliveries(INITIAL_DELIVERIES);
      setTransfers(INITIAL_TRANSFERS);
      setAdjustments(INITIAL_ADJUSTMENTS);
      persistLocally(calculatedProds, seededLed, INITIAL_RECEIPTS, INITIAL_DELIVERIES, INITIAL_TRANSFERS, INITIAL_ADJUSTMENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Compute at-risk products (< 7 days until predicted stockout date)
  const atRiskProducts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysLater = new Date(today.getTime() + 7 * 86400000);

    return products.filter((p) => {
      if (!p.predicted_stockout_date) return false;
      const pred = new Date(p.predicted_stockout_date);
      pred.setHours(0, 0, 0, 0);
      return pred <= sevenDaysLater;
    });
  }, [products]);

  // Operations: Add Product
  const addProduct = async (productData) => {
    let created;
    try {
      if (isBackendOnline) {
        created = await api.createProduct(productData);
      }
    } catch (e) {
      console.warn('Backend addProduct failed, saving locally:', e);
    }

    if (!created) {
      created = {
        id: `prod-${Date.now()}`,
        name: productData.name,
        sku: productData.sku,
        category: productData.category || 'General',
        unit: productData.unit || 'units',
        current_stock: Number(productData.initial_stock ?? productData.current_stock ?? 0),
        predicted_stockout_date: new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0],
        suggested_reorder_qty: Number(productData.suggested_reorder_qty || 50)
      };
    }

    const newLedger = [...ledger];
    if (created.current_stock > 0) {
      newLedger.unshift({
        id: `led-${Date.now()}`,
        product_id: created.id,
        location_id: 'Main Warehouse',
        change_qty: created.current_stock,
        type: 'receipt',
        timestamp: new Date().toISOString(),
        reference_id: 'INIT-STOCK'
      });
    }

    const updatedProds = calculateDynamicPredictions([created, ...products], newLedger);
    setProducts(updatedProds);
    setLedger(newLedger);
    persistLocally(updatedProds, newLedger, receipts, deliveries, transfers, adjustments);
    showToast(`Product "${created.name}" created successfully!`, 'success');
    return created;
  };

  // Operations: Edit Product
  const editProduct = async (id, updates) => {
    let updated;
    try {
      if (isBackendOnline) {
        updated = await api.updateProduct(id, updates);
      }
    } catch (e) {
      console.warn('Backend update failed:', e);
    }

    const nextProducts = products.map((p) => (p.id === id ? { ...p, ...updates, ...(updated || {}) } : p));
    const calculated = calculateDynamicPredictions(nextProducts, ledger);
    setProducts(calculated);
    persistLocally(calculated, ledger, receipts, deliveries, transfers, adjustments);
    showToast(`Product updated successfully`, 'success');
    return updated || updates;
  };

  // Operations: Delete Product
  const removeProduct = async (id) => {
    try {
      if (isBackendOnline) {
        await api.deleteProduct(id);
      }
    } catch (e) {
      console.warn('Backend delete failed:', e);
    }

    const nextProducts = products.filter((p) => p.id !== id);
    setProducts(nextProducts);
    persistLocally(nextProducts, ledger, receipts, deliveries, transfers, adjustments);
    showToast('Product deleted from inventory', 'info');
  };

  // Operations: Add Inbound Receipt
  const addReceipt = async (receiptData) => {
    let created;
    try {
      if (isBackendOnline) {
        created = await api.createReceipt(receiptData);
      }
    } catch (e) {
      console.warn('Backend receipt failed, falling back to local calculation:', e);
    }

    const ref = receiptData.reference_id || `REC-${Date.now()}`;
    const newItems = receiptData.items || [];
    const newLedgerEntries = [...ledger];
    const updatedProducts = products.map((p) => {
      const item = newItems.find((it) => it.product_id === p.id || it.sku === p.sku);
      if (item) {
        newLedgerEntries.unshift({
          id: `led-${Date.now()}-${p.id}`,
          product_id: p.id,
          location_id: receiptData.location_id || 'Main Warehouse',
          change_qty: Number(item.qty),
          type: 'receipt',
          timestamp: new Date().toISOString(),
          reference_id: ref
        });
        return { ...p, current_stock: p.current_stock + Number(item.qty) };
      }
      return p;
    });

    if (!created) {
      created = {
        id: `rec-${Date.now()}`,
        reference_id: ref,
        date: receiptData.date || new Date().toISOString().split('T')[0],
        supplier: receiptData.supplier || 'Direct Supplier',
        status: 'Done',
        items: newItems,
        total_qty: newItems.reduce((acc, it) => acc + Number(it.qty), 0)
      };
    }

    const calculatedProds = calculateDynamicPredictions(updatedProducts, newLedgerEntries);
    const nextReceipts = [created, ...receipts];
    setProducts(calculatedProds);
    setLedger(newLedgerEntries);
    setReceipts(nextReceipts);
    persistLocally(calculatedProds, newLedgerEntries, nextReceipts, deliveries, transfers, adjustments);
    showToast(`Receipt ${ref} processed: +${created.total_qty} units received!`, 'success');
    return created;
  };

  // Operations: Add Outbound Delivery
  const addDelivery = async (deliveryData) => {
    let created;
    try {
      if (isBackendOnline) {
        created = await api.createDelivery(deliveryData);
      }
    } catch (e) {
      console.warn('Backend delivery failed, falling back to local calculation:', e);
    }

    const ref = deliveryData.reference_id || `DEL-${Date.now()}`;
    const newItems = deliveryData.items || [];
    const newLedgerEntries = [...ledger];

    // Check stock availability
    for (const it of newItems) {
      const p = products.find((x) => x.id === it.product_id);
      if (p && p.current_stock < Number(it.qty)) {
        showToast(`Insufficient stock for ${p.name}: requested ${it.qty}, on hand ${p.current_stock}`, 'error');
        throw new Error(`Insufficient stock for ${p.name}`);
      }
    }

    const updatedProducts = products.map((p) => {
      const item = newItems.find((it) => it.product_id === p.id);
      if (item) {
        newLedgerEntries.unshift({
          id: `led-${Date.now()}-${p.id}`,
          product_id: p.id,
          location_id: deliveryData.location_id || 'Main Warehouse',
          change_qty: -Number(item.qty),
          type: 'delivery',
          timestamp: new Date().toISOString(),
          reference_id: ref
        });
        return { ...p, current_stock: Math.max(0, p.current_stock - Number(item.qty)) };
      }
      return p;
    });

    if (!created) {
      created = {
        id: `del-${Date.now()}`,
        reference_id: ref,
        date: deliveryData.date || new Date().toISOString().split('T')[0],
        customer: deliveryData.customer || 'Customer Dispatch',
        status: 'Done',
        items: newItems,
        total_qty: newItems.reduce((acc, it) => acc + Number(it.qty), 0)
      };
    }

    const calculatedProds = calculateDynamicPredictions(updatedProducts, newLedgerEntries);
    const nextDeliveries = [created, ...deliveries];
    setProducts(calculatedProds);
    setLedger(newLedgerEntries);
    setDeliveries(nextDeliveries);
    persistLocally(calculatedProds, newLedgerEntries, receipts, nextDeliveries, transfers, adjustments);
    showToast(`Delivery ${ref} dispatched: -${created.total_qty} units sent!`, 'success');
    return created;
  };

  // Operations: Add Internal Transfer
  const addTransfer = async (transferData) => {
    let created;
    try {
      if (isBackendOnline) {
        created = await api.createTransfer(transferData);
      }
    } catch (e) {
      console.warn('Backend transfer failed:', e);
    }

    const ref = transferData.reference_id || `TRF-${Date.now()}`;
    const newLedgerEntries = [
      {
        id: `led-${Date.now()}`,
        product_id: transferData.product_id,
        location_id: `${transferData.from_location} → ${transferData.to_location}`,
        change_qty: 0,
        type: 'transfer',
        timestamp: new Date().toISOString(),
        reference_id: ref
      },
      ...ledger
    ];

    if (!created) {
      const prod = products.find((p) => p.id === transferData.product_id);
      created = {
        id: `trf-${Date.now()}`,
        reference_id: ref,
        date: transferData.date || new Date().toISOString().split('T')[0],
        product_id: transferData.product_id,
        product_name: prod?.name || 'Inventory Item',
        qty: Number(transferData.qty),
        unit: transferData.unit || prod?.unit || 'units',
        from_location: transferData.from_location,
        to_location: transferData.to_location,
        status: 'Done'
      };
    }

    const nextTransfers = [created, ...transfers];
    setLedger(newLedgerEntries);
    setTransfers(nextTransfers);
    persistLocally(products, newLedgerEntries, receipts, deliveries, nextTransfers, adjustments);
    showToast(`Internal transfer ${ref} logged: ${transferData.from_location} → ${transferData.to_location}`, 'success');
    return created;
  };

  // Operations: Add Physical Count Adjustment
  const addAdjustment = async (adjData) => {
    let created;
    try {
      if (isBackendOnline) {
        created = await api.createAdjustment(adjData);
      }
    } catch (e) {
      console.warn('Backend adjustment failed:', e);
    }

    const ref = adjData.reference_id || `ADJ-${Date.now()}`;
    const system = Number(adjData.system_qty);
    const counted = Number(adjData.counted_qty);
    const delta = counted - system;

    const newLedgerEntries = [
      {
        id: `led-${Date.now()}`,
        product_id: adjData.product_id,
        location_id: adjData.location || 'Main Warehouse',
        change_qty: delta,
        type: 'adjustment',
        timestamp: new Date().toISOString(),
        reference_id: ref
      },
      ...ledger
    ];

    const updatedProducts = products.map((p) =>
      p.id === adjData.product_id ? { ...p, current_stock: counted } : p
    );

    if (!created) {
      created = {
        id: `adj-${Date.now()}`,
        reference_id: ref,
        date: adjData.date || new Date().toISOString().split('T')[0],
        product_id: adjData.product_id,
        product_name: adjData.product_name,
        location: adjData.location || 'Main Warehouse',
        system_qty: system,
        counted_qty: counted,
        delta,
        reason: adjData.reason || 'Cycle count audit',
        status: 'Done',
        anomaly_warning: system > 0 && Math.abs(delta) / system > 0.3
      };
    }

    const calculatedProds = calculateDynamicPredictions(updatedProducts, newLedgerEntries);
    const nextAdjustments = [created, ...adjustments];
    setProducts(calculatedProds);
    setLedger(newLedgerEntries);
    setAdjustments(nextAdjustments);
    persistLocally(calculatedProds, newLedgerEntries, receipts, deliveries, transfers, nextAdjustments);
    showToast(`Adjustment ${ref} recorded (${delta > 0 ? '+' : ''}${delta} units)`, 'success');
    return created;
  };

  // Feature: Bulk Product Import (Custom Dataset)
  const importProducts = async (newProducts, replaceExisting = false) => {
    try {
      if (isBackendOnline) {
        await api.importProductsApi(newProducts, replaceExisting);
      }
    } catch (e) {
      console.warn('Backend bulk product import failed:', e);
    }

    let nextProducts = replaceExisting ? [] : [...products];
    const newLedgerEntries = replaceExisting ? [] : [...ledger];

    newProducts.forEach((item, idx) => {
      const existingIdx = nextProducts.findIndex(
        (p) => p.sku && item.sku && p.sku.toLowerCase() === item.sku.toLowerCase()
      );

      if (existingIdx >= 0 && !replaceExisting) {
        nextProducts[existingIdx] = {
          ...nextProducts[existingIdx],
          ...item,
          id: nextProducts[existingIdx].id
        };
      } else {
        const prodId = item.id || `prod-custom-${Date.now()}-${idx}`;
        const p = {
          id: prodId,
          name: item.name,
          sku: item.sku,
          category: item.category || 'General',
          unit: item.unit || 'units',
          current_stock: Number(item.current_stock || 0),
          predicted_stockout_date: item.predicted_stockout_date || new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0],
          suggested_reorder_qty: Number(item.suggested_reorder_qty || 50)
        };
        nextProducts.push(p);

        if (p.current_stock > 0) {
          newLedgerEntries.unshift({
            id: `led-imp-${Date.now()}-${idx}`,
            product_id: p.id,
            location_id: 'Main Warehouse',
            change_qty: p.current_stock,
            type: 'receipt',
            timestamp: new Date().toISOString(),
            reference_id: 'IMPORT-CATALOG'
          });
        }
      }
    });

    const calculated = calculateDynamicPredictions(nextProducts, newLedgerEntries);
    setProducts(calculated);
    setLedger(newLedgerEntries);
    persistLocally(calculated, newLedgerEntries, receipts, deliveries, transfers, adjustments);
    showToast(`Successfully ingested ${newProducts.length} custom product SKUs!`, 'success');
  };

  // Feature: Bulk Receipt Import (Custom Inbound Shipments/Invoices)
  const importReceipts = async (parsedReceipts) => {
    try {
      if (isBackendOnline) {
        await api.importReceiptsApi(parsedReceipts);
      }
    } catch (e) {
      console.warn('Backend bulk receipt import failed:', e);
    }

    const nextProducts = [...products];
    const newLedgerEntries = [...ledger];
    const newReceipts = [...parsedReceipts, ...receipts];

    parsedReceipts.forEach((r) => {
      (r.items || []).forEach((it) => {
        let p = nextProducts.find(
          (x) =>
            (it.product_id && x.id === it.product_id) ||
            (it.sku && x.sku.toLowerCase() === it.sku.toLowerCase()) ||
            (it.product_name && x.name.toLowerCase() === it.product_name.toLowerCase())
        );

        if (!p) {
          p = {
            id: `prod-auto-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: it.product_name || `Imported Item ${it.sku}`,
            sku: it.sku || `SKU-${Date.now().toString().slice(-4)}`,
            category: 'Inbound Shipments',
            unit: it.unit || 'units',
            current_stock: 0,
            predicted_stockout_date: new Date(Date.now() + 28 * 86400000).toISOString().split('T')[0],
            suggested_reorder_qty: 50
          };
          nextProducts.unshift(p);
        }

        p.current_stock += Number(it.qty);
        it.product_id = p.id;

        newLedgerEntries.unshift({
          id: `led-imp-rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          product_id: p.id,
          location_id: r.location_id || 'Main Warehouse',
          change_qty: Number(it.qty),
          type: 'receipt',
          timestamp: new Date().toISOString(),
          reference_id: r.reference_id
        });
      });
    });

    const calculated = calculateDynamicPredictions(nextProducts, newLedgerEntries);
    setProducts(calculated);
    setLedger(newLedgerEntries);
    setReceipts(newReceipts);
    persistLocally(calculated, newLedgerEntries, newReceipts, deliveries, transfers, adjustments);
    showToast(`Imported ${parsedReceipts.length} receipt orders and updated physical stock!`, 'success');
  };

  // Feature: Reset to Factory Seed Data
  const resetToDemoData = async () => {
    try {
      if (isBackendOnline) {
        await api.resetDemoDataApi();
      }
    } catch (e) {
      console.warn('Backend reset failed:', e);
    }

    localStorage.removeItem(STORAGE_KEY);
    const seededLed = INITIAL_LEDGER_ENTRIES;
    const calculatedProds = calculateDynamicPredictions(INITIAL_PRODUCTS, seededLed);
    setProducts(calculatedProds);
    setLedger(seededLed);
    setReceipts(INITIAL_RECEIPTS);
    setDeliveries(INITIAL_DELIVERIES);
    setTransfers(INITIAL_TRANSFERS);
    setAdjustments(INITIAL_ADJUSTMENTS);
    persistLocally(calculatedProds, seededLed, INITIAL_RECEIPTS, INITIAL_DELIVERIES, INITIAL_TRANSFERS, INITIAL_ADJUSTMENTS);
    showToast('Factory demo dataset restored successfully!', 'info');
  };

  // Feature: Export Full System Backup
  const exportSystemBackup = () => {
    const backup = {
      system: 'StockSense IMS',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      products,
      ledger,
      receipts,
      deliveries,
      transfers,
      adjustments
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `stocksense_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    showToast('Complete business inventory backup downloaded!', 'success');
  };

  const exportSystemBackupExcel = () => {
    const productsMap = Object.fromEntries(products.map((p) => [p.id, p]));
    const rows = [
      ...formatProductsForExport(products, new Set(atRiskProducts.map((p) => p.id))).map((r) => ({ Sheet: 'Products', ...r })),
      ...formatLedgerForExport(ledger, productsMap).map((r) => ({ Sheet: 'Ledger', ...r })),
      ...formatReceiptsForExport(receipts).map((r) => ({ Sheet: 'Receipts', ...r })),
      ...formatDeliveriesForExport(deliveries).map((r) => ({ Sheet: 'Deliveries', ...r })),
      ...formatTransfersForExport(transfers).map((r) => ({ Sheet: 'Transfers', ...r })),
      ...formatAdjustmentsForExport(adjustments).map((r) => ({ Sheet: 'Adjustments', ...r }))
    ];
    exportToExcel(rows, `stocksense_backup_${new Date().toISOString().split('T')[0]}`, 'Inventory Snapshot');
    showToast('Excel inventory snapshot downloaded!', 'success');
  };

  // Feature: Import Full System Backup
  const importSystemBackup = async (backupData) => {
    if (!backupData || !Array.isArray(backupData.products)) {
      throw new Error('Invalid backup file. Must contain a products array.');
    }

    try {
      if (isBackendOnline) {
        await api.restoreSystemBackup(backupData);
      }
    } catch (e) {
      console.warn('Backend restore failed:', e);
    }

    const prods = calculateDynamicPredictions(backupData.products || [], backupData.ledger || []);
    const led = backupData.ledger || [];
    const recs = backupData.receipts || [];
    const dels = backupData.deliveries || [];
    const trfs = backupData.transfers || [];
    const adjs = backupData.adjustments || [];

    setProducts(prods);
    setLedger(led);
    setReceipts(recs);
    setDeliveries(dels);
    setTransfers(trfs);
    setAdjustments(adjs);
    persistLocally(prods, led, recs, dels, trfs, adjs);
    showToast('System snapshot restored successfully!', 'success');
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        ledger,
        receipts,
        deliveries,
        transfers,
        adjustments,
        atRiskProducts,
        loading,
        isBackendOnline,
        toast,
        showToast,
        addProduct,
        editProduct,
        removeProduct,
        addReceipt,
        addDelivery,
        addTransfer,
        addAdjustment,
        importProducts,
        importReceipts,
        resetToDemoData,
        exportSystemBackup,
        exportSystemBackupExcel,
        importSystemBackup,
        refreshData: loadAllData
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
