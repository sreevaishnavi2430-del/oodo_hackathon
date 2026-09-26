// Helper to create timestamp days ago
const daysAgo = (days, hours = 10, minutes = 30) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

export const INITIAL_LEDGER_ENTRIES = [
  // --- prod-1: Reinforced Steel Rods (Simulating Odoo sample scenario: received 100, transferred, delivered 20, adjusted -3) ---
  { id: "led-101", product_id: "prod-1", location_id: "Main Warehouse", change_qty: 250, type: "receipt", timestamp: daysAgo(7, 9, 15), reference_id: "REC-2024-001" },
  { id: "led-102", product_id: "prod-1", location_id: "Production Floor", change_qty: 0, type: "transfer", timestamp: daysAgo(6, 14, 0), reference_id: "TRF-2024-010" },
  { id: "led-103", product_id: "prod-1", location_id: "Main Warehouse", change_qty: -40, type: "delivery", timestamp: daysAgo(5, 11, 20), reference_id: "DEL-2024-005" },
  { id: "led-104", product_id: "prod-1", location_id: "Production Floor", change_qty: -35, type: "delivery", timestamp: daysAgo(4, 16, 45), reference_id: "DEL-2024-012" },
  { id: "led-105", product_id: "prod-1", location_id: "Main Warehouse", change_qty: 100, type: "receipt", timestamp: daysAgo(3, 8, 30), reference_id: "REC-2024-018" },
  { id: "led-106", product_id: "prod-1", location_id: "Main Warehouse", change_qty: -50, type: "delivery", timestamp: daysAgo(2, 13, 10), reference_id: "DEL-2024-022" },
  { id: "led-107", product_id: "prod-1", location_id: "Main Warehouse", change_qty: -2, type: "adjustment", timestamp: daysAgo(1, 17, 0), reference_id: "ADJ-2024-004" },
  { id: "led-108", product_id: "prod-1", location_id: "Main Warehouse", change_qty: -3, type: "adjustment", timestamp: daysAgo(0, 10, 0), reference_id: "ADJ-2024-009" },

  // --- prod-2: Portland Cement Grade 53 ---
  { id: "led-201", product_id: "prod-2", location_id: "Main Warehouse", change_qty: 150, type: "receipt", timestamp: daysAgo(7, 10, 0), reference_id: "REC-2024-002" },
  { id: "led-202", product_id: "prod-2", location_id: "Main Warehouse", change_qty: -25, type: "delivery", timestamp: daysAgo(6, 12, 30), reference_id: "DEL-2024-006" },
  { id: "led-203", product_id: "prod-2", location_id: "Warehouse 2", change_qty: 0, type: "transfer", timestamp: daysAgo(5, 15, 0), reference_id: "TRF-2024-011" },
  { id: "led-204", product_id: "prod-2", location_id: "Main Warehouse", change_qty: -30, type: "delivery", timestamp: daysAgo(4, 9, 45), reference_id: "DEL-2024-014" },
  { id: "led-205", product_id: "prod-2", location_id: "Main Warehouse", change_qty: -20, type: "delivery", timestamp: daysAgo(3, 14, 15), reference_id: "DEL-2024-019" },
  { id: "led-206", product_id: "prod-2", location_id: "Main Warehouse", change_qty: -25, type: "delivery", timestamp: daysAgo(2, 16, 0), reference_id: "DEL-2024-025" },
  { id: "led-207", product_id: "prod-2", location_id: "Main Warehouse", change_qty: -5, type: "adjustment", timestamp: daysAgo(1, 11, 20), reference_id: "ADJ-2024-005" },

  // --- prod-3: Industrial Copper Wire 2.5mm ---
  { id: "led-301", product_id: "prod-3", location_id: "Main Warehouse", change_qty: 300, type: "receipt", timestamp: daysAgo(7, 8, 45), reference_id: "REC-2024-003" },
  { id: "led-302", product_id: "prod-3", location_id: "Production Floor", change_qty: -60, type: "delivery", timestamp: daysAgo(6, 10, 15), reference_id: "DEL-2024-007" },
  { id: "led-303", product_id: "prod-3", location_id: "Main Warehouse", change_qty: -45, type: "delivery", timestamp: daysAgo(5, 13, 30), reference_id: "DEL-2024-013" },
  { id: "led-304", product_id: "prod-3", location_id: "Warehouse 2", change_qty: -50, type: "delivery", timestamp: daysAgo(4, 11, 0), reference_id: "DEL-2024-017" },
  { id: "led-305", product_id: "prod-3", location_id: "Main Warehouse", change_qty: -35, type: "delivery", timestamp: daysAgo(3, 15, 20), reference_id: "DEL-2024-021" },
  { id: "led-306", product_id: "prod-3", location_id: "Production Floor", change_qty: -25, type: "delivery", timestamp: daysAgo(1, 9, 40), reference_id: "DEL-2024-028" },

  // --- prod-4: Galvanized Iron Pipes 2" ---
  { id: "led-401", product_id: "prod-4", location_id: "Main Warehouse", change_qty: 80, type: "receipt", timestamp: daysAgo(7, 11, 15), reference_id: "REC-2024-004" },
  { id: "led-402", product_id: "prod-4", location_id: "Main Warehouse", change_qty: -20, type: "delivery", timestamp: daysAgo(6, 14, 30), reference_id: "DEL-2024-008" },
  { id: "led-403", product_id: "prod-4", location_id: "Main Warehouse", change_qty: -15, type: "delivery", timestamp: daysAgo(5, 9, 20), reference_id: "DEL-2024-015" },
  { id: "led-404", product_id: "prod-4", location_id: "Warehouse 2", change_qty: -18, type: "delivery", timestamp: daysAgo(3, 16, 10), reference_id: "DEL-2024-023" },
  { id: "led-405", product_id: "prod-4", location_id: "Main Warehouse", change_qty: -12, type: "delivery", timestamp: daysAgo(1, 13, 0), reference_id: "DEL-2024-029" },

  // --- prod-5: Aluminum Beams ---
  { id: "led-501", product_id: "prod-5", location_id: "Main Warehouse", change_qty: 350, type: "receipt", timestamp: daysAgo(7, 13, 0), reference_id: "REC-2024-005" },
  { id: "led-502", product_id: "prod-5", location_id: "Main Warehouse", change_qty: -40, type: "delivery", timestamp: daysAgo(5, 10, 0), reference_id: "DEL-2024-016" },
  { id: "led-503", product_id: "prod-5", location_id: "Warehouse 2", change_qty: -30, type: "delivery", timestamp: daysAgo(2, 14, 45), reference_id: "DEL-2024-026" },

  // --- prod-6: Fastener Bolts M10 ---
  { id: "led-601", product_id: "prod-6", location_id: "Main Warehouse", change_qty: 2000, type: "receipt", timestamp: daysAgo(7, 15, 20), reference_id: "REC-2024-006" },
  { id: "led-602", product_id: "prod-6", location_id: "Main Warehouse", change_qty: -300, type: "delivery", timestamp: daysAgo(4, 12, 0), reference_id: "DEL-2024-018" },
  { id: "led-603", product_id: "prod-6", location_id: "Production Floor", change_qty: -300, type: "delivery", timestamp: daysAgo(2, 10, 15), reference_id: "DEL-2024-027" },

  // --- prod-7: Anti-Corrosive Epoxy Primer ---
  { id: "led-701", product_id: "prod-7", location_id: "Main Warehouse", change_qty: 120, type: "receipt", timestamp: daysAgo(7, 9, 30), reference_id: "REC-2024-007" },
  { id: "led-702", product_id: "prod-7", location_id: "Main Warehouse", change_qty: -25, type: "delivery", timestamp: daysAgo(5, 14, 0), reference_id: "DEL-2024-020" },
  { id: "led-703", product_id: "prod-7", location_id: "Main Warehouse", change_qty: -30, type: "delivery", timestamp: daysAgo(2, 11, 45), reference_id: "DEL-2024-024" },

  // --- prod-8: Plywood Marine Grade ---
  { id: "led-801", product_id: "prod-8", location_id: "Main Warehouse", change_qty: 50, type: "receipt", timestamp: daysAgo(7, 10, 45), reference_id: "REC-2024-008" },
  { id: "led-802", product_id: "prod-8", location_id: "Main Warehouse", change_qty: -50, type: "delivery", timestamp: daysAgo(3, 16, 30), reference_id: "DEL-2024-030" },

  // --- prod-9: PVC Conduit Pipes ---
  { id: "led-901", product_id: "prod-9", location_id: "Main Warehouse", change_qty: 800, type: "receipt", timestamp: daysAgo(7, 14, 15), reference_id: "REC-2024-009" },
  { id: "led-902", product_id: "prod-9", location_id: "Main Warehouse", change_qty: -160, type: "delivery", timestamp: daysAgo(4, 9, 0), reference_id: "DEL-2024-031" },

  // --- prod-10: Safety Helmets ---
  { id: "led-1001", product_id: "prod-10", location_id: "Main Warehouse", change_qty: 40, type: "receipt", timestamp: daysAgo(7, 8, 30), reference_id: "REC-2024-010" },
  { id: "led-1002", product_id: "prod-10", location_id: "Production Floor", change_qty: -32, type: "delivery", timestamp: daysAgo(3, 13, 0), reference_id: "DEL-2024-032" }
];
