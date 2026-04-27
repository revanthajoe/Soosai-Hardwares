# PostgreSQL Setup Guide for Windows

## Quick Start (Easiest Option - Using Docker)

### Prerequisites
- Docker Desktop installed: https://www.docker.com/products/docker-desktop

### Step 1: Start PostgreSQL in Docker
```powershell
# Run PostgreSQL container
docker run --name soosai-postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=soosai_hardwares `
  -p 5432:5432 `
  -d postgres:15-alpine
```

### Step 2: Verify Connection
```powershell
# The database is ready when the backend starts successfully!
# Go to backend folder and run:
cd backend
npm start
```

### Step 3: Stop PostgreSQL
```powershell
docker stop soosai-postgres
```

### Restart PostgreSQL Later
```powershell
docker start soosai-postgres
```

---

## Manual Installation (No Docker)

### For Windows Users:

#### Option A: PostgreSQL Installer
1. Download: https://www.postgresql.org/download/windows/
2. Run installer (version 12+)
3. Set password: `postgres`
4. Port: `5432`
5. Create database in pgAdmin:
   ```sql
   CREATE DATABASE soosai_hardwares;
   ```

#### Option B: Chocolatey (if installed)
```powershell
choco install postgresql15
```

#### Option C: Windows Subsystem for Linux (WSL)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo service postgresql start
sudo -u postgres createdb soosai_hardwares
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
```

---

## Environment Variables (.env)

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/soosai_hardwares
PGHOST=127.0.0.1
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=soosai_hardwares
DB_SYNC_ALTER=true
PG_SSL=false

# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Authentication
JWT_SECRET=dev-jwt-secret-change-me-in-production
JWT_EXPIRES_IN=7d

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug
LOG_DIR=./logs

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,webp
```

---

## Verification

### Test Connection:
```powershell
cd backend
npm start
```

Expected output:
```
PostgreSQL connected successfully.
Server running on port 5000
```

### Test API Health:
```powershell
Invoke-WebRequest http://localhost:5000/api/health
```

Should return:
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2026-04-28T10:30:00.000Z"
}
```

---

## Troubleshooting

### Error: "connect ECONNREFUSED 127.0.0.1:5432"
- PostgreSQL is not running
- **Docker fix:** `docker start soosai-postgres`
- **Manual fix:** Start PostgreSQL service from Services or terminal

### Error: "password authentication failed"
- Check .env file credentials match your setup
- Verify PGUSER and PGPASSWORD are correct

### Error: "database 'soosai_hardwares' does not exist"
- Create database manually using pgAdmin or psql
- Or let Sequelize auto-create with `DB_SYNC_ALTER=true`

### Port 5432 already in use
- Change PGPORT in .env to another port (e.g., 5433)
- Or kill process: `netstat -ano | findstr :5432`

---

## Database Credentials

**Default (Development)**
- User: `postgres`
- Password: `postgres`
- Host: `127.0.0.1`
- Port: `5432`
- Database: `soosai_hardwares`

**For Production**, change these in environment variables!

---

## Next Steps

1. ✅ PostgreSQL running
2. ✅ Database created
3. ✅ Backend connected
4. Start backend: `npm start`
5. Start frontend: `npm run dev`
6. Open http://localhost:5173

---

## Advanced: Backup & Restore

### Backup Database
```powershell
pg_dump -U postgres -W soosai_hardwares > backup.sql
```

### Restore Database
```powershell
psql -U postgres -d soosai_hardwares < backup.sql
```

---

**Created:** April 28, 2026  
**PostgreSQL Version:** 12+  
**Node.js Version:** 18+
