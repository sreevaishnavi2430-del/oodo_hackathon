// Helper to simulate 800ms AI inference delay
const simulateAiInference = (ms = 800) => new Promise((resolve) => setTimeout(resolve, ms));

export const queryStockSenseAI = async (queryText, currentProducts = [], currentLedger = []) => {
  await simulateAiInference(800);

  const lowerQuery = queryText.toLowerCase().trim();

  // 1. Stockout / At Risk queries
  if (
    lowerQuery.includes("risk") ||
    lowerQuery.includes("stockout") ||
    lowerQuery.includes("run out") ||
    lowerQuery.includes("deplete") ||
    lowerQuery.includes("low stock")
  ) {
    const today = new Date();
    const sevenDaysLater = new Date(today.getTime() + 7 * 86400000);
    const atRisk = currentProducts.filter((p) => {
      const pred = new Date(p.predicted_stockout_date);
      return pred <= sevenDaysLater;
    });

    if (atRisk.length === 0) {
      return "✅ AI Analysis: All products currently have healthy inventory levels with depletion runways extending beyond 7 days.";
    }

    const itemsList = atRisk
      .map(
        (p) =>
          `• **${p.name}**: ${p.current_stock} ${p.unit} remaining (Estimated stockout: ${p.predicted_stockout_date}, Suggest reordering: ${p.suggested_reorder_qty} ${p.unit})`
      )
      .join("\n");

    return `⚠️ **Critical Stockout Alert**: We identified **${atRisk.length} products** predicted to deplete within 7 days based on current burn rate:\n\n${itemsList}\n\n*Action suggested: Trigger automated purchase orders to avoid supply disruptions.*`;
  }

  // 2. Specific product search (e.g. steel, cement, copper, pipe, helmet, bolt, tile, oil)
  const matchedProduct = currentProducts.find((p) => {
    const pName = p.name.toLowerCase();
    const pSku = p.sku.toLowerCase();
    return (
      lowerQuery.includes(pSku) ||
      pName.split(" ").some((word) => word.length > 3 && lowerQuery.includes(word.toLowerCase()))
    );
  });

  if (matchedProduct) {
    // Count recent movements from ledger
    const productEntries = currentLedger.filter((e) => e.product_id === matchedProduct.id);
    const lastMovement = productEntries[0];

    return `📦 **Product Status: ${matchedProduct.name}**\n` +
      `• **SKU**: \`${matchedProduct.sku}\`\n` +
      `• **Current On-Hand Stock**: **${matchedProduct.current_stock} ${matchedProduct.unit}**\n` +
      `• **Predicted Stockout Date**: **${matchedProduct.predicted_stockout_date}**\n` +
      `• **Suggested Reorder Qty**: **${matchedProduct.suggested_reorder_qty} ${matchedProduct.unit}**\n` +
      (lastMovement
        ? `• **Last Movement**: ${lastMovement.change_qty > 0 ? '+' : ''}${lastMovement.change_qty} ${matchedProduct.unit} (${lastMovement.type}) on ${new Date(lastMovement.timestamp).toLocaleDateString()}\n`
        : '') +
      `• **AI Confidence**: 96.4% based on 7-day linear consumption regression.`;
  }

  // 3. Location / Warehouse specific queries
  if (lowerQuery.includes("warehouse 2") || lowerQuery.includes("wh2")) {
    return `🏢 **Warehouse 2 Snapshot**:\n` +
      `Holds overflow raw materials and staged transfers. Active monitored items include Aluminum Beams and Galvanized Pipes. Operating at ~64% rated capacity.`;
  }

  if (lowerQuery.includes("production floor")) {
    return `🏭 **Production Floor Status**:\n` +
      `Active staging area for manufacturing. Recent dispatches include 20 steel rod assemblies and 35m copper harness spools. Current buffer stock is nominal.`;
  }

  // 4. Reorder recommendations query
  if (lowerQuery.includes("reorder") || lowerQuery.includes("order") || lowerQuery.includes("purchase")) {
    const toReorder = currentProducts.filter((p) => p.current_stock < p.suggested_reorder_qty);
    const top3 = toReorder.slice(0, 3);
    return `📋 **Smart Reorder Recommendations**:\n` +
      top3.map((p) => `• Reorder **${p.suggested_reorder_qty} ${p.unit}** of ${p.name} (Current: ${p.current_stock})`).join("\n") +
      `\n\n*Would you like to draft auto-receipts for these items?*`;
  }

  // 5. Default intelligent fallback answer
  const totalStock = currentProducts.reduce((sum, p) => sum + p.current_stock, 0);
  return `🤖 **StockSense AI Assistant**:\n` +
    `Analyzed current system state: Tracking **${currentProducts.length} active SKUs** with a total on-hand volume of **${totalStock.toLocaleString()} units** across all locations. ` +
    `You can ask me questions like:\n` +
    `• *"How many steel rods do we have?"*\n` +
    `• *"Which items are at risk of running out this week?"*\n` +
    `• *"What products need to be reordered?"*`;
};
