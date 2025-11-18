# IoT Rover Backend - Express + Prisma + MySQL

## Setup Instructions

### 1. Prerequisites
- Node.js (v14 or higher)
- MySQL Server running locally
- npm or yarn

### 2. Installation

```bash
# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Create database and run migrations
npm run prisma:migrate
```

### 3. Database Setup
Make sure MySQL is running and create a database:

```sql
CREATE DATABASE iot_rover;
```

Or Prisma will create it automatically on first migration.

### 4. Environment Variables
The `.env` file is already configured with:
- DATABASE_URL: `mysql://root:root@localhost:3306/iot_rover`
- JWT_SECRET: Change this in production
- PORT: 5000

### 5. Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

### 6. API Endpoints

#### Authentication

**Sign Up**
```
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

Response:
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "operator"
  }
}
```

**Login**
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "operator"
  }
}
```

#### Health Check
```
GET /api/health

Response:
{
  "message": "Backend is running"
}
```

### 7. Testing with Postman/Curl

**Sign Up:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","name":"Test User"}'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'
```

### 8. Database Management

View and manage data with Prisma Studio:
```bash
npm run prisma:studio
```

This opens a visual interface at http://localhost:5555

## Project Structure

```
backend/
├── src/
│   ├── index.js              # Main server file
│   ├── routes/
│   │   └── auth.js           # Authentication routes
│   ├── middleware/
│   │   └── authMiddleware.js # JWT verification
│   └── utils/
│       └── auth.js           # Password & JWT utilities
├── prisma/
│   └── schema.prisma         # Database schema
├── .env                      # Environment variables
├── package.json              # Dependencies
└── README.md                 # This file
```

## Next Steps
- Add more API endpoints (rover control, sensors, logs)
- Implement role-based authorization
- Add error handling and validation
- Deploy to Render/Railway
# synciot_backend
