# StockSense - AI-Powered Inventory Management System (IMS)

StockSense is an intelligent, real-time inventory management platform engineered for small and medium-scale businesses to automate stock operations, eliminate manual ledger discrepancies, and predict stockouts before they happen using machine-learning consumption models.

Built during an 8-hour sprint for the Odoo Hackathon challenge.

---

## 🚀 Quick Start (Zero Config)

To run the application locally:

```bash
# 1. Install dependencies
npm install

# 2. Start the local Vite development server
npm run dev
```

The application will be live at `http://localhost:3000` (or `http://localhost:5173`).

---

## 🌟 Key Features & AI Differentiators

1. **AI Stockout Prediction Engine**:
   - Computes daily depletion velocities from historical Stock Ledger events.
   - Highlights items projected to deplete in `< 7 days` directly on the Dashboard and in top bar alerts.
2. **Natural Language Query Intelligence**:
   - Warehouse personnel can ask natural questions (e.g. *"How many steel rods do we have in Warehouse 2?"*, *"Which items run out this week?"*).
   - Returns instant, context-aware answers parsed against active telemetry and ledger records.
3. **Smart Anomaly Detection**:
   - Flags cycle count adjustments exceeding a `> 30%` variance threshold with visual warning banners to prevent fraudulent or mistaken stock entries.
4. **Complete Stock Flow Execution (Odoo Problem Statement Scenario)**:
   - **Step 1 (Receive Goods)**: Inbound vendor receipt (+100 units steel) increments on-hand stock and writes ledger entries.
   - **Step 2 (Move to Production Rack)**: Internal transfer moves stock between zones while keeping aggregate company balances consistent.
   - **Step 3 (Deliver Finished Goods)**: Outgoing customer dispatch decreases stock and logs `-qty` movement.
   - **Step 4 (Adjust Damaged Items)**: Cycle counts and damage write-offs (-3 kg steel) automatically record deltas.
5. **Dense Stock Ledger (Single Source of Truth)**:
   - Searchable, filterable audit log across all transactions with live one-click CSV export.

---

## 📂 Project Architecture & Folder Structure

```
stocksense/
├── index.html                  # HTML entrypoint
├── package.json                # Project dependencies & scripts
├── vite.config.js              # Vite configuration (port 3000)
├── tailwind.config.js          # Tailwind CSS styling design tokens
├── postcss.config.js           # PostCSS configuration
├── src/
│   ├── main.jsx                # Application root with React Router & Providers
│   ├── App.jsx                 # Routing configuration & Auth guards
│   ├── index.css               # Global Tailwind directives & custom scrollbars
│   │
│   ├── mockData/               # Realistic seed data (can be deleted once backend connects)
│   │   ├── products.js         # 12+ real-world industrial SKUs with predictive dates
│   │   ├── ledger.js           # 7+ days of transaction history per product
│   │   ├── receipts.js         # Inbound shipments and supplier list
│   │   ├── deliveries.js       # Outgoing customer orders
│   │   ├── transfers.js        # Internal movement events and locations
│   │   └── adjustments.js      # Cycle count adjustments and reasons
│   │
│   ├── api/                    # 🔌 Swappable API Layer (See Guide Below)
│   │   ├── inventoryApi.js     # Product CRUD, Ledger, Receipts, Deliveries, Transfers, Adjustments
│   │   └── aiApi.js            # Natural Language Query inference engine
│   │
│   ├── context/                # Unified React state management
│   │   ├── AuthContext.jsx     # Client authentication session & role state
│   │   └── InventoryContext.jsx# Live synchronized inventory & ledger state
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.jsx    # Application shell
│   │   │   ├── Sidebar.jsx     # Collapsible navigation sidebar
│   │   │   ├── Topbar.jsx      # Top header with search & alert badge
│   │   │   └── NotificationDropdown.jsx # Dropdown listing at-risk items (<7 days)
│   │   ├── common/
│   │   │   ├── KpiCard.jsx     # Metric cards (standard + AI Risk variant)
│   │   │   ├── Badge.jsx       # Status and category badges
│   │   │   ├── Toast.jsx       # Floating notification alert
│   │   │   ├── Modal.jsx       # Accessible modal dialog
│   │   │   ├── EmptyState.jsx  # Empty state view with CTA
│   │   │   └── LoadingSkeleton.jsx # Pulse skeleton loaders
│   │   └── ai/
│   │       ├── NaturalLanguageQueryBox.jsx # Interactive AI prompt bar
│   │       └── StockoutRiskBanner.jsx      # At-risk SKU alert banner
│   │
│   └── pages/
│       ├── auth/
│       │   ├── Login.jsx       # Sign in page
│       │   └── SignUp.jsx      # Sign up page
│       ├── Dashboard.jsx       # 6 KPI cards, AI at-risk table, AI query bar
│       ├── Products.jsx        # Product catalog with Add/Edit/Delete
│       ├── ProductDetail.jsx   # Recharts depletion curve & AI forecast
│       ├── Receipts.jsx        # Inbound vendor receipts (multi-line)
│       ├── Deliveries.jsx      # Outbound customer dispatches (multi-line)
│       ├── Transfers.jsx       # Inter-facility warehouse movements
│       ├── Adjustments.jsx     # Cycle count adjustments with anomaly detector
│       └── StockLedger.jsx     # Dense audit spreadsheet with CSV download
└── README.md
```

---

## 🔌 Connecting to a Real Backend (Teammate Guide)

All mock delays and in-memory arrays are strictly encapsulated in the **`/src/api`** folder. 
**No UI component or page code ever needs to be modified.** 

To swap mock data for real backend endpoints:

### 1. `src/api/inventoryApi.js`
Replace the simulated promises with `fetch` or `axios` calls:

* **Products**:
  - `getProducts()` ➡️ `GET /api/products`
  - `getProductById(id)` ➡️ `GET /api/products/:id`
  - `createProduct(data)` ➡️ `POST /api/products`
  - `updateProduct(id, updates)` ➡️ `PUT /api/products/:id`
  - `deleteProduct(id)` ➡️ `DELETE /api/products/:id`
* **Stock Ledger**:
  - `getLedgerEntries(productId, filters)` ➡️ `GET /api/ledger?productId=...&type=...`
* **Receipts & Inbound**:
  - `getReceipts()` ➡️ `GET /api/receipts`
  - `createReceipt(data)` ➡️ `POST /api/receipts`
* **Deliveries & Dispatch**:
  - `getDeliveries()` ➡️ `GET /api/deliveries`
  - `createDelivery(data)` ➡️ `POST /api/deliveries`
* **Transfers**:
  - `getTransfers()` ➡️ `GET /api/transfers`
  - `createTransfer(data)` ➡️ `POST /api/transfers`
* **Adjustments**:
  - `getAdjustments()` ➡️ `GET /api/adjustments`
  - `createAdjustment(data)` ➡️ `POST /api/adjustments`

### 2. `src/api/aiApi.js`
Replace `queryStockSenseAI(queryText, currentProducts, currentLedger)`:
```javascript
export const queryStockSenseAI = async (queryText) => {
  const response = await fetch('/api/ai/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: queryText })
  });
  const data = await response.json();
  return data.answer;
};
```

---

## 🧪 Demo Script for Judges

1. **Login**: Go to `/login` and click "Sign In to Dashboard" (pre-filled demo credentials).
2. **Dashboard Review**:
   - Show the **6 KPI cards**, pointing out the 6th card: **"Products at Risk (7 Days)"**.
   - Show the **Natural Language Query Box**: Click the *"How many steel rods do we have?"* prompt chip and demonstrate the real-time AI response.
3. **Execute Odoo Problem Statement Flow**:
   - **Receive**: Go to *Receipts*, click *New Inbound Receipt*, receive 100 kg of *Reinforced Steel Rods 12mm*. Notice stock increases immediately and a ledger entry is created.
   - **Transfer**: Go to *Transfers*, click *New Internal Transfer*, move 50 kg from *Main Warehouse* to *Production Floor*.
   - **Deliver**: Go to *Deliveries*, dispatch 20 kg of steel to *Metro Infrastructure*. Stock decreases to 150 kg.
   - **Adjust**: Go to *Adjustments*, select steel rods, input a physical count that is 40% lower (e.g., 90 kg). Point out the **Anomaly Detection Warning Banner** (`>30% variance detected`). Submit and see stock adjust.
4. **Product Analytics**:
   - Go to *Products* and click *Reinforced Steel Rods 12mm*.
   - Show the **Recharts historical trend and projected dashed forecast line** extending to the zero-depletion intercept.
5. **Audit Trail**:
   - Go to *Stock Ledger* to inspect the dense, filterable single source of truth log and click **Export Audit Log (CSV)**.
