import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import usersRoutes from "./backend/routes/users.js";
import sessionsRoutes from "./backend/routes/sessions.js";
import logsRoutes from "./backend/routes/logs.js";
import StartupLog from "./backend/models/StartupLog.js";
import { generateLogId } from "./backend/utils/security.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/QuadMatrixLog";

// Middleware
// Allow CORS from network IPs and localhost
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
    // Allow requests with no origin (mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check if origin is from the allowed IP range (198.168.x.x)
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

// MongoDB Connection with error handling
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log("✓ Connected to MongoDB - QuadMatrixLog database");
    
    // Log startup
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
    console.error("✗ MongoDB connection error:", error.message);
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

// Tracking Routes
app.use("/api/users", usersRoutes);
app.use("/api/sessions", sessionsRoutes);

// Logs Routes
app.use("/api/logs", logsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
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
    console.log(`║ Server running on port ${PORT.toString().padEnd(45)} ║`);
    console.log(`║ Listening on all network interfaces (0.0.0.0)          ║`);
    console.log(`║ Access via: 198.168.1.101:${PORT} | 198.168.1.102:${PORT} | 198.168.1.103:${PORT} ║`);
    console.log(`║ Database: ${MONGODB_URI.split("/").pop().padEnd(46)} ║`);
    console.log(`║ Environment: ${(process.env.NODE_ENV || "development").padEnd(42)} ║`);
    console.log("║                                                        ║");
    console.log("║ API Endpoints:                                         ║");
    console.log("║  • POST   /api/sessions - Create work session          ║");
    console.log("║  • GET    /api/sessions - List sessions                ║");
    console.log("║  • PUT    /api/sessions/:id - Update session           ║");
    console.log("║  • GET    /api/logs/login - View login logs           ║");
    console.log("║  • GET    /api/logs/security - View security logs     ║");
    console.log("║  • GET    /api/health - Health check                  ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");
  });
};

startServer();
