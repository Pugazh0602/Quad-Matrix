import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import usersRoutes from "./backend/routes/users.js";
import sessionsRoutes from "./backend/routes/sessions.js";
import allSessionsRoutes from "./backend/routes/allSessions.js";
import logsRoutes from "./backend/routes/logs.js";
import adminRoutes from "./backend/routes/admin.js";
import employeesRoutes from "./backend/routes/employees.js";
import StartupLog from "./backend/models/StartupLog.js";
import { generateLogId } from "./backend/utils/security.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000; // <- The previous code had a typo here, assigning PORT value to MONGODB_URI
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/QuadMatrixLog";

// Middleware
const allowedOrigins = [
  process.env.CORS_ORIGIN || "http://localhost:8080",
  "http://localhost:5173",
  "http://198.168.1.101:8080",
  "http://198.168.1.102:8080",
  "http://198.168.1.103:8080",
  "http://localhost:3000",
  "http://localhost:5000",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    const ipPattern = /^https?:\/\/198\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/;
    if (ipPattern.test(origin)) {
      return callback(null, true);
    }
    
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log("✓ Connected to MongoDB - QuadMatrixLog database");
    
    const startupDuration = process.uptime();
    await StartupLog.create({
      startupId: generateLogId("startup"),
      serverId: "QuadMatrix_Local_Server",
      systemUptime: `${Math.floor(startupDuration)}s`,
      databaseStatus: "healthy",
      collectionsInitialized: [
        "admin",
        "config",
        "local",
        "startup_log",
        "login_log",
        "device_log",
        "security_log",
      ],
      startupDuration: `${Math.floor(startupDuration)}s`,
    });
    
    console.log("✓ System startup logged to database");
  } catch (error) {
    console.error("✗ MongoDB connection error:", error. message);
    console.error("  Ensure MongoDB is running at:", MONGODB_URI);
    process.exit(1);
  }
};

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date(),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: process.uptime(),
  });
});

// Routes
app.use("/api/admin", adminRoutes);
app. use("/api/employees", employeesRoutes);
app.use("/api/all-sessions", allSessionsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/api/logs", logsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res. status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});

// Start server
const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, "0.0.0.0", () => {
    console.log("\n╔════════════════════════════════════════════════════════╗");
    console.log("║           QuadMatrix Login-Logout Tracker              ║");
    console.log("╠════════════════════════════════════════════════════════╣");
    console.log(`║ Server running on port ${PORT. toString(). padEnd(45)} ║`);
    console. log(`║ Listening on all network interfaces (0.0.0.0)          ║`);
    console.log(`║ Database: ${MONGODB_URI. split("/"). pop(). padEnd(46)} ║`);
    console. log("║                                                        ║");
    console.log("║ API Endpoints:                                         ║");
    console.log("║  • GET    /api/all-sessions - All sessions             ║");
    console.log("║  • GET    /api/all-sessions/stats/summary - Stats      ║");
    console. log("║  • GET    /api/all-sessions/active - Active sessions   ║");
    console.log("║  • GET    /api/all-sessions/completed - Completed      ║");
    console.log("║  • GET    /api/employees/:id/sessions - User sessions  ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");
  });
};

startServer();