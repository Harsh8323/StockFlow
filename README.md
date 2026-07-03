# StockFlow

**Modern order, inventory, and customer management for growing businesses.**

StockFlow is a full-stack MERN application (MongoDB, Express, React, Node.js) that helps small-to-medium businesses track products, manage orders, monitor inventory levels, and generate PDF invoices — all from a clean, dark-themed dashboard.

![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-000?logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)

---

## Features

- **Dashboard** — Real-time overview of sales, orders, low-stock alerts, and revenue charts.
- **Product Management** — Full CRUD with SKU, category, pricing, stock tracking, reorder levels, and image uploads (local disk or Cloudinary).
- **Order Management** — Create, update, and track orders with status transitions (`pending → processing → shipped → delivered`), payment tracking (`unpaid / partial / paid`), and automatic GST calculation.
- **PDF Invoices** — Generate professional invoice PDFs with PDFKit, including customer snapshots and line-item details.
- **Customer Management** — Store customer details with automatic snapshots on each order for historical accuracy.
- **Inventory Tracking** — Stock adjustment logs with reason codes and user attribution.
- **Low-Stock Alerts** — Visual indicators when stock falls below reorder thresholds.
- **Role-Based Access** — Admin and staff roles; analytics and user management are admin-only.
- **Analytics** — Revenue trends, top products, order summaries with Recharts.
- **Authentication** — JWT-based auth with registration, login, and protected routes.
- **Responsive Dark UI** — Tailwind CSS dark theme with Framer Motion animations.
- **Admin Auto-Seed** — First admin user created automatically on startup via environment variables.

---

## Tech Stack

| Layer  | Technology |
|--------|------------|
| Frontend | React 18, React Router v6, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide React |
| Backend  | Node.js, Express, Mongoose, JWT, bcryptjs, Multer, PDFKit |
| Database | MongoDB (via Mongoose ODM) |
| Storage  | Local filesystem or Cloudinary (configurable) |

---

## Project Structure

```
stockflow/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # Auth & Theme context providers
│   │   ├── layouts/           # Dashboard layout with sidebar
│   │   ├── pages/             # Route-level page components
│   │   ├── routes/            # App routes & protected route wrapper
│   │   ├── services/          # Axios API service modules
│   │   └── utils/             # Utility helpers
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
├── server/                    # Express REST API
│   ├── config/                # MongoDB & Cloudinary config
│   ├── controllers/           # Route handler logic (MVC)
│   ├── middleware/            # Auth, error, role, upload middleware
│   ├── models/                # Mongoose schemas
│   ├── routes/                # Express route definitions
│   ├── utils/                 # Token generation, invoice PDF, helpers
│   ├── scripts/               # Database utility scripts
│   ├── app.js                 # Express app setup
│   └── server.js              # Entry point (connects DB, seeds admin)
├── package.json               # Monorepo root with workspaces
└── README.md
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [MongoDB](https://www.mongodb.com/) — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas)

### 1. Clone & Install

```bash
git clone https://github.com/your-org/stockflow.git
cd stockflow
npm run install:all
```

### 2. Environment Variables

Copy the example env files and fill in your values:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Key variables in `server/.env`:

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `CLIENT_ORIGIN` | Allowed CORS origin(s) — `http://localhost:5173` for dev |
| `CLOUDINARY_*` | (Optional) Cloudinary credentials for image uploads |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Auto-seeded admin credentials |

Key variables in `client/.env`:

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API base URL — `http://localhost:5000/api` for dev |

### 3. Run in Development

```bash
npm run dev
```

This starts both the server (port 5000, with nodemon) and the client (port 5173, with Vite) concurrently.

### 4. Build for Production

```bash
npm --prefix client run build
npm --prefix server start
```

---

## API Overview

| Endpoint                | Description             |
|-------------------------|-------------------------|
| `POST /api/auth/login`  | Sign in                 |
| `POST /api/auth/register` | Create account        |
| `GET /api/products`     | List products           |
| `POST /api/products`    | Create product          |
| `GET /api/orders`       | List orders             |
| `POST /api/orders`      | Create order            |
| `GET /api/orders/:id/pdf` | Download invoice PDF  |
| `GET /api/customers`    | List customers          |
| `GET /api/inventory`    | Inventory log           |
| `GET /api/dashboard`    | Dashboard stats         |
| `GET /api/users`        | List users (admin only)  |

---

## Deployment

### Server

The Express API can be deployed to [Render](https://render.com/), [Railway](https://railway.app/), [Fly.io](https://fly.io/), or any Node.js host. Set the `CLIENT_ORIGIN` env var to your frontend URL, and configure `MONGO_URI` with your production database.

### Client

The Vite React app can be deployed to [Vercel](https://vercel.com/) (a `vercel.json` is included) or any static host. Set `VITE_API_URL` to your deployed API URL.

---

## License

MIT
