export const INITIAL_RECEIPTS = [
  {
    id: "rec-1",
    reference_id: "REC-2024-018",
    date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    supplier: "Tata Steel & Alloys Ltd.",
    status: "Done",
    items: [
      { product_id: "prod-1", product_name: "Reinforced Steel Rods 12mm", qty: 100, unit: "kg" }
    ],
    total_qty: 100
  },
  {
    id: "rec-2",
    reference_id: "REC-2024-001",
    date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    supplier: "Tata Steel & Alloys Ltd.",
    status: "Done",
    items: [
      { product_id: "prod-1", product_name: "Reinforced Steel Rods 12mm", qty: 250, unit: "kg" }
    ],
    total_qty: 250
  },
  {
    id: "rec-3",
    reference_id: "REC-2024-002",
    date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    supplier: "UltraTech Building Solutions",
    status: "Done",
    items: [
      { product_id: "prod-2", product_name: "Portland Cement Grade 53", qty: 150, unit: "bags" }
    ],
    total_qty: 150
  },
  {
    id: "rec-4",
    reference_id: "REC-2024-024",
    date: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0],
    supplier: "Polycab Wires & Cables",
    status: "Waiting",
    items: [
      { product_id: "prod-3", product_name: "Industrial Copper Wire 2.5mm", qty: 200, unit: "meters" }
    ],
    total_qty: 200
  }
];

export const SUPPLIERS = [
  "Tata Steel & Alloys Ltd.",
  "UltraTech Building Solutions",
  "Polycab Wires & Cables",
  "Jindal Pipes Global",
  "Asian Paints & Coatings",
  "Karam Safety Equipment"
];
