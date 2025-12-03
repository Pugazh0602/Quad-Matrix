import Admin from "../models/Admin.js";
import User from "../models/User.js";
import LoginLog from "../models/LoginLog.js";
import DeviceLog from "../models/DeviceLog.js";
import SecurityLog from "../models/SecurityLog.js";
import {
  generateSessionId,
  generateTokenId,
  generateLogId,
  createJWT,
  parseUserAgent,
  getClientIp,
  detectSuspiciousActivity,
  generateRefreshTokenValue,
  verifyJWT,
} from "../utils/security.js";
import RefreshToken from "../models/RefreshToken.js";
import SessionModel from "../models/Session.js";
import { comparePassword, validateLoginCredentials } from "../utils/validation.js";

/**
 * Login endpoint - Authenticate user and create login log
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userAgent = req.headers["user-agent"] || "Unknown";
    const ipAddress = getClientIp(req);

    // Validate input
    const validation = validateLoginCredentials(email, password);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0],
        loginResult: "failed",
      });
    }

    // Find user: first try Admins, then regular Users
    let user = await Admin.findOne({ email: email.toLowerCase() });
    let userSource = "admin";
    if (!user) {
      user = await User.findOne({ email: email.toLowerCase() });
      userSource = user ? "user" : userSource;
    }

    if (!user) {
      const logId = generateLogId("login");
      await LoginLog.create({
        id: logId,
        userId: "unknown",
        userEmail: email.toLowerCase(),
        username: "unknown",
        userRole: "unknown",
        accountStatus: "unknown",
        loginTime: new Date(),
        sessionId: generateSessionId(),
        deviceType: parseUserAgent(userAgent).deviceType,
        operatingSystem: parseUserAgent(userAgent).operatingSystem,
        browser: parseUserAgent(userAgent).browser,
        ipAddress,
        loginResult: "failed",
        failedReason: "User not found",
        twoFactorStatus: "not_required",
        tokenId: generateTokenId(),
        suspiciousActivity: true,
        suspiciousReasons: ["unknown_user"],
      });

      // Log security event
      await SecurityLog.create({
        securityEventId: generateLogId("sec"),
        eventType: "unauthorized_access",
        severity: "medium",
        userEmail: email.toLowerCase(),
        ipAddress,
        description: `Login attempt with non-existent email: ${email}`,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        loginResult: "failed",
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      const logId = generateLogId("login");
      const sessionId = generateSessionId();
      const tokenId = generateTokenId();

      // Get previous failed logins
      const previousLogins = await LoginLog.find({
        userEmail: user.email,
        loginResult: "failed",
      })
        .sort({ loginTime: -1 })
        .limit(10);

      // Detect suspicious activity
      const { isSuspicious, reasons: suspiciousReasons } = await detectSuspiciousActivity(
        { ipAddress },
        previousLogins
      );

      const loginData = {
        id: logId,
        userId: user._id.toString(),
        userEmail: user.email,
        username: user.username || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email.split("@")[0],
        userRole: user.role || (userSource === "admin" ? "admin" : "user"),
        accountStatus: user.isActive ? "active" : "inactive",
        loginTime: new Date(),
        sessionId,
        deviceType: parseUserAgent(userAgent).deviceType,
        operatingSystem: parseUserAgent(userAgent).operatingSystem,
        browser: parseUserAgent(userAgent).browser,
        ipAddress,
        loginResult: "failed",
        failedReason: "Invalid password",
        twoFactorStatus: "not_required",
        tokenId,
        suspiciousActivity: isSuspicious || previousLogins.length >= 3,
        suspiciousReasons,
      };

      await LoginLog.create(loginData);

      // Log security event if multiple failures
      if (previousLogins.length >= 2) {
        await SecurityLog.create({
          securityEventId: generateLogId("sec"),
          eventType: "multiple_failed_logins",
          severity: previousLogins.length >= 5 ? "high" : "medium",
          userId: user._id.toString(),
          userEmail: user.email,
          ipAddress,
          description: `Multiple failed login attempts for user ${user.email}. Count: ${previousLogins.length + 1}`,
          details: {
            failureCount: previousLogins.length + 1,
            recentAttempts: previousLogins.map(log => ({
              time: log.loginTime,
              ip: log.ipAddress,
            })),
          },
        });
      }

      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        loginResult: "failed",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      const logId = generateLogId("login");
      await LoginLog.create({
        id: logId,
        userId: user._id.toString(),
        userEmail: user.email,
        username: user.username || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email.split("@")[0],
        userRole: user.role || (userSource === "admin" ? "admin" : "user"),
        accountStatus: "inactive",
        loginTime: new Date(),
        sessionId: generateSessionId(),
        deviceType: parseUserAgent(userAgent).deviceType,
        operatingSystem: parseUserAgent(userAgent).operatingSystem,
        browser: parseUserAgent(userAgent).browser,
        ipAddress,
        loginResult: "failed",
        failedReason: "Account is inactive",
        twoFactorStatus: "not_required",
        tokenId: generateTokenId(),
        suspiciousActivity: false,
      });

      return res.status(401).json({
        success: false,
        message: "Account is inactive",
        loginResult: "failed",
      });
    }

    // Generate session data
    let sessionId = generateSessionId();
    const tokenId = generateTokenId();
    const logId = generateLogId("login");
    const userAgentData = parseUserAgent(userAgent);

    // Check or create device log
    let deviceLog = await DeviceLog.findOne({
      userId: user._id.toString(),
      ipAddress,
    });

    let isNewDevice = false;
    let isNewIp = false;

    if (!deviceLog) {
      isNewDevice = true;
      isNewIp = true;
      deviceLog = await DeviceLog.create({
        deviceId: generateLogId("dev"),
        userId: user._id.toString(),
        userEmail: user.email,
        ...userAgentData,
        ipAddress,
        isKnownDevice: false,
        trustLevel: "unknown",
        failedLoginAttempts: 0,
      });
    } else {
      deviceLog.lastSeen = new Date();
      deviceLog.failedLoginAttempts = 0;
      await deviceLog.save();

      // Check for new IP
      const uniqueIps = await LoginLog.distinct("ipAddress", {
        userId: user._id.toString(),
      });
      isNewIp = !uniqueIps.includes(ipAddress);
    }

    // Get previous logins for suspicious activity detection
    const previousLogins = await LoginLog.find({
      userId: user._id.toString(),
      loginResult: "success",
    })
      .sort({ loginTime: -1 })
      .limit(10);

    // Detect suspicious activity
    const { isSuspicious, reasons: suspiciousReasons } = await detectSuspiciousActivity(
      { ipAddress },
      previousLogins,
      deviceLog
    );

    // Add specific reasons for this login
    if (isNewDevice) {
      suspiciousReasons.push("new_device");
    }
    if (isNewIp) {
      suspiciousReasons.push("new_ip_address");
    }

    // Create login log entry
    // If there's already an active login for this user from the same IP/device, reuse it
    let loginLogEntry = await LoginLog.findOne({
      userId: user._id.toString(),
      loginResult: "success",
      logoutTime: null,
      ipAddress,
      // optionally also match on browser/device
      browser: userAgentData.browser,
    });

    if (loginLogEntry) {
      // update last seen/loginTime if needed but keep the same sessionId
      loginLogEntry.lastSeen = new Date();
      await loginLogEntry.save();
      // reuse sessionId from existing entry
      sessionId = loginLogEntry.sessionId;
    } else {
      loginLogEntry = await LoginLog.create({
        id: logId,
        userId: user._id.toString(),
        userEmail: user.email,
        username: user.username || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email.split("@")[0],
        userRole: user.role || (userSource === "admin" ? "admin" : userSource),
        accountStatus: "active",
        loginTime: new Date(),
        sessionId,
        deviceType: userAgentData.deviceType,
        operatingSystem: userAgentData.operatingSystem,
        browser: userAgentData.browser,
        ipAddress,
        loginResult: "success",
        twoFactorStatus: "not_required",
        tokenId,
        suspiciousActivity: isSuspicious,
        suspiciousReasons,
        location: "Local Network",
      });
    }

    // Log security event if suspicious
    if (isSuspicious) {
      await SecurityLog.create({
        securityEventId: generateLogId("sec"),
        eventType:
          suspiciousReasons.includes("new_device") ||
          suspiciousReasons.includes("unknown_device_with_failures")
            ? "unknown_device"
            : "new_ip_address",
        severity: "medium",
        userId: user._id.toString(),
        userEmail: user.email,
        ipAddress,
        description: `Suspicious login activity detected: ${suspiciousReasons.join(", ")}`,
        details: {
          isNewDevice,
          isNewIp,
          deviceTrustLevel: deviceLog?.trustLevel,
          suspiciousReasons,
        },
      });
    }

    // Create short-lived access token (explicit short expiry helps security)
    const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
    // Create access token with explicit expiry
    const accessToken = createJWT(
      {
        userId: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role,
        sessionId,
        tokenId,
      },
      process.env.JWT_SECRET || "local-secret-key",
      accessTokenExpiry
    );

    // Persist refresh token server-side and set HTTP-only cookie
    const refreshTokenValue = generateRefreshTokenValue();
    const refreshDays = parseInt(process.env.REFRESH_TOKEN_DAYS || "30", 10);
    const refreshExpiry = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      token: refreshTokenValue,
      userId: user._id,
      expiresAt: refreshExpiry,
      ipAddress,
      userAgent,
      deviceInfo: userAgentData,
    });

    // Set HTTP-only refresh cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: refreshDays * 24 * 60 * 60 * 1000,
    };
    res.cookie("refreshToken", refreshTokenValue, cookieOptions);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create or update Session record (primary record for work session tracking)
    try {
      await SessionModel.create({
        sessionId,
        userId: user._id,
        loginTime: new Date(),
        logoutTime: null,
        ipAddress,
        userAgent,
        deviceType: userAgentData.deviceType,
        os: userAgentData.operatingSystem,
        browser: userAgentData.browser,
        location: "Local Network",
        status: "active",
      });
    } catch (e) {
      // If a session with same sessionId already exists, ignore the error
      // (we intentionally don't want this to break login flow)
    }

    const responsePayload = {
      success: true,
      message: "Login successful",
      token: accessToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role,
      },
      session: {
        sessionId,
        loginTime: new Date(),
      },
      suspiciousActivity: isSuspicious,
    };

    // For local development only: return refresh token in response body as a fallback
    if ((process.env.NODE_ENV || "development") !== "production") {
      responsePayload.refreshToken = refreshTokenValue;
    }

    res.json(responsePayload);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Logout endpoint - End session and calculate duration
 */
export const logout = async (req, res) => {
  try {
    const { sessionId, tokenId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
    }

    // Find the login log entry
    const loginLog = await LoginLog.findOne({ sessionId });
    if (!loginLog) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Calculate session duration and update Session record
    const logoutTime = new Date();
    try {
      const sessionDoc = await SessionModel.findOne({ sessionId });
      if (sessionDoc) {
        sessionDoc.logoutTime = logoutTime;
        sessionDoc.status = "inactive";
        await sessionDoc.save();
      }
    } catch (e) {
      console.warn("Failed to update Session record on logout:", e);
    }

    // Calculate session duration for LoginLog if it exists
    const sessionDuration = calculateSessionDuration(loginLog.loginTime, logoutTime);

    // Update login log
    loginLog.logoutTime = logoutTime;
    loginLog.logoutResult = "success";
    loginLog.sessionDuration = sessionDuration;
    await loginLog.save();

    // Revoke refresh token associated with this request (if any)
    try {
      const refreshTokenValue = req.cookies?.refreshToken;
      if (refreshTokenValue) {
        const stored = await RefreshToken.findOne({ token: refreshTokenValue });
        if (stored) {
          stored.revoked = true;
          await stored.save();
        }
      }
      // Clear cookie client-side
      res.clearCookie("refreshToken", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
    } catch (e) {
      console.warn("Failed to revoke refresh token:", e);
    }

    res.json({
      success: true,
      message: "Logout successful",
      session: {
        sessionId,
        loginTime: loginLog.loginTime,
        logoutTime,
        duration: sessionDuration,
      },
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Refresh endpoint - exchange refresh cookie for a new access token
 */
export const refresh = async (req, res) => {
  try {
    let refreshTokenValue = req.cookies?.refreshToken;
    // Fallback: allow client to send refresh token in header (dev fallback)
    if (!refreshTokenValue && req.headers["x-refresh-token"]) {
      refreshTokenValue = req.headers["x-refresh-token"];
    }

    if (!refreshTokenValue) {
      return res.status(401).json({ success: false, message: "Refresh token required" });
    }

    const stored = await RefreshToken.findOne({ token: refreshTokenValue });
    if (!stored || stored.revoked || new Date() > new Date(stored.expiresAt)) {
      return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
    }

    const user = await User.findById(stored.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    // issue new access token
    const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
    const newAccessToken = createJWT(
      {
        userId: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET || "local-secret-key",
      accessTokenExpiry
    );

    res.json({ success: true, token: newAccessToken, user: { id: user._id.toString(), email: user.email, username: user.username, role: user.role } });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Me endpoint - return current user either from access token or by using refresh cookie to obtain a new access token
 */
export const me = async (req, res) => {
  try {
    // Check Authorization header first
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token) {
      const payload = verifyJWT(token, process.env.JWT_SECRET || "local-secret-key");
      if (payload) {
        const user = await User.findById(payload.userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        return res.json({ success: true, user: { id: user._id.toString(), email: user.email, username: user.username, role: user.role }, token });
      }
    }

    // If no valid access token, try refresh cookie
    let refreshTokenValue = req.cookies?.refreshToken;
    if (!refreshTokenValue && req.headers["x-refresh-token"]) {
      refreshTokenValue = req.headers["x-refresh-token"];
    }

    if (!refreshTokenValue) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const stored = await RefreshToken.findOne({ token: refreshTokenValue });
    if (!stored || stored.revoked || new Date() > new Date(stored.expiresAt)) {
      return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
    }

    const user = await User.findById(stored.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // issue a fresh access token
    const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
    const newAccessToken = createJWT(
      {
        userId: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET || "local-secret-key",
      accessTokenExpiry
    );

    res.json({ success: true, user: { id: user._id.toString(), email: user.email, username: user.username, role: user.role }, token: newAccessToken });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Calculate session duration
 */
const calculateSessionDuration = (loginTime, logoutTime) => {
  const login = new Date(loginTime);
  const logout = new Date(logoutTime);
  const diffMs = logout - login;

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return `${hours}h ${minutes}m ${seconds}s`;
};
