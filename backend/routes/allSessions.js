import express from "express";
import Session from "../models/Session.js";
import User from "../models/User.js";
import { adminAuthMiddleware } from "../middleware/adminAuth.js";

const router = express.Router();

// Get all sessions with user details
router.get("/", adminAuthMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const sessions = await Session.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    console.log("Total sessions found:", sessions.length);

    // Get all user IDs from sessions
    const userIds = [... new Set(sessions.map(s => s. userId))];
    console.log("Unique user IDs:", userIds);

    // Fetch all users at once
    const users = await User.find({ _id: { $in: userIds } }). lean();
    console.log("Users found:", users.length);

    // Create a map of users by ID for quick lookup
    const userMap = {};
    users.forEach(user => {
      const fullName = `${user.firstName || ""} ${user.lastName || ""}`. trim() || "Unknown";
      userMap[user._id. toString()] = {
        name: fullName,
        email: user.email || "Unknown",
        username: user.firstName || "Unknown",
      };
    });

    console.log("User map:", userMap);

    // Map sessions with user data
    const sessionsWithUsers = sessions.map(session => {
      const userId = session.userId. toString();
      const user = userMap[userId] || {
        name: "Unknown",
        email: "Unknown",
        username: "Unknown",
      };

      console.log(`Session ${session._id} -> User ${userId}:`, user);

      return {
        _id: session._id. toString(),
        userId: session.userId,
        startTime: session.loginTime,
        endTime: session.logoutTime,
        deviceInfo: session.deviceType || "Unknown",
        status: session.status,
        createdAt: session. createdAt,
        user,
      };
    });

    const total = await Session.countDocuments();

    res.json({
      success: true,
      data: sessionsWithUsers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res. status(500).json({
      success: false,
      message: "Failed to fetch sessions",
      error: error.message,
    });
  }
});

// Get session statistics
router.get("/stats/summary", adminAuthMiddleware, async (req, res) => {
  try {
    const totalSessions = await Session.countDocuments();
    const activeSessions = await Session.countDocuments({ logoutTime: null });
    const completedSessions = await Session.countDocuments({
      logoutTime: { $ne: null },
    });

    const sessions = await Session.find({}). lean();
    let totalHours = 0;
    sessions.forEach((s) => {
      if (s.logoutTime && s.loginTime) {
        const start = new Date(s.loginTime). getTime();
        const end = new Date(s.logoutTime).getTime();
        const durationMs = end - start;
        if (durationMs > 0) {
          totalHours += durationMs / (1000 * 60 * 60);
        }
      }
    });

    const uniqueUsers = await Session.distinct("userId");

    res.json({
      success: true,
      data: {
        totalSessions,
        activeSessions,
        completedSessions,
        totalHours: totalHours.toFixed(2),
        uniqueUsers: uniqueUsers.length,
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

// Get active sessions only
router.get("/active", adminAuthMiddleware, async (req, res) => {
  try {
    const activeSessions = await Session.find({ logoutTime: null })
      . sort({ createdAt: -1 })
      .lean();

    // Get all user IDs
    const userIds = [...new Set(activeSessions.map(s => s.userId))];

    // Fetch all users
    const users = await User.find({ _id: { $in: userIds } }).lean();

    // Create user map
    const userMap = {};
    users.forEach(user => {
      const fullName = `${user.firstName || ""} ${user. lastName || ""}`.trim() || "Unknown";
      userMap[user._id.toString()] = {
        name: fullName,
        email: user.email || "Unknown",
        username: user.firstName || "Unknown",
      };
    });

    const sessionsWithUsers = activeSessions. map(session => ({
      _id: session._id.toString(),
      userId: session.userId,
      startTime: session.loginTime,
      endTime: session.logoutTime,
      deviceInfo: session.deviceType || "Unknown",
      status: session.status,
      createdAt: session.createdAt,
      user: userMap[session.userId. toString()] || {
        name: "Unknown",
        email: "Unknown",
        username: "Unknown",
      },
    }));

    res.json({
      success: true,
      data: sessionsWithUsers,
      total: sessionsWithUsers.length,
    });
  } catch (error) {
    console.error("Error fetching active sessions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active sessions",
      error: error. message,
    });
  }
});

// Get completed sessions only
router.get("/completed", adminAuthMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const completedSessions = await Session.find({
      logoutTime: { $ne: null },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      . limit(parseInt(limit))
      .lean();

    // Get all user IDs
    const userIds = [...new Set(completedSessions.map(s => s.userId))];

    // Fetch all users
    const users = await User.find({ _id: { $in: userIds } }).lean();

    // Create user map
    const userMap = {};
    users.forEach(user => {
      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown";
      userMap[user._id.toString()] = {
        name: fullName,
        email: user. email || "Unknown",
        username: user.firstName || "Unknown",
      };
    });

    const sessionsWithUsers = completedSessions.map(session => ({
      _id: session._id.toString(),
      userId: session.userId,
      startTime: session.loginTime,
      endTime: session.logoutTime,
      deviceInfo: session.deviceType || "Unknown",
      status: session.status,
      createdAt: session.createdAt,
      user: userMap[session.userId.toString()] || {
        name: "Unknown",
        email: "Unknown",
        username: "Unknown",
      },
    }));

    const total = await Session.countDocuments({ logoutTime: { $ne: null } });

    res.json({
      success: true,
      data: sessionsWithUsers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching completed sessions:", error);
    res. status(500).json({
      success: false,
      message: "Failed to fetch completed sessions",
      error: error.message,
    });
  }
});

// Get sessions by date range
router.get("/date-range", adminAuthMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res. status(400).json({
        success: false,
        message: "startDate and endDate are required",
      });
    }

    const sessions = await Session.find({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    })
      .sort({ createdAt: -1 })
      .lean();

    // Get all user IDs
    const userIds = [...new Set(sessions.map(s => s.userId))];

    // Fetch all users
    const users = await User.find({ _id: { $in: userIds } }).lean();

    // Create user map
    const userMap = {};
    users.forEach(user => {
      const fullName = `${user. firstName || ""} ${user.lastName || ""}`.trim() || "Unknown";
      userMap[user._id.toString()] = {
        name: fullName,
        email: user.email || "Unknown",
        username: user. firstName || "Unknown",
      };
    });

    const sessionsWithUsers = sessions.map(session => ({
      _id: session._id.toString(),
      userId: session.userId,
      startTime: session.loginTime,
      endTime: session.logoutTime,
      deviceInfo: session.deviceType || "Unknown",
      status: session.status,
      createdAt: session.createdAt,
      user: userMap[session.userId.toString()] || {
        name: "Unknown",
        email: "Unknown",
        username: "Unknown",
      },
    }));

    res.json({
      success: true,
      data: sessionsWithUsers,
      total: sessionsWithUsers.length,
    });
  } catch (error) {
    console. error("Error fetching sessions by date:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sessions",
      error: error.message,
    });
  }
});

export default router;