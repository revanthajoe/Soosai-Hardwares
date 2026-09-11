# Soosai Hardwares - Hardware Shop System

A complete hardware shop system where:

- Admin logs in with JWT authentication
- Admin adds/edits/deletes products from mobile or laptop
- Admin captures product images directly from phone camera
- Admin manages homepage advertisements (image/GIF/video carousel)
- Customers browse products, leave reviews, and order through WhatsApp
- UI is responsive and mobile-first
- Deployment is supported on free tiers (Vercel + Render + Supabase)

## Tech Stack

- Frontend: React + Vite + React Router (Vercel)
- Backend: Node.js + Express (Render)
- Database: PostgreSQL via Supabase (`@supabase/supabase-js`, RLS-enabled)
- Image/Video Upload: Cloudinary
- Auth: JWT

## Project Structure

- backend/
  - config/
  - controllers/
  - middlewares/
  - models/
  - routes/
  - scripts/
  - utils/
  - server.js
- frontend/
  - src/
    - components/
    - pages/
    - services/
    - App.jsx

## Implemented Features

### Customer Side

- Home page with featured products and an auto-advancing ad carousel
  (images hold 15s each; videos play to completion before advancing)
- Product listing page (grid)
- Category filter
- Brand filter
- Search bar
- Product detail page
- Product & shop reviews
- Stock indicators (In stock / Low stock / Out of stock)
- WhatsApp order button with pre-filled message
- Quantity selector before ordering

### Admin Side

- Admin login (JWT)
- Product CRUD
- Category create/delete
- Advertisement CRUD (image/GIF/video, drag-free up/down reorder)
- Image upload
- Stock management
- Product listing dashboard
- Mobile camera capture input:
  - input file uses accept="image/*" and capture="environment"

### Error Handling

- Backend centralized error handler and not-found handler
- Backend validation via express-validator
- Frontend API error normalization
- Frontend route-level error states
- React Error Boundary

## API Endpoints

### Auth

- POST /api/auth/login

### Products

- GET /api/products
- GET /api/products/:id
- POST /api/products
- PUT /api/products/:id
- DELETE /api/products/:id

### Categories

- GET /api/categories
- POST /api/categories
- DELETE /api/categories/:id

### Advertisements

- GET /api/promotions
- GET /api/promotions/admin
- POST /api/promotions
- PUT /api/promotions/:id
- PATCH /api/promotions/:id/reorder
- DELETE /api/promotions/:id

### Reviews

- GET /api/reviews/shop
- POST /api/reviews/shop
- GET /api/reviews/:productId
- POST /api/reviews/:productId
- DELETE /api/reviews/:id

### Health

- GET /api/health

## Local Setup

## 1. Prerequisites

- Node.js 18+
- A Supabase project (Postgres + RLS)
- A Cloudinary account (image/video uploads)

## 2. Environment Variables

Copy:

- backend/.env.example to backend/.env
- frontend/.env.example to frontend/.env

Important backend variables:

- DATABASE_URL
- SUPABASE_URL
- SUPABASE_SERVICE_KEY — **must be the `service_role` key from your Supabase
  project's API settings, not the publishable/anon key.** The backend is the
  only authorization gate (via JWT + the `protect` middleware); RLS grants
  the `anon` role read-only access on all tables. Using the anon key here
  will make writes (creating products, ads, etc.) fail with Postgres RLS
  errors or `Cannot coerce the result to a single JSON object`.
- CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
- JWT_SECRET
- ADMIN_USERNAME / ADMIN_PASSWORD

Important frontend variables:

- VITE_API_BASE_URL
- VITE_WHATSAPP_NUMBER

## 3. Install Dependencies

Backend:

- cd backend
- npm install

Frontend:

- cd ../frontend
- npm install

## 4. Run Development Servers

Backend terminal:

- cd backend
- npm run dev

Frontend terminal:

- cd frontend
- npm run dev

Default URLs:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Admin Credentials

There are no built-in default credentials. Set `ADMIN_USERNAME` and
`ADMIN_PASSWORD` in `backend/.env` to enable env-credential login; if either
is unset, only database admin users (see `backend/scripts/seedAdmin.js`) can
sign in.

## Deployment

- **Frontend** → Vercel
- **Backend** → Render
- **Database** → Supabase
- **Images/Video** → Cloudinary

There is no CI/staging branch — pushing to `main` is the deploy for both
Vercel and Render.

## Backend on Render (Free)

Create a Web Service manually:

- Root directory: backend
- Build command: npm install
- Start command: npm start
- Add env vars:
  - NODE_ENV=production
  - DATABASE_URL
  - SUPABASE_URL
  - SUPABASE_SERVICE_KEY (the `service_role` key — see note above)
  - PG_SSL=true
  - CLOUDINARY_CLOUD_NAME
  - CLOUDINARY_API_KEY
  - CLOUDINARY_API_SECRET
  - JWT_SECRET
  - JWT_EXPIRES_IN=7d
  - CLIENT_URL=https://your-vercel-domain
  - ADMIN_USERNAME
  - ADMIN_PASSWORD

## Frontend on Vercel (Free)

1. Import frontend folder as project.
2. Framework preset: Vite.
3. Add env vars:
   - VITE_API_BASE_URL=https://your-render-backend-domain/api
   - VITE_WHATSAPP_NUMBER=91XXXXXXXXXX
4. Deploy.

Note:

- frontend/vercel.json is included for SPA route rewrites.

## Mobile Workflow

1. Open admin dashboard on phone.
2. Tap Add Product.
3. Capture image from camera.
4. Fill minimal details and save.
5. Product appears immediately in listing.

## Constraints Followed

- No payment gateway
- Focus on practical shop usability
- Mobile-friendly UI with large touch targets
- Free deployment support
