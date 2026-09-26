export const INITIAL_ADJUSTMENTS = [
  {
    id: "adj-1",
    reference_id: "ADJ-2024-004",
    date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    product_id: "prod-1",
    product_name: "Reinforced Steel Rods 12mm",
    location: "Main Warehouse",
    system_qty: 125,
    counted_qty: 123,
    delta: -2,
    reason: "Damaged during handling on forklift",
    status: "Done"
  },
  {
    id: "adj-2",
    reference_id: "ADJ-2024-009",
    date: new Date().toISOString().split('T')[0],
    product_id: "prod-1",
    product_name: "Reinforced Steel Rods 12mm",
    location: "Main Warehouse",
    system_qty: 123,
    counted_qty: 120,
    delta: -3,
    reason: "Rust damage discovered during routine cycle count",
    status: "Done"
  },
  {
    id: "adj-3",
    reference_id: "ADJ-2024-005",
    date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    product_id: "prod-2",
    product_name: "Portland Cement Grade 53",
    location: "Main Warehouse",
    system_qty: 50,
    counted_qty: 45,
    delta: -5,
    reason: "Bags torn during unloading",
    status: "Done"
  }
];
