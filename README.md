# Soosai Hardwares - MERN Shop System

A complete MERN hardware shop system where:

- Admin logs in with JWT authentication
- Admin adds/edits/deletes products from mobile or laptop
- Admin captures product images directly from phone camera
- Customers browse products and order through WhatsApp
- UI is responsive and mobile-first
- Deployment is supported on free tiers (Vercel + Render + PostgreSQL)

## Tech Stack

- Frontend: React + Vite + React Router
- Backend: Node.js + Express
- Database: PostgreSQL
- Image Upload: Multer (local storage)
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

- Home page with featured products
- Product listing page (grid)
- Category filter
- Brand filter
- Search bar
- Product detail page
- Stock indicators (In stock / Low stock / Out of stock)
- WhatsApp order button with pre-filled message
- Quantity selector before ordering

### Admin Side

- Admin login (JWT)
- Product CRUD
- Category create
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

### Health

- GET /api/health

## Local Setup

## 1. Prerequisites

- Node.js 18+
- PostgreSQL 14+ (local or hosted)

## 2. Environment Variables

Copy:

- .env.example to .env
- backend/.env.example to backend/.env
- frontend/.env.example to frontend/.env

Important variables:

- DATABASE_URL
- JWT_SECRET
- ADMIN_USERNAME
- ADMIN_PASSWORD
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

## Default Admin Credentials

- Username: admin
- Password: admin123

You can change these in environment variables:

- ADMIN_USERNAME
- ADMIN_PASSWORD

## Deployment (Free)

## PostgreSQL (Free)

1. Create a free PostgreSQL instance (Render, Supabase, Neon, ElephantSQL, etc.).
2. Copy the connection string.
3. Set DATABASE_URL in backend environment variables.

## Backend on Render (Free)

Option A:

- Use root render.yaml.
- Create Blueprint service from repository.

Option B:

- Create a Web Service manually:
  - Root directory: backend
  - Build command: npm install
  - Start command: npm start
  - Add env vars:
    - NODE_ENV=production
    - DATABASE_URL
    - PG_SSL=true
    - DB_SYNC_ALTER=false
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
