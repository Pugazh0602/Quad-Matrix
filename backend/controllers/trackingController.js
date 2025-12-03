import StartupLog from "../models/StartupLog.js";
import DeviceLog from "../models/DeviceLog.js";
import SecurityLog from "../models/SecurityLog.js";
import { generateLogId } from "../utils/security.js";

/**
 * Track system startup
 */
export const trackStartup = async (req, res) => {
  try {
    const { serverId, systemUptime, databaseStatus, collectionsInitialized, startupDuration } = req.body;

    const startupLog = await StartupLog.create({
      startupId: generateLogId("startup"),
      serverId: serverId || "local_server",
      systemUptime,
      databaseStatus: databaseStatus || "healthy",
      collectionsInitialized: collectionsInitialized || [
        "admin",
        "config",
        "local",
        "startup_log",
        "login_log",
        "device_log",
        "security_log",
      ],
      startupDuration,
    });

    res.status(201).json({
      success: true,
      message: "Startup logged successfully",
      data: startupLog,
    });
  } catch (error) {
    console.error("Startup tracking error:", error);
    res.status(500).json({
      success: false,
      message: "Error tracking startup",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Track device information
 */
export const trackDevice = async (req, res) => {
  try {
    const { userId, userEmail, deviceType, operatingSystem, browser, ipAddress, macAddress, location } = req.body;

    if (!userId || !userEmail || !ipAddress) {
      return res.status(400).json({
        success: false,
        message: "userId, userEmail, and ipAddress are required",
      });
    }

    // Check if device already exists
    let deviceLog = await DeviceLog.findOne({
      userId,
      ipAddress,
    });

    if (deviceLog) {
      // Update existing device
      deviceLog.lastSeen = new Date();
      deviceLog.operatingSystem = operatingSystem || deviceLog.operatingSystem;
      deviceLog.browser = browser || deviceLog.browser;
      deviceLog.location = location || deviceLog.location;
      await deviceLog.save();

      return res.json({
        success: true,
        message: "Device updated",
        isNew: false,
        data: deviceLog,
      });
    }

    // Create new device
    const newDevice = await DeviceLog.create({
      deviceId: generateLogId("dev"),
      userId,
      userEmail,
      deviceType,
      operatingSystem,
      browser,
      ipAddress,
      macAddress,
      location,
      isKnownDevice: false,
      trustLevel: "unknown",
    });

    // Log security event for new device
    await SecurityLog.create({
      securityEventId: generateLogId("sec"),
      eventType: "unknown_device",
      severity: "low",
      userId,
      userEmail,
      ipAddress,
      description: `New device detected for user ${userEmail}`,
      details: {
        deviceType,
        operatingSystem,
        browser,
        macAddress,
      },
    });

    res.status(201).json({
      success: true,
      message: "Device tracked successfully",
      isNew: true,
      data: newDevice,
    });
  } catch (error) {
    console.error("Device tracking error:", error);
    res.status(500).json({
      success: false,
      message: "Error tracking device",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Mark device as trusted/known
 */
export const verifyDevice = async (req, res) => {
  try {
    const { deviceId, trustLevel = "trusted" } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: "Device ID is required",
      });
    }

    const device = await DeviceLog.findByIdAndUpdate(
      deviceId,
      {
        isVerified: true,
        isKnownDevice: true,
        trustLevel: trustLevel,
      },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    res.json({
      success: true,
      message: "Device verified",
      data: device,
    });
  } catch (error) {
    console.error("Device verification error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying device",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get all devices for a user
 */
export const getUserDevices = async (req, res) => {
  try {
    const { userId } = req.params;

    const devices = await DeviceLog.find({ userId }).sort({ lastSeen: -1 });

    res.json({
      success: true,
      data: devices,
    });
  } catch (error) {
    console.error("Get user devices error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user devices",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
