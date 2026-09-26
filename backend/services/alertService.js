export function checkAndDispatchAlerts(store) {
  const limit = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const products = store.products.filter((p) => p.predicted_stockout_date <= limit);
  const alerts = products.map((p) => ({ product_id: p.id, product: p.name, message: `${p.name} is projected to stock out by ${p.predicted_stockout_date}`, channel: 'console' }));
  alerts.forEach((alert) => console.log(`[StockSense alert] ${alert.message}`));
  return { dispatched: alerts.length, alerts };
}
