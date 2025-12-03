# QuadMatrix Secure Local Login-Logout Tracking System

## Overview

A comprehensive, secure local login-logout tracking system designed specifically for QuadMatrix company deployment on internal LAN. The system:

- ✓ Runs completely locally with no external dependencies
- ✓ Uses local MongoDB database (QuadMatrixLog)
- ✓ Tracks all user logins/logouts with comprehensive logging
- ✓ Detects suspicious activities automatically
- ✓ Monitors device changes and unknown IP addresses
- ✓ Maintains complete audit trail
- ✓ Provides detailed security event logging

## Architecture

### Database: QuadMatrixLog

Seven MongoDB collections store all tracking data:

**1. admin** - User accounts with login credentials
- userId, username, email, password (hashed)
- role (super_admin, admin, security_officer)
- permissions, lastLogin, isActive

**2. login_log** - Complete login/logout history
- Login/logout timestamps with auto-calculated session duration
- User information and device details
- IP address, device type, OS, browser
- Login result (success/failed) with failure reasons
- Suspicious activity flags with reason codes
- Two-factor authentication status
- Token ID for session validation

**3. device_log** - Device tracking and trust levels
- Device ID, user associations
- Device fingerprint (OS, browser, type)
- IP address and MAC address
- Trust level (trusted, unknown, suspicious, blocked)
- First seen / Last seen timestamps
- Failed login attempts per device

**4. security_log** - Security events and incidents
- Event type (suspicious login, brute force, unknown device, etc.)
- Severity levels (low, medium, high, critical)
- Detailed descriptions and evidence
- Resolution status and timeline

**5. startup_log** - System initialization records
- Server startup timestamp and uptime
- Database health status
- Collections initialized
- Startup duration

**6. config** - System configuration
- Feature flags and settings
- Security policies
- Session management rules
- Modifiable through API

**7. local** - Server information
- Server ID and name
- Server location
- Database version and health
- Last health check

## Installation

### Prerequisites

1. **Node.js** (v16 or higher)
```powershell
# Check version
node --version
npm --version
```

2. **MongoDB** (Community Edition - Local)
- Download: https://www.mongodb.com/try/download/community
- Installation guide: https://docs.mongodb.com/manual/installation/
- Verify installation:
```powershell
mongod --version
```

### Setup Steps

1. **Start MongoDB Service**
```powershell
# Windows Service (if installed as service)
net start MongoDB

# Or run MongoDB manually
mongod --dbpath "C:\data\db"
```

2. **Install Dependencies**
```powershell
cd user-activity-tracker
npm install
```

3. **Create Admin User** (First time setup)

Create a script file `setup-admin.js`:
```javascript
import mongoose from "mongoose";
import { hashPassword } from "./backend/utils/validation.js";
import Admin from "./backend/models/Admin.js";

await mongoose.connect("mongodb://localhost:27017/QuadMatrixLog");

const adminPassword = await hashPassword("ChangeMe123!");
const admin = await Admin.create({
  userId: "admin_001",
  username: "admin",
  email: "admin@quadmatrix.in",
  password: QuadMatrix@2025,
  role: "super_admin",
  permissions: ["read", "write", "delete", "admin"],
});

console.log("Admin user created:", admin.email);
process.exit(0);
```

Run:
```powershell
node setup-admin.js
```

4. **Start the Backend Server**
```powershell
# Development mode with auto-reload
npm run server:dev

# Production mode
npm run server
```

5. **Start the Frontend** (in new terminal)
```powershell
npm run dev
```

6. **Access the Application**
```
http://localhost:8080/login
```

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### 1. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@quadmatrix.local",
  "password": "ChangeMe123!"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": {
    "id": "123...",
    "email": "admin@quadmatrix.local",
    "username": "admin",
    "role": "super_admin"
  },
  "session": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "loginTime": "2024-12-02T10:30:00.000Z"
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

#### 2. Logout
```http
POST /api/auth/logout
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
    "loginTime": "2024-12-02T10:30:00.000Z",
    "logoutTime": "2024-12-02T11:45:30.000Z",
    "duration": "1h 15m 30s"
  }
}
```

### Tracking Endpoints

#### 3. Track Startup (System)
```http
POST /api/track/startup
Content-Type: application/json

{
  "serverId": "QuadMatrix_Local_Server",
  "systemUptime": "15h 30m",
  "databaseStatus": "healthy"
}
```

#### 4. Track Device
```http
POST /api/track/device
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

**Response (New Device):**
```json
{
  "success": true,
  "message": "Device tracked successfully",
  "isNew": true,
  "data": {
    "deviceId": "dev_...",
    "userId": "user_123",
    "trustLevel": "unknown",
    "isKnownDevice": false,
    "firstSeen": "2024-12-02T10:30:00.000Z"
  }
}
```

#### 5. Verify Device (Mark as Trusted)
```http
POST /api/track/device/verify
Authorization: Bearer {token}
Content-Type: application/json

{
  "deviceId": "dev_...",
  "trustLevel": "trusted"
}
```

### Logs Endpoints

#### 6. Get Login Logs
```http
GET /api/logs/login?limit=50&skip=0&userId=user_123&startDate=2024-12-01
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
      "userEmail": "user@quadmatrix.local",
      "username": "john_doe",
      "loginTime": "2024-12-02T10:30:00.000Z",
      "logoutTime": "2024-12-02T11:45:30.000Z",
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

#### 7. Get Security Logs
```http
GET /api/logs/security?severity=high&eventType=multiple_failed_logins
Authorization: Bearer {token}
```

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
        "failureCount": 5,
        "recentAttempts": [...]
      },
      "createdAt": "2024-12-02T10:35:00.000Z",
      "isResolved": false
    }
  ]
}
```

#### 8. Get Suspicious Activities
```http
GET /api/logs/suspicious?limit=50
Authorization: Bearer {token}
```

#### 9. Get Login Statistics
```http
GET /api/logs/stats?days=30&userId=user_123
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLogins": 120,
    "successfulLogins": 115,
    "failedLogins": 5,
    "suspiciousLogins": 2,
    "successRate": "95.83"
  },
  "period": {
    "days": 30,
    "from": "2024-11-02T00:00:00.000Z",
    "to": "2024-12-02T00:00:00.000Z"
  }
}
```

#### 10. Get Failed Login Attempts
```http
GET /api/logs/failed-attempts?userEmail=user@quadmatrix.local
Authorization: Bearer {token}
```

#### 11. Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-02T10:30:00.000Z",
  "database": "connected",
  "uptime": 3600.5
}
```

## Suspicious Activity Detection

The system automatically flags activities as suspicious based on:

### 1. Multiple Failed Logins
- **Threshold:** 3+ failed attempts within 30 minutes
- **Action:** Flag as suspicious, log security event
- **Severity:** Medium to High (based on count)

### 2. Unknown Device
- **Trigger:** New device detected for user
- **Action:** Log security event, require verification
- **Severity:** Low

### 3. New IP Address
- **Trigger:** Login from previously unseen IP address
- **Action:** Flag as suspicious, track device
- **Severity:** Medium

### 4. Suspicious Location Change
- **Trigger:** Geographically impossible login (if geo-tracking enabled)
- **Severity:** High

## Security Features

### Password Security
- Bcryptjs hashing with salt rounds (10)
- No plaintext passwords stored
- Minimum password requirements: 8+ chars, uppercase, lowercase, number, special char

### Session Management
- JWT tokens with 8-hour expiration
- Session ID uniquely identifies each login
- Token ID prevents token reuse
- Automatic session duration calculation
- Session timeout policy enforcement

### Data Encryption
- All sensitive data hashed in database
- No external network exposure
- Local LAN only communication

### Audit Trail
- Complete login/logout history
- Failed attempt tracking
- Security event logging
- IP address and device tracking
- Session duration metrics

### Access Control
- Role-based permissions (super_admin, admin, security_officer)
- Token-based authentication on protected endpoints
- Activity logging for all administrative actions

## Maintenance

### Database Backups

Create backup script `backup-db.js`:
```powershell
# MongoDB backup
mongodump --db QuadMatrixLog --out "C:\backups\QuadMatrixLog_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')"

# Verify backup
dir C:\backups
```

### Database Cleanup

Remove old login logs (older than 90 days):
```javascript
await LoginLog.deleteMany({
  loginTime: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
});
```

### Monitoring

Check database size:
```javascript
const stats = await mongoose.connection.db.stats();
console.log(`Database size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
```

## Troubleshooting

### MongoDB Connection Issues

**Error:** `ECONNREFUSED 127.0.0.1:27017`

**Solution:**
1. Verify MongoDB is running:
```powershell
Get-Process mongod
```

2. Start MongoDB service:
```powershell
net start MongoDB
# or
mongod --dbpath "C:\data\db"
```

3. Check MongoDB logs:
```powershell
Get-Content "C:\Program Files\MongoDB\Server\6.0\log\mongod.log" -Tail 50
```

### Port Already in Use

**Error:** `listen EADDRINUSE :::5000`

**Solution:**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID)
taskkill /PID {PID} /F
```

### Token Expiration

**Error:** `Invalid or expired token`

**Solution:**
- User needs to login again
- Frontend should handle token refresh or re-login on 403

### Database Full

**Solution:**
- Archive old logs to separate database
- Implement data retention policy
- Regularly backup and purge old data

## Production Deployment Checklist

- [ ] Change JWT_SECRET to strong random value
- [ ] Set NODE_ENV=production
- [ ] Disable CORS debugging endpoints
- [ ] Setup database backups (daily)
- [ ] Implement log rotation policy
- [ ] Setup monitoring and alerting
- [ ] Configure firewall (LAN only)
- [ ] Change all default admin passwords
- [ ] Document admin procedures
- [ ] Setup automated backup verification

## Development Commands

```powershell
# Install dependencies
npm install

# Development mode (with auto-reload)
npm run server:dev

# Production build
npm run build

# Start frontend dev
npm run dev

# Start production server
npm run server

# Lint code
npm run lint

# Cleanup
npm run clean
```

## File Structure

```
backend/
├── controllers/
│   ├── authController.js          # Login/logout logic
│   ├── trackingController.js      # Device and startup tracking
│   └── logsController.js          # Log retrieval and filtering
├── middleware/
│   └── auth.js                    # JWT verification
├── models/
│   ├── Admin.js                   # Admin user model
│   ├── LoginLog.js                # Login/logout logs
│   ├── DeviceLog.js               # Device tracking
│   ├── SecurityLog.js             # Security events
│   ├── StartupLog.js              # Startup logs
│   ├── Config.js                  # Configuration
│   └── Local.js                   # Server info
├── routes/
│   ├── auth.js                    # /api/auth routes
│   ├── tracking.js                # /api/track routes
│   └── logs.js                    # /api/logs routes
└── utils/
    ├── security.js                # Token and crypto utilities
    └── validation.js              # Input validation

src/
├── pages/
│   ├── Login.tsx                  # Login page
│   ├── Dashboard.tsx              # Main dashboard
│   └── Index.tsx                  # Home page
└── contexts/
    └── AuthContext.tsx            # Global auth state
```

## Support & Contact

For issues or questions about QuadMatrix Login-Logout Tracker:
- Check logs in `/backend/logs/` directory
- Review MongoDB logs
- Check browser console for frontend errors

## License

Proprietary - QuadMatrix Company Only
