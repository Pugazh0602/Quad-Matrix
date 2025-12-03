# MongoDB Setup for QuadMatrix

## Installation Guide

### Windows Installation

#### Option 1: MongoDB Community Server (Recommended)

1. **Download MongoDB**
   - Visit: https://www.mongodb.com/try/download/community
   - Select: Windows, MSI package
   - Current version: 6.0+ recommended

2. **Run Installer**
   - Double-click the MSI file
   - Click "Next" through setup wizard
   - Select "Install MongoDB as a Service" (automatic startup)
   - Choose installation directory (default: C:\Program Files\MongoDB\Server\6.0)
   - Click "Install"

3. **Verify Installation**
```powershell
mongod --version
# Output should show version number
```

#### Option 2: MongoDB Portable (No Service)

1. **Download**
   - ZIP package from MongoDB download page

2. **Extract**
```powershell
Expand-Archive mongodb-windows-x86_64-*.zip -DestinationPath "C:\"
```

3. **Create Data Directory**
```powershell
mkdir "C:\data\db"
mkdir "C:\data\log"
```

4. **Run MongoDB**
```powershell
C:\mongodb-windows-x86_64-*\bin\mongod --dbpath "C:\data\db"
```

---

### Starting MongoDB

#### As a Service (Windows Service)
```powershell
# Start service
net start MongoDB

# Stop service
net stop MongoDB

# Check status
Get-Service MongoDB | Select-Object Status
```

#### Manual Start
```powershell
# If installed to default location
mongod --dbpath "C:\data\db"

# Custom location
mongod --dbpath "D:\mongodb_data"

# With logging
mongod --dbpath "C:\data\db" --logpath "C:\data\log\mongod.log"
```

---

### Verify MongoDB is Running

#### Method 1: PowerShell
```powershell
Get-Process mongod
# Output shows mongod.exe process running
```

#### Method 2: MongoDB Shell
```powershell
mongosh
# or older versions
mongo

# In shell, you should see version info
# Type: exit
```

#### Method 3: Network Port
```powershell
netstat -ano | findstr :27017
# Should show listening on port 27017
```

---

### Create QuadMatrixLog Database

The database is automatically created on first connection.

#### Manual Creation (Optional)
```powershell
mongosh

# Switch to QuadMatrixLog database
use QuadMatrixLog

# Create a test collection
db.test.insertOne({ test: true })

# Verify
db.getCollectionNames()

# Exit
exit
```

---

### Collections Setup

All collections are automatically created by the backend when the server starts.

To manually create collection schemas:
```javascript
// In mongosh
use QuadMatrixLog

// Admin collection
db.createCollection("admin", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "username", "email", "password"],
      properties: {
        userId: { bsonType: "string" },
        username: { bsonType: "string" },
        email: { bsonType: "string" },
        password: { bsonType: "string" },
        role: { bsonType: "string" },
        isActive: { bsonType: "bool" }
      }
    }
  }
})

// Similarly for other collections...
```

---

### Database Backup

#### Full Database Backup
```powershell
# Create backup directory
mkdir "C:\backups\QuadMatrixLog_$(Get-Date -Format 'yyyy-MM-dd')"

# Backup command
mongodump --db QuadMatrixLog --out "C:\backups\QuadMatrixLog_$(Get-Date -Format 'yyyy-MM-dd')"

# Verify backup
dir "C:\backups\QuadMatrixLog_$(Get-Date -Format 'yyyy-MM-dd')"
```

#### Scheduled Daily Backup (PowerShell Script)
Create file: `C:\backup-quadmatrix.ps1`

```powershell
# Backup script
$date = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "C:\backups\QuadMatrixLog_$date"
$mongoPath = "C:\Program Files\MongoDB\Server\6.0\bin"

# Create backup
& "$mongoPath\mongodump" --db QuadMatrixLog --out "$backupDir"

# Log the backup
"$date - Backup created at $backupDir" | Out-File -Append "C:\backups\backup.log"

# Clean up old backups (keep last 7 days)
$limit = (Get-Date).AddDays(-7)
Get-ChildItem "C:\backups" -Filter "QuadMatrixLog_*" -Directory | 
  Where-Object { $_.CreationTime -lt $limit } | 
  Remove-Item -Recurse -Force
```

Run scheduled backup with Windows Task Scheduler:
1. Open "Task Scheduler"
2. Create Basic Task
3. Name: "QuadMatrix Daily Backup"
4. Trigger: Daily at 2 AM
5. Action: PowerShell script
6. Script: `C:\backup-quadmatrix.ps1`

---

### Database Restore

#### Restore from Backup
```powershell
mongorestore --db QuadMatrixLog "C:\backups\QuadMatrixLog_2024-12-02\QuadMatrixLog"

# Verify restoration
mongosh
use QuadMatrixLog
db.login_log.count()  # Should show number of documents
```

---

### Data Cleanup & Maintenance

#### Remove Old Login Logs (Older than 90 days)
```javascript
use QuadMatrixLog

db.login_log.deleteMany({
  loginTime: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
})
```

#### Remove Old Security Logs (Older than 6 months)
```javascript
db.security_log.deleteMany({
  createdAt: { $lt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) }
})
```

#### Archive to Separate Database
```javascript
// Connect to QuadMatrixLog
use QuadMatrixLog

// Get logs from 90+ days ago
const oldLogs = db.login_log.find({
  loginTime: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
}).toArray()

// Switch to archive database
use QuadMatrixLog_Archive

// Insert into archive
db.login_log.insertMany(oldLogs)

// Delete from main database
use QuadMatrixLog
db.login_log.deleteMany({
  loginTime: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
})
```

---

### Database Monitoring

#### Database Size
```javascript
use QuadMatrixLog
db.stats()

// Output shows:
// dataSize: total data size in bytes
// storageSize: allocated storage in bytes
// indexes: number of indexes
// collections: number of collections
```

#### Collection Sizes
```javascript
db.login_log.stats()
db.security_log.stats()
db.device_log.stats()
```

#### Connection Info
```javascript
db.adminCommand("ping")  // Check connection
db.version()             // MongoDB version
db.getUsers()           // List users
```

---

### Users & Authentication (Optional)

#### Create Admin User for MongoDB
```javascript
use admin

db.createUser({
  user: "quadmatrix_admin",
  pwd: "SecurePassword123!",
  roles: [
    { role: "dbOwner", db: "QuadMatrixLog" },
    { role: "dbAdmin", db: "QuadMatrixLog" }
  ]
})
```

#### Connect with Authentication
```powershell
mongosh --username quadmatrix_admin --password --authenticationDatabase admin

# Or in connection string
mongosh "mongodb://quadmatrix_admin:password@localhost:27017/QuadMatrixLog?authSource=admin"
```

---

### Troubleshooting MongoDB

#### "mongod is not recognized as an internal or external command"

**Solution:** Add MongoDB to PATH or use full path

```powershell
# Add to PATH in System Environment Variables
# C:\Program Files\MongoDB\Server\6.0\bin

# Or use full path
"C:\Program Files\MongoDB\Server\6.0\bin\mongod" --dbpath "C:\data\db"
```

#### "Exception: connect ECONNREFUSED 127.0.0.1:27017"

**Solution:** MongoDB is not running

```powershell
# Start MongoDB service
net start MongoDB

# Or run manually
mongod --dbpath "C:\data\db"
```

#### "Cannot create directory 'C:\data\db'"

**Solution:** Create data directory first

```powershell
mkdir "C:\data\db"
mkdir "C:\data\log"
```

#### "Disk quota exceeded"

**Solution:** Clean up old data or expand storage

```powershell
# Check disk space
Get-PSDrive C

# Archive old logs
# See "Archive to Separate Database" section above
```

#### "Too many open files"

**Solution:** Increase system limits (Linux/macOS)

```bash
# Add to /etc/security/limits.conf
mongod soft nofile 64000
mongod hard nofile 64000
```

---

### Performance Optimization

#### Create Indexes
```javascript
use QuadMatrixLog

// Index for faster login queries
db.login_log.createIndex({ userId: 1, loginTime: -1 })

// Index for suspicious activity
db.login_log.createIndex({ suspiciousActivity: 1 })

// Index for IP tracking
db.device_log.createIndex({ ipAddress: 1 })

// Index for security events
db.security_log.createIndex({ eventType: 1, severity: 1 })

// List all indexes
db.login_log.getIndexes()
```

#### Enable Compression
MongoDB automatically enables compression. Check configuration:

```javascript
db.adminCommand("getCmdLineOpts")
```

---

### Monitoring Tools

#### MongoDB Compass (GUI)
Download: https://www.mongodb.com/try/download/compass

Features:
- Visual database browser
- Query builder
- Index management
- Performance analysis

Connection String:
```
mongodb://localhost:27017/QuadMatrixLog
```

#### mongosh (Command Line)
```powershell
# Connect
mongosh

# Switch database
use QuadMatrixLog

# Basic commands
show databases
show collections
db.login_log.find().limit(5)
db.login_log.count()
```

---

### Maintenance Checklist

- [ ] MongoDB running (verify with `Get-Process mongod`)
- [ ] QuadMatrixLog database created
- [ ] All 7 collections created
- [ ] Indexes created for performance
- [ ] Daily backups scheduled
- [ ] Backup restoration tested
- [ ] Data cleanup policy defined
- [ ] Storage monitoring enabled
- [ ] User authentication configured
- [ ] Monitoring tool (Compass) installed

---

### Resources

- **Official MongoDB Docs:** https://docs.mongodb.com/
- **MongoDB Manual:** https://docs.mongodb.com/manual/
- **MongoDB Compass:** https://www.mongodb.com/products/compass
- **MongoDB Atlas (Cloud - Optional):** https://www.mongodb.com/cloud/atlas

---

**MongoDB Setup Complete - Ready for QuadMatrix Deployment**
