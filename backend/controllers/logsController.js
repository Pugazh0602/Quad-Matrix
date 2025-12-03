import LoginLog from "../models/LoginLog.js";
import SecurityLog from "../models/SecurityLog.js";
import DeviceLog from "../models/DeviceLog.js";
import StartupLog from "../models/StartupLog.js";

/**
 * Get login logs with filtering and pagination
 */
export const getLoginLogs = async (req, res) => {
  try {
    const { userId, userEmail, startDate, endDate, limit = 50, skip = 0 } = req.query;

    const filter = {};
    if (userId) filter.userId = userId;
    if (userEmail) filter.userEmail = userEmail.toLowerCase();

    if (startDate || endDate) {
      filter.loginTime = {};
      if (startDate) filter.loginTime.$gte = new Date(startDate);
      if (endDate) filter.loginTime.$lte = new Date(endDate);
    }

    const logs = await LoginLog.find(filter)
      .sort({ loginTime: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await LoginLog.countDocuments(filter);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
      },
    });
  } catch (error) {
    console.error("Get login logs error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching login logs",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get security logs with filtering
 */
export const getSecurityLogs = async (req, res) => {
  try {
    const { eventType, severity, userId, startDate, endDate, limit = 50, skip = 0 } = req.query;

    const filter = {};
    if (eventType) filter.eventType = eventType;
    if (severity) filter.severity = severity;
    if (userId) filter.userId = userId;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const logs = await SecurityLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await SecurityLog.countDocuments(filter);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
      },
    });
  } catch (error) {
    console.error("Get security logs error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching security logs",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get suspicious activities
 */
export const getSuspiciousActivities = async (req, res) => {
  try {
    const { userId, limit = 50, skip = 0 } = req.query;

    const filter = { suspiciousActivity: true };
    if (userId) filter.userId = userId;

    const activities = await LoginLog.find(filter)
      .sort({ loginTime: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await LoginLog.countDocuments(filter);

    res.json({
      success: true,
      data: activities,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
      },
    });
  } catch (error) {
    console.error("Get suspicious activities error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching suspicious activities",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get login statistics
 */
export const getLoginStats = async (req, res) => {
  try {
    const { userId, days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const filter = { loginTime: { $gte: startDate } };
    if (userId) filter.userId = userId;

    const totalLogins = await LoginLog.countDocuments(filter);
    const successfulLogins = await LoginLog.countDocuments({
      ...filter,
      loginResult: "success",
    });
    const failedLogins = await LoginLog.countDocuments({
      ...filter,
      loginResult: "failed",
    });
    const suspiciousLogins = await LoginLog.countDocuments({
      ...filter,
      suspiciousActivity: true,
    });

    // Average session duration
    const logins = await LoginLog.find({
      ...filter,
      sessionDuration: { $ne: null },
    });

    res.json({
      success: true,
      data: {
        totalLogins,
        successfulLogins,
        failedLogins,
        suspiciousLogins,
        successRate: totalLogins > 0 ? ((successfulLogins / totalLogins) * 100).toFixed(2) : 0,
        averageSessionCount: logins.length,
      },
      period: {
        days: parseInt(days),
        from: startDate,
        to: new Date(),
      },
    });
  } catch (error) {
    console.error("Get login stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching login statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get failed login attempts
 */
export const getFailedLoginAttempts = async (req, res) => {
  try {
    const { userEmail, ipAddress, limit = 50 } = req.query;

    const filter = { loginResult: "failed" };
    if (userEmail) filter.userEmail = userEmail.toLowerCase();
    if (ipAddress) filter.ipAddress = ipAddress;

    const attempts = await LoginLog.find(filter)
      .sort({ loginTime: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: attempts,
    });
  } catch (error) {
    console.error("Get failed login attempts error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching failed login attempts",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
