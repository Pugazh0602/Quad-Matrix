# QuadMatrix API Reference Card

**Base URL:** `http://localhost:5000/api`  
**Auth Header:** `Authorization: Bearer {token}`

---

## Authentication Endpoints

### 1. Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@quadmatrix.local",
  "password": "YourPassword123!"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "admin@quadmatrix.local",
    "username": "admin",
    "role": "super_admin"
  },
  "session": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "loginTime": "2024-12-02T10:30:00Z"
  },
  "suspiciousActivity": false
}
```

**Response (Failure):**
```json
{
  "success": false,
  "message": "Invalid credentials",
  "loginResult": "failed"
}
```

---

### 2. Logout
```http
POST /auth/logout
Authorization: Bearer {token}
Content-Type: application/json

{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful",
  "session": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "loginTime": "2024-12-02T10:30:00Z",
    "logoutTime": "2024-12-02T11:45:30Z",
    "duration": "1h 15m 30s"
  }
}
```

---

## Tracking Endpoints

### 3. Track Startup
```http
POST /track/startup
Content-Type: application/json

{
  "serverId": "QuadMatrix_Local_Server",
  "systemUptime": "15h 30m",
  "databaseStatus": "healthy"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Startup logged successfully",
  "data": {
    "startupId": "startup_...",
    "timestamp": "2024-12-02T10:30:00Z",
    "databaseStatus": "healthy",
    "collectionsInitialized": [...]
  }
}
```

---

### 4. Track Device
```http
POST /track/device
Content-Type: application/json

{
  "userId": "user_123",
  "userEmail": "user@quadmatrix.local",
  "deviceType": "desktop",
  "operatingSystem": "Windows 11",
  "browser": "Chrome",
  "ipAddress": "192.168.1.100",
  "macAddress": "00:1A:2B:3C:4D:5E",
  "location": "Building A - Floor 3"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Device tracked successfully",
  "isNew": true,
  "data": {
    "deviceId": "dev_...",
    "trustLevel": "unknown",
    "isKnownDevice": false,
    "firstSeen": "2024-12-02T10:30:00Z"
  }
}
```

---

### 5. Verify Device (Mark as Trusted)
```http
POST /track/device/verify
Authorization: Bearer {token}
Content-Type: application/json

{
  "deviceId": "dev_...",
  "trustLevel": "trusted"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Device verified",
  "data": {
    "deviceId": "dev_...",
    "trustLevel": "trusted",
    "isVerified": true
  }
}
```

---

### 6. Get User Devices
```http
GET /track/device/user/user_123
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "deviceId": "dev_...",
      "deviceType": "desktop",
      "operatingSystem": "Windows 11",
      "browser": "Chrome",
      "ipAddress": "192.168.1.100",
      "trustLevel": "trusted",
      "lastSeen": "2024-12-02T11:45:30Z"
    }
  ]
}
```

---

## Logs Endpoints

### 7. Get Login Logs
```http
GET /logs/login?limit=50&skip=0&userId=user_123&startDate=2024-12-01
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit` (default: 50) - Results per page
- `skip` (default: 0) - Results to skip
- `userId` - Filter by user ID
- `userEmail` - Filter by email
- `startDate` - Start date (ISO 8601)
- `endDate` - End date (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "login_...",
      "userId": "user_123",
      "userEmail": "user@quadmatrix.local",
      "username": "john_doe",
      "userRole": "user",
      "loginTime": "2024-12-02T10:30:00Z",
      "logoutTime": "2024-12-02T11:45:30Z",
      "sessionDuration": "1h 15m 30s",
      "deviceType": "desktop",
      "operatingSystem": "Windows 11",
      "browser": "Chrome",
      "ipAddress": "192.168.1.100",
      "loginResult": "success",
      "suspiciousActivity": false
    }
  ],
  "pagination": {
    "total": 250,
    "limit": 50,
    "skip": 0
  }
}
```

---

### 8. Get Security Logs
```http
GET /logs/security?severity=high&eventType=multiple_failed_logins&limit=50
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit` (default: 50)
- `skip` (default: 0)
- `eventType` - Event type filter
- `severity` - Severity level (low, medium, high, critical)
- `userId` - User ID filter
- `startDate` - Start date
- `endDate` - End date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "securityEventId": "sec_...",
      "eventType": "multiple_failed_logins",
      "severity": "high",
      "userId": "user_123",
      "userEmail": "user@quadmatrix.local",
      "ipAddress": "192.168.1.100",
      "description": "Multiple failed login attempts detected",
      "details": {
        "failureCount": 5
      },
      "createdAt": "2024-12-02T10:35:00Z",
      "isResolved": false
    }
  ],
  "pagination": {
    "total": 12,
    "limit": 50,
    "skip": 0
  }
}
```

---

### 9. Get Suspicious Activities
```http
GET /logs/suspicious?limit=50&userId=user_123
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "login_...",
      "userId": "user_123",
      "suspiciousActivity": true,
      "suspiciousReasons": ["new_ip_address", "unknown_device"],
      "loginTime": "2024-12-02T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 50,
    "skip": 0
  }
}
```

---

### 10. Get Login Statistics
```http
GET /logs/stats?days=30&userId=user_123
Authorization: Bearer {token}
```

**Query Parameters:**
- `days` (default: 30) - Time period
- `userId` (optional) - Filter by user

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLogins": 120,
    "successfulLogins": 115,
    "failedLogins": 5,
    "suspiciousLogins": 2,
    "successRate": "95.83",
    "averageSessionCount": 110
  },
  "period": {
    "days": 30,
    "from": "2024-11-02T00:00:00Z",
    "to": "2024-12-02T00:00:00Z"
  }
}
```

---

### 11. Get Failed Login Attempts
```http
GET /logs/failed-attempts?userEmail=user@quadmatrix.local&limit=50
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit` (default: 50)
- `userEmail` - Email filter
- `ipAddress` - IP address filter

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "login_...",
      "userId": "user_123",
      "userEmail": "user@quadmatrix.local",
      "loginResult": "failed",
      "failedReason": "Invalid password",
      "ipAddress": "192.168.1.100",
      "loginTime": "2024-12-02T10:30:00Z"
    }
  ]
}
```

---

## Health Endpoint

### 12. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-02T10:30:00Z",
  "database": "connected",
  "uptime": 3600.5
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid input or missing required fields"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid credentials or token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details (development only)"
}
```

---

## Curl Examples

### Login Example
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@quadmatrix.local",
    "password": "YourPassword123!"
  }' | ConvertFrom-Json
```

### Get Login Logs
```bash
curl -X GET "http://localhost:5000/api/logs/login?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN" | ConvertFrom-Json
```

### Get Statistics
```bash
curl -X GET "http://localhost:5000/api/logs/stats?days=30" \
  -H "Authorization: Bearer YOUR_TOKEN" | ConvertFrom-Json
```

---

## Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

---

## Authentication Flow

1. **POST /auth/login** → Get token
2. Use token in `Authorization: Bearer {token}` header
3. **POST /auth/logout** when done
4. Token expires in 8 hours (automatic)

---

## Response Format

All responses follow this format:
```json
{
  "success": true|false,
  "message": "Description",
  "data": { ... },
  "error": "Error details (if applicable)"
}
```

---

**API Reference - December 2, 2024**
**QuadMatrix Secure Local Login-Logout Tracking System**
