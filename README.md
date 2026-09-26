# StockSense

StockSense is an AI-assisted inventory management system for small and mid-sized warehouses. It tracks receipts, deliveries, transfers, adjustments, ledger history, stockout risk, and reorder recommendations.

## Run the project

Requirements: Node.js 18 or newer.

From the project root:

```powershell
cd "C:\Users\sreev\OneDrive\Desktop\oodo hackathon"
npm run install:frontend
npm run seed
```

Start the backend in Terminal 1:

```powershell
npm run dev:server
```

The API runs at `http://localhost:5000`.

Start the frontend in Terminal 2:

```powershell
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:3000` or `http://localhost:5173`.

The login page accepts any valid email address and a password with at least four characters for the demo. Example: `manager@stocksense.io` / `demo1234`.

## Useful commands

```powershell
npm run install:frontend  # Install frontend dependencies
npm run seed              # Create/reset demo inventory data
npm run dev:server        # Start backend with file watching
npm run dev               # Start Vite frontend
npm run build             # Create production frontend build
npm start                 # Start backend without file watching
```

If port `5000` is already in use, the backend may already be running. Verify it at `http://localhost:5000/api/health`. To use another port:

```powershell
$env:PORT=5001
npm run dev:server
```

Then set `VITE_API_URL=http://localhost:5001/api` before starting the frontend.

## Project structure

```text
StockSense/
├── frontend/
│   ├── src/
│   │   ├── api/              # REST and AI clients
│   │   ├── components/       # Layout, KPI, charts, modals, and AI UI
│   │   ├── context/          # Auth and inventory state
│   │   ├── pages/            # Dashboard, operations, Data Hub, and auth
│   │   └── utils/            # Excel/CSV import and export helpers
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── server.js             # Express API
│   ├── services/             # Prediction and alert services
│   ├── scripts/seed.js       # Demo data generator
│   ├── data/stocksense.json  # Local persistent store
│   └── .env.example
├── package.json              # Root scripts
└── README.md
```

## Main features

- Dashboard KPI cards with Excel/CSV downloads and drill-down modals
- Recharts stock-by-category, velocity, and warehouse distribution views
- Automated purchase order export for at-risk products
- Product, receipt, delivery, transfer, adjustment, and ledger workflows
- Excel/CSV product dataset and receipt/invoice ingestion
- Flexible header detection with import preview and merge/replace modes
- Sample Excel and CSV templates
- JSON backup and Excel inventory snapshot export
- Full restore and reset-to-demo workflows
- Stockout prediction based on seven-day depletion velocity
- Natural-language inventory queries with rule-based fallback
- Offline localStorage mode when the Express backend is unavailable
- Login-protected dashboard and global product search

## Backend API

The frontend connects to `http://localhost:5000/api` by default. Override it with `VITE_API_URL`.

Core endpoints:

```text
GET/POST        /api/products
GET/PUT/DELETE  /api/products/:id
GET             /api/products/at-risk
GET/POST        /api/ledger
GET/POST        /api/receipts
GET/POST        /api/deliveries
GET/POST        /api/transfers
GET/POST        /api/adjustments
POST            /api/ai/query
POST            /api/alerts/trigger
POST            /api/import/products
POST            /api/import/receipts
GET             /api/backup
POST            /api/restore
POST            /api/reset-demo
GET             /api/health
```

The backend persists data in `backend/data/stocksense.json`. Running `npm run seed` recreates the demo dataset with industrial products, seven days of ledger activity, at-risk items, and the steel receipt/transfer/delivery/adjustment scenario.

## Demo flow

1. Sign in with the demo credentials.
2. Review dashboard KPIs, charts, recent movements, and at-risk products.
3. Use the AI query box to ask about stock, risk, or reorder needs.
4. Receive stock from Receipts.
5. Move stock using Transfers.
6. Dispatch stock using Deliveries.
7. Correct a physical count using Adjustments and demonstrate the anomaly warning.
8. Use Data & Imports Hub to import a spreadsheet, export a backup, or reset the demo.
9. Use Stock Ledger to inspect and export the immutable audit trail.

## Notes

- Authentication is demo-only and does not provide production user management.
- The local JSON store is intended for zero-configuration demos. Production deployments should use a database and secure authentication.
- Generated local data and dependency folders are excluded from Git by `.gitignore`.
