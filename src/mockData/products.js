// Helper to format ISO date YYYY-MM-DD relative to today
const getFutureDate = (daysAhead) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
};

export const INITIAL_PRODUCTS = [
  {
    id: "prod-1",
    name: "Reinforced Steel Rods 12mm",
    sku: "STL-12MM-001",
    category: "Metals & Structural",
    unit: "kg",
    current_stock: 120,
    predicted_stockout_date: getFutureDate(3), // Within 7 days -> Urgent Risk!
    suggested_reorder_qty: 350
  },
  {
    id: "prod-2",
    name: "Portland Cement Grade 53",
    sku: "CEM-G53-002",
    category: "Construction & Masonry",
    unit: "bags",
    current_stock: 45,
    predicted_stockout_date: getFutureDate(4), // Within 7 days -> Urgent Risk!
    suggested_reorder_qty: 200
  },
  {
    id: "prod-3",
    name: "Industrial Copper Wire 2.5mm",
    sku: "CPR-W25-003",
    category: "Electrical & Wiring",
    unit: "meters",
    current_stock: 85,
    predicted_stockout_date: getFutureDate(6), // Within 7 days -> Urgent Risk!
    suggested_reorder_qty: 500
  },
  {
    id: "prod-4",
    name: "Galvanized Iron Pipes 2\"",
    sku: "PIP-GI20-004",
    category: "Plumbing & Piping",
    unit: "units",
    current_stock: 15,
    predicted_stockout_date: getFutureDate(2), // Critical stockout in 2 days!
    suggested_reorder_qty: 80
  },
  {
    id: "prod-5",
    name: "Heavy Duty Aluminum Beams",
    sku: "ALU-BM80-005",
    category: "Metals & Structural",
    unit: "units",
    current_stock: 280,
    predicted_stockout_date: getFutureDate(24),
    suggested_reorder_qty: 150
  },
  {
    id: "prod-6",
    name: "High-Tensile Fastener Bolts M10",
    sku: "FST-M10-006",
    category: "Hardware & Fasteners",
    unit: "units",
    current_stock: 1400,
    predicted_stockout_date: getFutureDate(45),
    suggested_reorder_qty: 2000
  },
  {
    id: "prod-7",
    name: "Anti-Corrosive Epoxy Primer",
    sku: "CHM-EPOX-007",
    category: "Chemicals & Coatings",
    unit: "liters",
    current_stock: 65,
    predicted_stockout_date: getFutureDate(5), // Within 7 days -> Urgent Risk!
    suggested_reorder_qty: 120
  },
  {
    id: "prod-8",
    name: "Plywood Marine Grade 18mm",
    sku: "WOD-PLY18-008",
    category: "Timber & Woodworks",
    unit: "sheets",
    current_stock: 0, // Out of stock
    predicted_stockout_date: getFutureDate(-1), // Already stockout
    suggested_reorder_qty: 100
  },
  {
    id: "prod-9",
    name: "PVC Conduit Pipes 25mm",
    sku: "ELE-PVC25-009",
    category: "Electrical & Wiring",
    unit: "meters",
    current_stock: 640,
    predicted_stockout_date: getFutureDate(30),
    suggested_reorder_qty: 400
  },
  {
    id: "prod-10",
    name: "Safety Helmets Industrial ANSI Z89",
    sku: "PPE-HLM-010",
    category: "Safety & PPE",
    unit: "units",
    current_stock: 8,
    predicted_stockout_date: getFutureDate(1), // Critical 1 day
    suggested_reorder_qty: 50
  },
  {
    id: "prod-11",
    name: "Hydraulic Oil ISO VG 46",
    sku: "LUB-HYD46-011",
    category: "Chemicals & Coatings",
    unit: "liters",
    current_stock: 450,
    predicted_stockout_date: getFutureDate(35),
    suggested_reorder_qty: 250
  },
  {
    id: "prod-12",
    name: "Ceramic Floor Tiles 60x60cm",
    sku: "CER-FL60-012",
    category: "Construction & Masonry",
    unit: "boxes",
    current_stock: 190,
    predicted_stockout_date: getFutureDate(18),
    suggested_reorder_qty: 120
  }
];
