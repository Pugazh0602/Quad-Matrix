import jwt from "jsonwebtoken";
import crypto from "crypto";

/**
 * Generate a unique session ID
 */
export const generateSessionId = () => {
  return crypto.randomUUID();
};

/**
 * Generate a unique token ID
 */
export const generateTokenId = () => {
  return `token_${crypto.randomBytes(16).toString("hex")}`;
};

/**
 * Generate a unique log ID
 */
export const generateLogId = (prefix = "log") => {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
};

/**
 * Create JWT token
 */
export const createJWT = (payload, secret = process.env.JWT_SECRET || "local-secret-key", expiresInOverride) => {
  const expiresIn = expiresInOverride || process.env.JWT_EXPIRES_IN || "30d"; // make expiry configurable; default to 30 days
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Generate a secure random refresh token value
 */
export const generateRefreshTokenValue = () => {
  return crypto.randomBytes(48).toString("hex");
};

/**
 * Verify JWT token
 */
export const verifyJWT = (token, secret = process.env.JWT_SECRET || "local-secret-key") => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

/**
 * Hash a string (simple, for local use)
 */
export const hashString = (str) => {
  return crypto.createHash("sha256").update(str).digest("hex");
};

/**
 * Calculate session duration
 */
export const calculateSessionDuration = (loginTime, logoutTime) => {
  if (!logoutTime) return null;
  
  const login = new Date(loginTime);
  const logout = new Date(logoutTime);
  const diffMs = logout - login;
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  return `${hours}h ${minutes}m ${seconds}s`;
};

/**
 * Parse User Agent to detect device, OS, and browser
 */
export const parseUserAgent = (userAgent) => {
  const ua = userAgent.toLowerCase();
  
  // Device type detection
  let deviceType = "unknown";
  if (/mobile|android|iphone|ipod|windows phone/.test(ua)) {
    deviceType = "mobile";
  } else if (/ipad|android|tablet/.test(ua)) {
    deviceType = "tablet";
  } else if (/windows|macintosh|linux/.test(ua)) {
    deviceType = "desktop";
  }
  
  // OS detection
  let operatingSystem = "Unknown";
  if (/windows nt 10\.0|windows 10/.test(ua)) {
    operatingSystem = "Windows 10";
  } else if (/windows nt 11\.0|windows 11/.test(ua)) {
    operatingSystem = "Windows 11";
  } else if (/windows nt 6\.1|windows 7/.test(ua)) {
    operatingSystem = "Windows 7";
  } else if (/mac os x/.test(ua)) {
    operatingSystem = "macOS";
  } else if (/linux/.test(ua)) {
    operatingSystem = "Linux";
  } else if (/android/.test(ua)) {
    operatingSystem = "Android";
  } else if (/iphone|ipod|ipad|ios/.test(ua)) {
    operatingSystem = "iOS";
  }
  
  // Browser detection
  let browser = "Unknown";
  if (/firefox/.test(ua)) {
    browser = "Firefox";
  } else if (/chrome|chromium/.test(ua) && !/edg/.test(ua)) {
    browser = "Chrome";
  } else if (/safari/.test(ua) && !/chrome/.test(ua)) {
    browser = "Safari";
  } else if (/edg/.test(ua)) {
    browser = "Edge";
  } else if (/trident|msie/.test(ua)) {
    browser = "Internet Explorer";
  } else if (/opera|opr/.test(ua)) {
    browser = "Opera";
  }
  
  return {
    deviceType,
    operatingSystem,
    browser,
  };
};

/**
 * Extract IP address from request
 */
export const getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket?.remoteAddress ||
    "127.0.0.1"
  );
};

/**
 * Detect suspicious activity
 */
export const detectSuspiciousActivity = async (loginData, previousLogins, deviceLog) => {
  const suspiciousReasons = [];
  
  // Check for multiple failed logins
  if (previousLogins && previousLogins.length > 0) {
    const recentFailedLogins = previousLogins.filter(
      log => log.loginResult === "failed" && 
      new Date(log.loginTime) > new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
    );
    if (recentFailedLogins.length >= 3) {
      suspiciousReasons.push("multiple_failed_logins");
    }
  }
  
  // Check for unknown device
  if (deviceLog && !deviceLog.isKnownDevice && deviceLog.failedLoginAttempts > 0) {
    suspiciousReasons.push("unknown_device_with_failures");
  }
  
  // Check for new IP address
  if (previousLogins && previousLogins.length > 0) {
    const uniqueIps = new Set(previousLogins.map(log => log.ipAddress));
    if (!uniqueIps.has(loginData.ipAddress)) {
      suspiciousReasons.push("new_ip_address");
    }
  }
  
  return {
    isSuspicious: suspiciousReasons.length > 0,
    reasons: suspiciousReasons,
  };
};
