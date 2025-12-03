# QuadMatrix - Quick Start Guide

## First-Time Setup (5 Minutes)

### Step 1: Ensure MongoDB is Running

**Windows:**
```powershell
# Option A: If MongoDB is installed as a service
net start MongoDB

# Option B: Start MongoDB manually
mongod --dbpath "C:\data\db"
```

**Verify MongoDB is running:**
```powershell
mongo
# You should see MongoDB shell. Type: exit
```

### Step 2: Install Dependencies
```powershell
cd user-activity-tracker
npm install
```

### Step 3: Create Admin User
```powershell
node setup-admin.js
```

Follow the prompts:
- Username: `admin`
- Email: `admin@quadmatrix.local`
- Password: (at least 8 characters)

### Step 4: Start Backend Server (Terminal 1)
```powershell
npm run server:dev
```

You should see:
```
✓ Connected to MongoDB - QuadMatrixLog database
✓ System startup logged to database

╔════════════════════════════════════════════════════════╗
║           QuadMatrix Login-Logout Tracker              ║
╠════════════════════════════════════════════════════════╣
║ Server running on port 5000                            ║
...
```

### Step 5: Start Frontend (Terminal 2)
```powershell
npm run dev
```

You should see:
```
Local:        http://localhost:8080/
press h to show help
```

### Step 6: Login
1. Open browser: `http://localhost:8080`
2. Click "Login" button
3. Enter credentials from Step 3
4. ✓ You're logged in!

---

## Daily Usage

### Start the System
```powershell
# Terminal 1: Start MongoDB
mongod --dbpath "C:\data\db"

# Terminal 2: Start Backend
npm run server:dev

# Terminal 3: Start Frontend
npm run dev

# Open browser
http://localhost:8080
```

### Accessing the Dashboard
- View login history
- Monitor active sessions
- Check security alerts
- Review suspicious activities

### Security Monitoring
1. **Login Logs**: View all login/logout history
2. **Security Logs**: Review security events and alerts
3. **Suspicious Activities**: Check flagged activities
4. **Device Management**: Manage trusted devices

---

## Common Tasks

### Reset Admin Password
```powershell
node setup-admin.js
# Follow prompts to reset password
```

### Backup Database
```powershell
# Create backup folder
mkdir "C:\backups\QuadMatrixLog"

# Backup database
mongodump --db QuadMatrixLog --out "C:\backups\QuadMatrixLog_$(Get-Date -Format 'yyyy-MM-dd_HH-mm')"
```

### View MongoDB Data
```powershell
# Connect to MongoDB
mongo

# Use QuadMatrixLog database
use QuadMatrixLog

# View collections
show collections

# View login logs
db.login_log.find().limit(5)

# View security logs
db.security_log.find().limit(5)

# Exit
exit
```

### Stop the System
```powershell
# Press Ctrl+C in each terminal to stop services

# Or stop MongoDB service
net stop MongoDB
```

---

## API Quick Reference

All APIs require `Authorization: Bearer {token}` except login.

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@quadmatrix.local","password":"your_password"}'
```

### Logout
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"sessionId":"session_id"}'
```

### View Login Logs
```bash
curl "http://localhost:5000/api/logs/login?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### View Security Events
```bash
curl "http://localhost:5000/api/logs/security?severity=high" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### View Login Stats
```bash
curl "http://localhost:5000/api/logs/stats?days=30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Health Check
```bash
curl http://localhost:5000/api/health
```

---

## Troubleshooting

### "Cannot find module" errors
```powershell
# Clear node_modules and reinstall
rm -r node_modules
npm install
```

### "Port 5000 already in use"
```powershell
# Find and kill process
netstat -ano | findstr :5000
taskkill /PID {PID} /F
```

### "MongoDB connection refused"
```powershell
# Check if MongoDB is running
Get-Process mongod

# Start MongoDB
mongod --dbpath "C:\data\db"
```

### "Invalid token" error
- Token may have expired (8 hours)
- Simply login again

### Frontend not connecting to backend
- Verify backend is running on port 5000
- Check CORS_ORIGIN in .env
- Clear browser cache

---

## System Requirements

- **Node.js**: v16 or higher
- **MongoDB**: 4.0 or higher
- **RAM**: 2GB minimum
- **Storage**: 1GB minimum
- **Network**: Local LAN only
- **OS**: Windows 7+ / Linux / macOS

---

## Important Directories

```
user-activity-tracker/
├── backend/                 # Backend code
│   ├── controllers/        # Business logic
│   ├── models/            # Database schemas
│   ├── routes/            # API routes
│   ├── middleware/        # Authentication
│   └── utils/             # Helper functions
├── src/                    # Frontend code
│   ├── pages/            # React pages
│   ├── components/       # Reusable components
│   └── contexts/         # Global state
├── server.js             # Main server file
├── .env                  # Configuration
└── setup-admin.js        # Admin setup script
```

---

## Next Steps

1. **Create Additional Users**: Contact system administrator
2. **Configure Security Policies**: Edit config in MongoDB
3. **Setup Monitoring**: Review security logs regularly
4. **Backup Strategy**: Setup daily backups
5. **User Training**: Brief users on login system

---

## Support

For issues:
1. Check browser console (F12)
2. Review server logs in terminal
3. Check MongoDB logs
4. Review documentation in `QUADMATRIX_SETUP.md`

---

**Version**: 1.0  
**Last Updated**: December 2, 2024  
**Company**: QuadMatrix  
**Status**: Production Ready
