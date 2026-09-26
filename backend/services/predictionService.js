import { addDays, isoDate } from '../utils.js';

export function recalculateProduct(product, ledger) {
  const cutoff = Date.now() - 7 * 86400000;
  const depleted = ledger.filter((entry) => entry.product_id === product.id && new Date(entry.timestamp).getTime() >= cutoff && (entry.type === 'delivery' || (entry.type === 'adjustment' && entry.change_qty < 0)))
    .reduce((sum, entry) => sum + Math.abs(Number(entry.change_qty)), 0);
  const rate = Math.max(0.1, depleted / 7);
  const days = Number(product.current_stock) / rate;
  return { ...product, predicted_stockout_date: isoDate(addDays(new Date(), days)), suggested_reorder_qty: Math.round(rate * 5) };
}

export function recalculateAll(products, ledger) { return products.map((p) => recalculateProduct(p, ledger)); }
