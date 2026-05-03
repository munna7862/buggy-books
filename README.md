# 📚 BuggyBooks

> **A deliberately imperfect bookstore application, purpose-built for QA engineers and SDET practitioners to practise real-world test automation, API testing, and chaos engineering.**

---

## 🌐 Live Application

| Service | URL | Notes |
|---|---|---|
| **Frontend** | https://buggy-books-fe.onrender.com | React SPA |
| **Backend API** | https://buggy-books-api.onrender.com | REST API |

> ⚠️ **Note (Free Tier):** The Render backend spins down after 15 minutes of inactivity. The **first request** after inactivity may take up to **30–60 seconds** as the server cold-starts. This is expected behaviour and is itself a testable scenario.

---

## 🎯 Purpose & Design Philosophy

BuggyBooks is **not** a reference application for clean code. It is intentionally designed with:

- **Real-world "bugs"** such as a stochastic checkout failure rate and a long-running inventory API — simulating production conditions that automation suites must handle.
- **Non-semantic HTML selectors** (e.g. `input[name="txt_usr_77"]`) on forms to challenge testers who rely on obvious attributes.
- **Chaos engineering endpoints** that allow you to programmatically inject failure modes into the backend, enabling controlled fault-injection testing.
- **Authentic security patterns** (httpOnly cookies, CORS, Helmet, rate-limiting) so that API automation tests must deal with cookie-based auth rather than trivial header tokens.

---

## 🗂️ Project Structure

```
buggy-books/
├── backend/                    # Node.js / Express API Server
│   ├── src/
│   │   ├── __tests__/          # Jest integration & unit tests
│   │   ├── controllers/        # Route handler logic
│   │   │   ├── authController.ts
│   │   │   ├── bookController.ts
│   │   │   ├── cartController.ts
│   │   │   ├── checkoutController.ts
│   │   │   └── testController.ts
│   │   ├── data/               # In-memory data store + JSON persistence
│   │   │   ├── dataStore.ts
│   │   │   ├── chaosStore.ts
│   │   │   └── storage.ts      # File-based persistence layer
│   │   ├── routes/
│   │   │   └── api.ts          # All route declarations
│   │   ├── app.ts              # Express app (middleware stack)
│   │   ├── config.ts
│   │   └── server.ts           # HTTP server entry point
│   ├── db.json                 # Runtime data (git-ignored in prod)
│   └── package.json
│
├── frontend/                   # React / Vite SPA
│   ├── src/
│   │   ├── pages/              # Route-level components
│   │   │   ├── Catalog.tsx     # Paginated, searchable book list
│   │   │   ├── BookDetail.tsx  # Single book detail view
│   │   │   ├── Cart.tsx        # Per-user shopping cart
│   │   │   ├── Checkout.tsx    # Checkout form with Zod validation
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── AuthContext.tsx     # Global auth state (cookie-based)
│   │   ├── api.ts              # Centralised API request helper
│   │   └── App.tsx             # Router & layout
│   └── package.json
│
├── test_cases_catalog.md       # ← Human-readable Playwright test cases
└── README.md
```

---

## 🛠️ Technology Stack

### Backend
| Technology | Version | Role |
|---|---|---|
| **Node.js** | 20.x | Runtime |
| **TypeScript** | 5.3 | Language |
| **Express** | 4.x | HTTP framework |
| **jsonwebtoken** | 9.x | JWT signing & verification |
| **bcrypt** | 6.x | Password hashing |
| **cookie-parser** | 1.4 | `httpOnly` cookie parsing |
| **helmet** | 8.x | Secure HTTP headers |
| **cors** | 2.8 | Origin restriction |
| **express-rate-limit** | 7.x | Request throttling (60 req/min) |
| **zod** | 4.x | Runtime schema validation |
| **morgan** | 1.x | HTTP request logging |
| **Jest + Supertest** | 30.x / 7.x | API integration & unit tests |
| **ts-node-dev** | 2.x | Dev server with hot-reload |

### Frontend
| Technology | Version | Role |
|---|---|---|
| **React** | 19.x | UI framework |
| **TypeScript** | 6.x | Language |
| **Vite** | 8.x | Build tool & dev server |
| **React Router DOM** | 7.x | Client-side routing |
| **react-hot-toast** | 2.x | Toast notifications |
| **Vitest** | 4.x | Unit test runner |
| **Testing Library** | 16.x | Component testing utilities |

### Infrastructure & DevOps
| Tool | Role |
|---|---|
| **Render.com** | Cloud hosting (Free Tier) |
| **GitHub** | Source control |
| **GitHub Actions** (optional) | CI/CD trigger |

---

## ⚙️ Local Development Setup

### Prerequisites
- Node.js v20 or higher
- npm v9 or higher
- Git

### 1. Clone the repository
```bash
git clone https://github.com/munna7862/buggy-books.git
cd buggy-books
```

### 2. Install all dependencies
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 3. Configure environment variables
Create `backend/.env`:
```env
JWT_SECRET=your-very-long-random-secret-here
PORT=4000
NODE_ENV=development
```

### 4. Run the full stack in development mode
```bash
# From the project root — runs both backend and frontend concurrently
npm run dev
```

| Service | Local URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:4000 |

---

## 🔑 Default Credentials

| Username | Password | Role |
|---|---|---|
| `admin` | `password123` | Default user |
| `testuser` | `buggybooks` | Default user |

> Both accounts are seeded at startup. You can register additional accounts via `/register` or the API.

---

## 🌐 API Reference

### Authentication
> All protected endpoints authenticate via an `httpOnly` cookie named `token`.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/login` | No | Login and receive a session cookie |
| `POST` | `/api/register` | No | Create a new account |
| `POST` | `/api/logout` | No | Clear the session cookie |

### Books
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/books` | No | List all books (supports `?q=`, `?page=`, `?limit=`) |
| `GET` | `/api/books/:id` | No | Get a single book by ID |
| `GET` | `/api/inventory/report` | No | Intentionally slow endpoint (chaos delay) |

### Cart
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/cart` | ✅ Yes | Get the current user's cart |
| `POST` | `/api/cart` | ✅ Yes | Add a book to the cart (`{ "bookId": "1" }`) |
| `DELETE` | `/api/cart/:bookId` | ✅ Yes | Remove one item from the cart |
| `DELETE` | `/api/cart` | ✅ Yes | Clear the entire cart |

### Checkout & Orders
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/checkout/process` | ✅ Yes | Process an order (has stochastic failure!) |
| `GET` | `/api/orders` | ✅ Yes | Get the current user's order history |

### Chaos & Test Utilities
> These endpoints are available in all environments and allow test suites to control application state.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/test/reset` | Wipe all cart & order data, reset chaos config |
| `POST` | `/api/test/config` | Inject chaos parameters |

**Chaos Config Payload:**
```json
{
  "checkoutFailureRate": 0.0,
  "inventoryDelayMs": 0
}
```
- `checkoutFailureRate`: Float `0.0` (never fail) → `1.0` (always fail). Default: `0.15`
- `inventoryDelayMs`: Integer milliseconds to delay `/inventory/report`. Default: `3000`

---

## 🎭 Known Bugs & Deliberate Imperfections

These are **intentional design decisions** that serve as targets for automation practice:

| Ref | Description | How to Detect |
|---|---|---|
| **B1** | Checkout fails randomly ~15% of the time | Run 20 checkout attempts and chart the fail rate |
| **B2** | `/api/inventory/report` is always slow (3s delay) | Assert response time > 2500ms |
| **B3** | Non-semantic login form fields (`txt_usr_77`) | Finding these fields requires robust selectors |
| **B4** | Data resets on Render cold-start (ephemeral disk) | Register a user, wait, return, and try to login |

---

## 🧪 Running Tests

### Backend Tests (Jest)
```bash
cd backend
npm test
```
- **31 tests** across 2 suites:
  - `api.test.ts` — 20 integration tests covering all API routes
  - `dataStore.test.ts` — 11 unit tests for data layer

### Frontend Tests (Vitest)
```bash
cd frontend
npm test
```
- **19 tests** across 7 component suites

---

## 🔄 Sample Flows

### Flow 1: Register → Add to Cart → Checkout

```
1. POST /api/register   { username, password, fullName }
   ← 201 + Set-Cookie: token=<jwt>; HttpOnly

2. GET  /api/books?page=1&limit=8
   ← 200 + { books: [...], total: 15, page: 1 }

3. POST /api/cart       { bookId: "6" }
   ← 200 + [ { id: "6", title: "Harry Potter..." } ]

4. POST /api/checkout/process
        { firstName: "Jane", lastName: "Doe", creditCard: "1234567812345678" }
   ← 200 + { success: true, orderId: "f41886..." }
     OR
   ← 500   (15% chance — retry logic required!)

5. GET  /api/orders
   ← 200 + [ { id, items, total, customerName, date } ]
```

### Flow 2: Inject Chaos → Test Recovery

```
1. POST /api/test/config  { "checkoutFailureRate": 1.0 }
   ← Checkout will now ALWAYS fail

2. POST /api/checkout/process { ... }
   ← 500 Internal Server Error (assert this!)

3. POST /api/test/config  { "checkoutFailureRate": 0.0 }
   ← Checkout will now NEVER fail

4. POST /api/checkout/process { ... }
   ← 200 Success (assert this!)

5. POST /api/test/reset
   ← Restore default chaos config (0.15 rate)
```

### Flow 3: Multi-User Cart Isolation

```
User A logs in → adds Book #1 to cart
User B logs in → adds Book #3 to cart

GET /api/cart (as User A) → returns only Book #1
GET /api/cart (as User B) → returns only Book #3
```

---

## 🔒 Security Architecture

| Layer | Implementation |
|---|---|
| **Authentication** | JWT stored in `httpOnly`, `SameSite=Strict` cookie — inaccessible to JavaScript (XSS-safe) |
| **Password Storage** | bcrypt with 10 salt rounds |
| **HTTP Headers** | Helmet.js sets CSP, X-Frame-Options, HSTS, and more |
| **CORS** | Restricted to `localhost:5173` and `*.onrender.com` only |
| **Rate Limiting** | 60 requests per IP per minute |
| **Input Validation** | Zod schemas enforce shape and types on all mutation endpoints |

---

## 📋 Test Automation Resources

| Document | Description |
|---|---|
| [`test_cases_catalog.md`](./test_cases_catalog.md) | Complete human-readable test cases for Playwright automation (Smoke / Regression / E2E) |

---

## 🏗️ Architecture Decisions

| Decision | Rationale |
|---|---|
| **In-memory + JSON file persistence** | Avoids a database dependency; the file store gives local dev persistence while the in-memory nature remains a discoverable "bug" in production |
| **Stochastic checkout failures** | Forces automation engineers to implement robust retry logic, not just happy-path tests |
| **Per-user cart isolation via Map** | Enables multi-user concurrent testing — critical for load and parallel test execution |
| **No frontend token storage** | The `httpOnly` cookie pattern is the real-world secure standard; testers must learn to handle session cookies instead of `localStorage` JWTs |

---

## 🤝 Contributing

This project is primarily maintained for QA practice. To contribute a new "bug" or feature:

1. Branch from `main`
2. Make your changes
3. Ensure all existing tests still pass (`npm test` in both `/backend` and `/frontend`)
4. Update `test_cases_catalog.md` with new test cases if applicable
5. Open a PR against `main`