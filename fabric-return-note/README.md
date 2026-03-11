# Fabric Return Note Application

A minimal, responsive web app to create Fabric Return Notes (factory) and acknowledge receipt in a Log Book (warehouse).

## Features

- New Return Note form (saves + clears + success message)
- Log Book ledger (newest-first)
- Status workflow:
  - New entries start as **Pending Receipt**
  - Warehouse can **Tick + Submit** to acknowledge
  - After acknowledgement, entry becomes **Received** and is **locked**
- Persistence via browser `localStorage` (prototype-friendly)

## Run locally (Windows)

1. Install Node.js LTS (includes npm).
2. In a terminal:

```bash
cd "C:\Users\Shail Mehta\Documents\fabric-return-note"
npm install
npm run dev
```

Then open the URL shown (usually `http://localhost:3000`).

## Pages

- `/new` – New Fabric Return Note
- `/logbook` – Log Book (acknowledge + lock)

