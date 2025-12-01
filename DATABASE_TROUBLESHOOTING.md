# 🔧 Database Connection Issues - Troubleshooting Guide

## ❌ Current Issue
**Error:** `Can't reach database server at pg-1c81a21d-synciot.e.aivencloud.com:28118`

**What this means:** Your Aiven PostgreSQL database is not accessible.

---

## 🔍 Possible Causes

1. **Database Paused/Stopped**
   - Aiven free tier databases pause after inactivity
   - Need to manually restart from Aiven console

2. **Database Deleted**
   - Free tier expired
   - Manually deleted
   - Need to create a new database

3. **Network Issues**
   - Firewall blocking connection
   - SSL/TLS certificate issues
   - Internet connectivity problems

4. **Wrong Credentials**
   - DATABASE_URL might be outdated
   - Password or hostname changed

---

## ✅ Solutions

### Solution 1: Restart Aiven Database (RECOMMENDED)

1. **Go to Aiven Console:**
   - Visit: https://console.aiven.io
   - Login with your account

2. **Check Database Status:**
   - Find your `synciot` PostgreSQL database
   - Check if it shows "Running" or "Paused"

3. **If Paused:**
   - Click on the database
   - Click "Resume" or "Power On"
   - Wait 1-2 minutes for it to start

4. **Test Connection:**
   ```bash
   cd /Users/riteshkumar/Desktop/snw/AP/CAPSTONE/backend
   node test-db.js
   ```

5. **If Working, Run Seed:**
   ```bash
   node prisma/seed.js
   ```

---

### Solution 2: Create New Aiven Database

If database was deleted:

1. **Login to Aiven:**
   - https://console.aiven.io

2. **Create New PostgreSQL Database:**
   - Click "+ Create Service"
   - Select "PostgreSQL"
   - Choose Free tier
   - Region: Choose closest to you
   - Service name: `synciot-postgres`
   - Click "Create Service"

3. **Wait for Database to Start** (2-3 minutes)

4. **Get Connection String:**
   - Click on your new database
   - Go to "Overview" tab
   - Copy the "Service URI" or "Connection string"

5. **Update .env File:**
   ```bash
   cd /Users/riteshkumar/Desktop/snw/AP/CAPSTONE/backend
   ```
   
   Edit `.env` and replace DATABASE_URL:
   ```
   DATABASE_URL="postgresql://[username]:[password]@[host]:[port]/[database]?sslmode=require"
   ```

6. **Run Migration:**
   ```bash
   npx prisma migrate deploy
   ```

7. **Run Seed:**
   ```bash
   node prisma/seed.js
   ```

---

### Solution 3: Use Railway.app (Alternative to Aiven)

1. **Go to Railway:**
   - https://railway.app
   - Sign up with GitHub

2. **Create New Project:**
   - Click "New Project"
   - Select "Provision PostgreSQL"

3. **Get Connection String:**
   - Click on PostgreSQL service
   - Go to "Connect" tab
   - Copy "Postgres Connection URL"

4. **Update .env:**
   ```
   DATABASE_URL="[paste-railway-connection-string]"
   ```

5. **Run Migration and Seed:**
   ```bash
   npx prisma migrate deploy
   node prisma/seed.js
   ```

---

### Solution 4: Use Local PostgreSQL

Install PostgreSQL on your Mac:

```bash
# Install PostgreSQL
brew install postgresql@16

# Start PostgreSQL service
brew services start postgresql@16

# Create database
createdb synciot

# Update .env
echo 'DATABASE_URL="postgresql://localhost:5432/synciot"' > .env

# Run migration
npx prisma migrate deploy

# Run seed
node prisma/seed.js
```

---

### Solution 5: Use Supabase (Free PostgreSQL)

1. **Go to Supabase:**
   - https://supabase.com
   - Sign up for free

2. **Create New Project:**
   - Click "New Project"
   - Set name: `synciot`
   - Set password
   - Choose region

3. **Get Connection String:**
   - Go to Project Settings > Database
   - Copy "Connection string" (Direct connection)
   - Replace `[YOUR-PASSWORD]` with your password

4. **Update .env:**
   ```
   DATABASE_URL="[paste-supabase-connection-string]"
   ```

5. **Run Migration and Seed:**
   ```bash
   npx prisma migrate deploy
   node prisma/seed.js
   ```

---

## 🧪 Testing Steps

After fixing the database connection:

1. **Test Connection:**
   ```bash
   cd /Users/riteshkumar/Desktop/snw/AP/CAPSTONE/backend
   node test-db.js
   ```
   
   ✅ Should show:
   ```
   Testing database connection...
   ✅ Connected to database
   User count: X
   Robot count: X
   Sensor count: X
   ```

2. **Run Seed:**
   ```bash
   node prisma/seed.js
   ```
   
   ✅ Should show:
   ```
   🌱 Starting seed...
   🗑️  Clearing existing data...
   👤 Creating demo user...
   ✅ Created user: demo@synciot.com
   🤖 Creating robots...
   ✅ Created 3 robots
   📡 Creating sensors...
   ✅ Created sensors for all robots
   ```

3. **Start Backend:**
   ```bash
   npm start
   ```
   
   ✅ Should show:
   ```
   ✅ Server is running on http://localhost:3001
   ```

4. **Test Login API:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"demo@synciot.com","password":"demo123"}'
   ```
   
   ✅ Should return JWT token

---

## 📝 Quick Checklist

- [ ] Checked Aiven console for database status
- [ ] Database is running (not paused/stopped)
- [ ] DATABASE_URL in .env is correct
- [ ] Can connect to database (`node test-db.js` works)
- [ ] Ran migrations (`npx prisma migrate deploy`)
- [ ] Ran seed (`node prisma/seed.js`)
- [ ] Backend starts without errors
- [ ] Login API works

---

## 🆘 Still Not Working?

If none of the above solutions work:

1. **Check Network:**
   ```bash
   ping pg-1c81a21d-synciot.e.aivencloud.com
   ```

2. **Check SSL:**
   Update DATABASE_URL to:
   ```
   DATABASE_URL="postgresql://...?sslmode=require"
   ```

3. **Try Without SSL:**
   ```
   DATABASE_URL="postgresql://...?sslmode=disable"
   ```

4. **Check Firewall:**
   - Make sure port 28118 is not blocked
   - Try from different network

5. **Use Fresh Database:**
   - Create new database on Railway/Supabase
   - These have more reliable free tiers

---

## 📌 Recommended: Railway or Supabase

For development, I recommend using **Railway** or **Supabase** instead of Aiven because:
- ✅ More reliable free tier
- ✅ Better uptime
- ✅ Easier to manage
- ✅ Faster connection
- ✅ No pausing issues

---

**Current Status:** Database connection failed
**Next Step:** Choose one of the solutions above and follow the steps
