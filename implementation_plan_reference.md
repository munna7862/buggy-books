# BuggyBooks Implementation Reference

This file serves as a persistent reference of our implementation plan, so we can refer to it to avoid context token limits.

## Phase 1: Project Scaffolding
- **Root**: `package.json` configured with `concurrently` to start both frontend and backend.
- **Backend**: Basic Node.js + Express setup with TypeScript.
- **Frontend**: Scaffolding with Vite (React + TS).

## Phase 2: Backend Implementation (The API Layer)
- Model & Database (`data/db.json`): Sample books and cart schema.
- Server configuration (`server.ts`) with Express and `express-rate-limit`.
- Routes:
  - `/api/books`: CRUD for books.
  - `/api/cart`: CRUD for cart (requires JWT).
  - `/api/login`: Mock login endpoint returning a dummy JWT.
  - `/api/checkout/process`: Intentionally returns a `500 Server Error` 15% of the time.
  - `/api/inventory/report`: 3-second `setTimeout` for JMeter stress testing.

## Phase 3: Frontend Foundations & API Integration
- Setup Vite, React Router, basic application layout.
- Service layer (fetch wrapped with auth injection).

## Phase 4: Frontend UI Layer
- **Catalog View**: Displays books. Add to cart button with a 500ms - 3500ms dynamic delay. List items use nested tables/complex CSS instead of test-friendly `ids`.
- **Cart View**: Shows current cart items.
- **Checkout Form**: Simulates checkout. Inputs use obfuscated names/classes to make selection challenging.
- **Order Summary Element**: A Custom Element (Web Component) injected in Shadow DOM to wrap the Order Summary, making test frameworks pierce the shadow root.
