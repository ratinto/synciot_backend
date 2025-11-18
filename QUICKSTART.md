# Quick Start Guide

## Step 1: Navigate to backend folder
```bash
cd /Users/riteshkumar/Desktop/snw/AP/CAPSTONE/backend
```

## Step 2: Install dependencies
```bash
npm install
```

## Step 3: Make sure MySQL is running
- On Mac: `brew services start mysql` (if installed via Homebrew)
- Or start MySQL Server from System Preferences

## Step 4: Generate Prisma Client and create database
```bash
npm run prisma:migrate
```

When prompted, give the migration a name like "init"

## Step 5: Start the development server
```bash
npm run dev
```

You should see: ✅ Server is running on http://localhost:5000

## Step 6: Test the APIs

### Test Sign Up:
Open terminal and run:
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test1@example.com","password":"password123","name":"Test User"}'
```

### Test Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test1@example.com","password":"password123"}'
```

## Troubleshooting

### Issue: Cannot connect to database
- Ensure MySQL service is running
- Verify credentials in .env (root:root)
- Check if port 3306 is not blocked

### Issue: prisma:migrate fails
- Make sure DATABASE_URL in .env is correct
- Try: `npm run prisma:generate` first, then `npm run prisma:migrate`

### Issue: Port 5000 already in use
- Change PORT in .env to something like 5001
- Or kill the process: `lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9`

## Next: View Database
Once running, open another terminal and run:
```bash
npm run prisma:studio
```

This opens http://localhost:5555 where you can see your users table with hashed passwords!
