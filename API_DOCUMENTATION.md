# SyncIoT Backend API Documentation

## Overview
Backend API for IoT Robot Management System with sensor monitoring capabilities.

## Base URL
- **Development:** `http://localhost:3001/api`
- **Production:** `https://synciot-backend.vercel.app/api`

---

## Authentication

### 1. Sign Up
**POST** `/auth/signup`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "operator"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 2. Login
**POST** `/auth/login`

Login to existing account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "operator"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## Robots Management
**All routes require authentication token in Authorization header:**
`Authorization: Bearer <token>`

### 3. Get All Robots
**GET** `/robots`

Get list of all robots (for dashboard).

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Robot Alpha",
      "status": "online",
      "battery": 85,
      "lastSeen": "2025-11-19T10:30:00.000Z",
      "createdAt": "2025-11-01T08:00:00.000Z",
      "updatedAt": "2025-11-19T10:30:00.000Z",
      "_count": {
        "sensors": 5
      }
    }
  ]
}
```

---

### 4. Get Robot by ID (with sensors)
**GET** `/robots/:id`

Get specific robot with all its sensors.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Robot Alpha",
    "status": "online",
    "battery": 85,
    "lastSeen": "2025-11-19T10:30:00.000Z",
    "createdAt": "2025-11-01T08:00:00.000Z",
    "updatedAt": "2025-11-19T10:30:00.000Z",
    "sensors": [
      {
        "id": 1,
        "robotId": 1,
        "name": "Temperature Sensor",
        "type": "temperature",
        "value": 25.5,
        "unit": "°C",
        "createdAt": "2025-11-01T08:00:00.000Z",
        "updatedAt": "2025-11-19T10:30:00.000Z"
      },
      {
        "id": 2,
        "robotId": 1,
        "name": "Humidity Sensor",
        "type": "humidity",
        "value": 65.2,
        "unit": "%",
        "createdAt": "2025-11-01T08:00:00.000Z",
        "updatedAt": "2025-11-19T10:30:00.000Z"
      }
    ]
  }
}
```

---

### 5. Add New Robot
**POST** `/robots`

Add a new robot to the system.

**Request Body:**
```json
{
  "name": "Robot Beta",
  "status": "offline",
  "battery": 100
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Robot added successfully",
  "data": {
    "id": 2,
    "name": "Robot Beta",
    "status": "offline",
    "battery": 100,
    "lastSeen": "2025-11-19T10:35:00.000Z",
    "createdAt": "2025-11-19T10:35:00.000Z",
    "updatedAt": "2025-11-19T10:35:00.000Z"
  }
}
```

---

### 6. Update Robot
**PUT** `/robots/:id`

Update robot information.

**Request Body:**
```json
{
  "name": "Robot Beta Updated",
  "status": "online",
  "battery": 95
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Robot updated successfully",
  "data": {
    "id": 2,
    "name": "Robot Beta Updated",
    "status": "online",
    "battery": 95,
    "lastSeen": "2025-11-19T10:40:00.000Z",
    "createdAt": "2025-11-19T10:35:00.000Z",
    "updatedAt": "2025-11-19T10:40:00.000Z"
  }
}
```

---

### 7. Delete Robot
**DELETE** `/robots/:id`

Delete robot and all its sensors.

**Response (200):**
```json
{
  "success": true,
  "message": "Robot deleted successfully"
}
```

---

## Sensors Management
**All routes require authentication token**

### 8. Get Robot's Sensors
**GET** `/robots/:robotId/sensors`

Get all sensors for a specific robot.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "robotId": 1,
      "name": "Temperature Sensor",
      "type": "temperature",
      "value": 25.5,
      "unit": "°C",
      "createdAt": "2025-11-01T08:00:00.000Z",
      "updatedAt": "2025-11-19T10:30:00.000Z"
    }
  ]
}
```

---

### 9. Get Single Sensor
**GET** `/sensors/:id`

Get specific sensor with robot info.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "robotId": 1,
    "name": "Temperature Sensor",
    "type": "temperature",
    "value": 25.5,
    "unit": "°C",
    "createdAt": "2025-11-01T08:00:00.000Z",
    "updatedAt": "2025-11-19T10:30:00.000Z",
    "robot": {
      "id": 1,
      "name": "Robot Alpha",
      "status": "online",
      "battery": 85
    }
  }
}
```

---

### 10. Add Sensor to Robot
**POST** `/robots/:robotId/sensors`

Add a new sensor to specific robot.

**Request Body:**
```json
{
  "name": "Distance Sensor",
  "type": "distance",
  "value": 15.5,
  "unit": "cm"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Sensor added successfully",
  "data": {
    "id": 3,
    "robotId": 1,
    "name": "Distance Sensor",
    "type": "distance",
    "value": 15.5,
    "unit": "cm",
    "createdAt": "2025-11-19T10:45:00.000Z",
    "updatedAt": "2025-11-19T10:45:00.000Z"
  }
}
```

---

### 11. Update Sensor
**PUT** `/sensors/:id`

Update sensor information.

**Request Body:**
```json
{
  "name": "Updated Distance Sensor",
  "value": 20.3
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Sensor updated successfully",
  "data": {
    "id": 3,
    "robotId": 1,
    "name": "Updated Distance Sensor",
    "type": "distance",
    "value": 20.3,
    "unit": "cm",
    "createdAt": "2025-11-19T10:45:00.000Z",
    "updatedAt": "2025-11-19T10:50:00.000Z"
  }
}
```

---

### 12. Delete Sensor
**DELETE** `/sensors/:id`

Delete sensor from robot.

**Response (200):**
```json
{
  "success": true,
  "message": "Sensor deleted successfully"
}
```

---

## Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation error message"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Invalid or missing token"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Robot not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Failed to perform operation",
  "error": "Detailed error message"
}
```

---

## Sensor Types Reference

| Type | Description | Unit Examples |
|------|-------------|---------------|
| `temperature` | Temperature readings | °C, °F, K |
| `humidity` | Humidity percentage | % |
| `distance` | Distance measurements | cm, m, inches |
| `battery` | Battery level | % |
| `signal` | Signal strength | dBm, bars |
| `pressure` | Atmospheric pressure | hPa, psi |
| `light` | Light intensity | lux, % |

---

## Authentication Flow

1. **Sign Up/Login** → Receive JWT token
2. **Store token** in client (localStorage/cookies)
3. **Include token** in all protected API requests:
   ```
   Authorization: Bearer <your_token>
   ```
4. Token expires after 24 hours

---

## Database Schema

### User
- `id` - Auto increment ID
- `email` - Unique email
- `password` - Hashed password
- `name` - User's full name
- `role` - "operator" or "admin"

### Robot
- `id` - Auto increment ID
- `name` - Robot name
- `status` - "online", "offline", "error"
- `battery` - 0-100 percentage
- `lastSeen` - Last activity timestamp

### Sensor
- `id` - Auto increment ID
- `robotId` - Foreign key to Robot
- `name` - Sensor name
- `type` - Sensor type (temperature, humidity, etc.)
- `value` - Current sensor reading
- `unit` - Measurement unit

---

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables in `.env`:
   ```
   DATABASE_URL="postgresql://..."
   JWT_SECRET="your-secret-key"
   PORT=3001
   ```

3. Run migrations:
   ```bash
   npx prisma migrate dev
   ```

4. Start server:
   ```bash
   npm start
   ```

---

## Testing with cURL

**Login Example:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

**Get Robots (with token):**
```bash
curl -X GET http://localhost:3001/api/robots \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

**Last Updated:** December 1, 2025
**Version:** 2.0
