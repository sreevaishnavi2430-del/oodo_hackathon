export const INITIAL_DELIVERIES = [
  {
    id: "del-1",
    reference_id: "DEL-2024-022",
    date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    customer: "Metro Infrastructure Project Site A",
    status: "Done",
    items: [
      { product_id: "prod-1", product_name: "Reinforced Steel Rods 12mm", qty: 50, unit: "kg" }
    ],
    total_qty: 50
  },
  {
    id: "del-2",
    reference_id: "DEL-2024-012",
    date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
    customer: "Skyline Towers Construction",
    status: "Done",
    items: [
      { product_id: "prod-1", product_name: "Reinforced Steel Rods 12mm", qty: 35, unit: "kg" }
    ],
    total_qty: 35
  },
  {
    id: "del-3",
    reference_id: "DEL-2024-035",
    date: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0],
    customer: "Apex Residential Builders",
    status: "Waiting",
    items: [
      { product_id: "prod-2", product_name: "Portland Cement Grade 53", qty: 40, unit: "bags" }
    ],
    total_qty: 40
  },
  {
    id: "del-4",
    reference_id: "DEL-2024-036",
    date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    customer: "PowerGrid Maintenance Corp",
    status: "Ready",
    items: [
      { product_id: "prod-3", product_name: "Industrial Copper Wire 2.5mm", qty: 50, unit: "meters" }
    ],
    total_qty: 50
  }
];

export const CUSTOMERS = [
  "Metro Infrastructure Project Site A",
  "Skyline Towers Construction",
  "Apex Residential Builders",
  "PowerGrid Maintenance Corp",
  "City Urban Development Authority"
];
