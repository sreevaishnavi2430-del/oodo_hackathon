import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import * as api from '../api/inventoryApi';

const InventoryContext = createContext(null);

export const InventoryProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'warning' | 'error' }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

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
      setProducts(prods);
      setLedger(led);
      setReceipts(recs);
      setDeliveries(dels);
      setTransfers(trfs);
      setAdjustments(adjs);
    } catch (err) {
      console.error("Failed to load inventory data", err);
      showToast("Failed to load initial data", "error");
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

  // Operations
  const addProduct = async (productData) => {
    const created = await api.createProduct(productData);
    setProducts((prev) => [created, ...prev]);
    // Refresh ledger to capture initial stock entry if applicable
    const updatedLedger = await api.getLedgerEntries();
    setLedger(updatedLedger);
    showToast(`Product "${created.name}" created successfully!`, 'success');
    return created;
  };

  const editProduct = async (id, updates) => {
    const updated = await api.updateProduct(id, updates);
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    showToast(`Product "${updated.name}" updated`, 'success');
    return updated;
  };

  const removeProduct = async (id) => {
    await api.deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast(`Product deleted`, 'success');
  };

  const addReceipt = async (receiptData) => {
    const created = await api.createReceipt(receiptData);
    // Reload products and ledger to synchronize
    const [updatedProds, updatedLed] = await Promise.all([
      api.getProducts(),
      api.getLedgerEntries()
    ]);
    setProducts(updatedProds);
    setLedger(updatedLed);
    setReceipts((prev) => [created, ...prev]);
    showToast(`Receipt ${created.reference_id} processed: +${created.total_qty} units received!`, 'success');
    return created;
  };

  const addDelivery = async (deliveryData) => {
    const created = await api.createDelivery(deliveryData);
    const [updatedProds, updatedLed] = await Promise.all([
      api.getProducts(),
      api.getLedgerEntries()
    ]);
    setProducts(updatedProds);
    setLedger(updatedLed);
    setDeliveries((prev) => [created, ...prev]);
    showToast(`Delivery ${created.reference_id} validated: -${created.total_qty} units dispatched!`, 'success');
    return created;
  };

  const addTransfer = async (transferData) => {
    const created = await api.createTransfer(transferData);
    const updatedLed = await api.getLedgerEntries();
    setLedger(updatedLed);
    setTransfers((prev) => [created, ...prev]);
    showToast(`Internal transfer ${created.reference_id} logged: ${created.from_location} → ${created.to_location}`, 'success');
    return created;
  };

  const addAdjustment = async (adjData) => {
    const created = await api.createAdjustment(adjData);
    const [updatedProds, updatedLed] = await Promise.all([
      api.getProducts(),
      api.getLedgerEntries()
    ]);
    setProducts(updatedProds);
    setLedger(updatedLed);
    setAdjustments((prev) => [created, ...prev]);
    showToast(`Adjustment ${created.reference_id} recorded (${created.delta > 0 ? '+' : ''}${created.delta})`, 'success');
    return created;
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
        toast,
        showToast,
        addProduct,
        editProduct,
        removeProduct,
        addReceipt,
        addDelivery,
        addTransfer,
        addAdjustment,
        refreshData: loadAllData,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
};
