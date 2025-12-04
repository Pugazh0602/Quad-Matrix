import express from "express";
import User from "../models/User.js";
import Session from "../models/Session.js";
import { adminAuthMiddleware } from "../middleware/adminAuth.js";

const router = express.Router();

// Get all employees
router.get("/", adminAuthMiddleware, async (req, res) => {
  try {
    const employees = await User. find()
      .select("-password")
      .lean()
      .limit(100);

    res.json({
      success: true,
      data: employees,
      total: employees.length,
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch employees",
      error: error.message,
    });
  }
});

// Get employee by ID
router.get("/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const employee = await User.findById(req.params.id)
      .select("-password")
      .lean();

    if (! employee) {
      return res. status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch employee",
      error: error.message,
    });
  }
});

// Get employee sessions
router.get("/:id/sessions", adminAuthMiddleware, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Format sessions properly
    const formattedSessions = sessions.map(session => ({
      _id: session._id. toString(),
      userId: session.userId,
      startTime: session.startTime ?  new Date(session.startTime).toISOString() : null,
      endTime: session.endTime ?  new Date(session.endTime). toISOString() : null,
      duration: session.duration || 0,
      deviceInfo: session.deviceInfo || "Unknown",
      status: session. status || (session.endTime ? "completed" : "active"),
      createdAt: session.createdAt ? new Date(session.createdAt).toISOString() : null,
    }));

    res.json({
      success: true,
      data: formattedSessions,
      total: formattedSessions.length,
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sessions",
      error: error.message,
    });
  }
});

// Get employee statistics
router.get("/:id/stats", adminAuthMiddleware, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.params.id }). lean();
    const employee = await User.findById(req.params.id)
      .select("-password")
      .lean();

    if (! employee) {
      return res. status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(s => ! s.endTime).length;
    
    let totalHours = 0;
    sessions.forEach(s => {
      if (s.endTime && s.startTime) {
        const start = new Date(s.startTime). getTime();
        const end = new Date(s.endTime).getTime();
        const durationMs = end - start;
        if (durationMs > 0) {
          totalHours += durationMs / (1000 * 60 * 60);
        }
      }
    });

    const lastLogin = employee.lastLogin 
      ? new Date(employee. lastLogin).toISOString() 
      : "Never";

    res.json({
      success: true,
      data: {
        employee: {
          ... employee,
          createdAt: new Date(employee.createdAt). toISOString(),
          lastLogin: lastLogin,
        },
        stats: {
          totalSessions,
          activeSessions,
          totalHours: totalHours.toFixed(2),
          lastLogin: lastLogin,
        },
      },
    });
  } catch (error) {
    console. error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
});

// Search employees
router.get("/search/query", adminAuthMiddleware, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters",
      });
    }

    const employees = await User.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { username: { $regex: q, $options: "i" } },
      ],
    })
      . select("-password")
      .limit(50)
      .lean();

    res.json({
      success: true,
      data: employees,
      total: employees.length,
    });
  } catch (error) {
    console.error("Error searching employees:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search employees",
      error: error.message,
    });
  }
});

export default router;