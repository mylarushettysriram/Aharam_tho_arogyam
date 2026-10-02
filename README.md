# 🌾 Rice Marketplace

A farmer-to-customer rice marketplace. Farmers list rice bags directly; customers browse, order, and get their rice delivered — no middlemen.

Ships with **6 default rice products and real placeholder images already seeded**, so the app looks fully populated the moment you run it. When a farmer adds their own rice, their uploaded photo shows up immediately on their listing and in the customer marketplace. Ordering is **transaction-safe**: if two customers try to buy the last bags at the same time, only one order succeeds — the database guarantees it, not the frontend.

## Features

- Farmer & customer registration/login with JWT auth and role-based access
- Farmer: add/edit/delete rice listings with image upload, manage orders, dashboard stats
- Customer: browse/search/filter rice, view farmer info, place orders, track/cancel orders, review delivered products
- **Real inventory concurrency control** — MySQL row locking (`SELECT ... FOR UPDATE`) inside a transaction, so stock can never go negative
- WhatsApp Business Cloud API notification to the farmer on every new order
- Centralized error handling, consistent `{ success, message, data }` API responses
- Backend is the source of truth for price, inventory, and ownership — never trusts the frontend

## Technology Stack

**Frontend:** React, Vite, React Router, Axios, Context API
**Backend:** Node.js, Express, Sequelize ORM, JWT, bcryptjs, Multer
**Database:** MySQL
**Notifications:** WhatsApp Business Cloud API

## Folder Structure

```
rice-marketplace/
├── backend/          Express API, Sequelize models, image uploads
│   └── uploads/rice/ Default seeded images + farmer-uploaded images
├── frontend/         React + Vite app
├── database/         Reference schema.sql / seed.sql
└── README.md
```

## 1. Prerequisites

- Node.js 18+
- MySQL 8+ running locally (or a MySQL connection string)
- (Optional) A WhatsApp Business Cloud API app — only needed if you want real WhatsApp notifications

## 2. MySQL Setup

```sql
CREATE DATABASE rice_marketplace CHARACTER SET utf8mb4;
```

That's it — Sequelize creates all the tables for you automatically the first time the backend starts (`sequelize.sync()` in `server.js`). `database/schema.sql` is there only as a reference if you ever want to inspect/recreate the schema by hand.

## 3. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=rice_marketplace
DB_USER=root
DB_PASSWORD=your_mysql_password

JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=7d

WHATSAPP_TOKEN=your_whatsapp_permanent_or_temp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
WHATSAPP_API_VERSION=v20.0
```

Start the server (creates tables automatically):

```bash
npm run dev
```

You should see:
```
MySQL connection established successfully.
Database synced.
Rice Marketplace API running on http://localhost:5000
```

### Seed default rice + demo accounts

The zip already contains 6 placeholder rice images at `backend/uploads/rice/`. Run the seed script once to create a demo farmer, a demo customer, and 6 rice listings pointing at those images:

```bash
npm run seed
```

Demo accounts (password for both: `password123`):
- Farmer: `farmer@demo.com`
- Customer: `customer@demo.com`

## 4. Frontend Setup

```bash
cd frontend
npm install
```

`frontend/.env` is already set up to talk to `http://localhost:5000`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_UPLOADS_URL=http://localhost:5000/uploads
```

Start it:
```bash
npm run dev
```

Open **http://localhost:5173**.

## 5. Running Both Together

From the project root, in two terminals:
```bash
npm run dev:backend
npm run dev:frontend
```

## 6. How Images Work

- Default seeded rice comes with 6 images already sitting in `backend/uploads/rice/`.
- When a farmer adds or edits rice with a photo, it's uploaded via `multer` to that same folder and served statically at `http://localhost:5000/uploads/rice/<filename>`.
- The frontend always resolves `rice.image` through `imageUrl()` in `frontend/src/services/api.js`, so newly-added photos appear immediately on the farmer's "My Rice" page and in the customer marketplace — no extra config needed.
- For production, swap the local `uploads/` folder for S3/Cloudinary by only touching `middleware/uploadMiddleware.js` — nothing else in the codebase needs to change.

## 7. How Inventory Concurrency Actually Works (the "real" part)

`backend/controllers/orderController.js` → `createOrder`:

1. Opens a MySQL transaction.
2. For every item in the cart, runs `RiceProduct.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE })` — this issues `SELECT ... FOR UPDATE`, which locks that product's row.
3. If a second customer's request arrives for the same product while the first transaction is still open, MySQL makes it **wait** for the lock, not read stale data.
4. Once the first transaction commits (or rolls back), the second transaction acquires the lock, re-reads the now-updated `quantity_available`, and if it's not enough, the order is rejected with a clear message — no negative stock, no overselling, no race condition.
5. Price is always re-read from the database inside the same transaction — the frontend's price is never trusted.

Cancelling or rejecting an order restores stock the same transaction-safe way.

## API Endpoints

**Auth**
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout
```

**Rice**
```
GET    /api/rice                 (public, ?search=&variety=&minPrice=&maxPrice=)
GET    /api/rice/:id             (public)
GET    /api/rice/:id/reviews     (public)
POST   /api/rice                 (farmer, multipart/form-data with "image")
PUT    /api/rice/:id             (farmer, owner only)
DELETE /api/rice/:id             (farmer, owner only)
GET    /api/farmer/rice          (farmer's own listings)
```

**Orders**
```
POST   /api/orders                       (customer)
GET    /api/orders/:id                   (owner customer or owner farmer)
PUT    /api/orders/:id/cancel            (customer, owner only)
GET    /api/customer/orders              (customer's own orders)
GET    /api/farmer/orders                (orders against farmer's rice)
PUT    /api/farmer/orders/:id/accept
PUT    /api/farmer/orders/:id/reject
PUT    /api/farmer/orders/:id/status     (body: { status })
GET    /api/farmer/stats
```

**Reviews**
```
POST   /api/reviews    (customer, only for delivered orders)
```

## WhatsApp Setup

1. Create a Meta developer app with the WhatsApp product enabled.
2. Get a phone number ID and an access token from the Meta dashboard.
3. Put them in `backend/.env` as `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_TOKEN`.
4. Create and approve a WhatsApp message template named `new_order` with this body:
	```text
	New rice booking received:
	{{1}}
	```
5. Add `WHATSAPP_ORDER_TEMPLATE_NAME`, `WHATSAPP_ORDER_TEMPLATE_LANGUAGE`, and `WHATSAPP_DEFAULT_COUNTRY_CODE=91` to `backend/.env` if your template uses another name, language, or country.
6. Recipient numbers (farmer phone numbers) must include the country code, or be 10-digit Indian numbers when the default country code is `91`. Test recipients must be verified unless your app is live/approved.
7. If WhatsApp credentials are missing or the API call fails, the order still succeeds — the exact failure is logged (see `backend/services/whatsappService.js`). Credentials are never sent to the frontend.

## Testing the Concurrency Guarantee

1. Seed the demo data (`npm run seed` in `backend/`) — "Black Rice" is seeded with only **2 bags** available specifically to make this easy to test.
2. Open two browser tabs (or use two customer accounts), both viewing Black Rice.
3. In tab A, order 2 bags and submit.
4. In tab B, before or right as tab A submits, also try to order 1–2 bags.
5. Only one of the two orders succeeds; the other gets `"Only 0 bag(s) of ... left"` — because the database transaction, not the UI, is the real gatekeeper.

## Deployment Notes

- **Frontend:** `npm run build` in `frontend/`, deploy the `dist/` folder to any static host (Vercel, Netlify, S3+CloudFront).
- **Backend:** deploy to any Node host (Render, Railway, EC2). Set all `.env` values as real environment variables — never commit `.env`.
- **MySQL:** use a managed instance (PlanetScale, RDS, Railway MySQL). Update `DB_*` env vars.
- **Images:** for production, move `uploads/rice/` to S3/Cloudinary — only `uploadMiddleware.js` needs to change.
- **WhatsApp:** move from test numbers to a verified business phone number and get the app approved by Meta for production messaging.
- Recommended production hardening not included here: rate limiting (`express-rate-limit`), security headers (`helmet`), HTTPS termination, and a process manager (PM2) or containerization.
