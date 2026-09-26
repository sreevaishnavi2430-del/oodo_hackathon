export const INITIAL_TRANSFERS = [
  {
    id: "trf-1",
    reference_id: "TRF-2024-010",
    date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
    product_id: "prod-1",
    product_name: "Reinforced Steel Rods 12mm",
    qty: 50,
    unit: "kg",
    from_location: "Main Warehouse",
    to_location: "Production Floor",
    status: "Done"
  },
  {
    id: "trf-2",
    reference_id: "TRF-2024-011",
    date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    product_id: "prod-2",
    product_name: "Portland Cement Grade 53",
    qty: 30,
    unit: "bags",
    from_location: "Main Warehouse",
    to_location: "Warehouse 2",
    status: "Done"
  },
  {
    id: "trf-3",
    reference_id: "TRF-2024-018",
    date: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0],
    product_id: "prod-5",
    product_name: "Heavy Duty Aluminum Beams",
    qty: 20,
    unit: "units",
    from_location: "Warehouse 2",
    to_location: "Rack B",
    status: "Ready"
  }
];

export const LOCATIONS = [
  "Main Warehouse",
  "Production Floor",
  "Warehouse 2",
  "Rack A",
  "Rack B",
  "Dispatch Bay"
];
