import express from "express";
import Admin from "../models/Admin.js";
import { hashPassword, comparePassword } from "../utils/validation.js";
import { generateLogId } from "../utils/security.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRE = "24h";

// Admin Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Find admin by username
    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Check if account is locked
    if (admin. isLocked) {
      const lockExpiry = new Date(admin.updatedAt).getTime() + LOCK_TIME;
      if (Date.now() < lockExpiry) {
        const remainingTime = Math.ceil((lockExpiry - Date.now()) / 1000 / 60);
        return res.status(403).json({
          success: false,
          message: `Account is locked.  Try again in ${remainingTime} minutes`,
        });
      } else {
        // Unlock account
        admin.isLocked = false;
        admin.loginAttempts = 0;
        await admin.save();
      }
    }

    // Check if account is active
    if (!admin. isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive.  Contact system administrator",
      });
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, admin.password);

    if (!isPasswordValid) {
      admin.loginAttempts += 1;

      if (admin.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        admin.isLocked = true;
      }

      await admin.save();

      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
        attemptsRemaining: MAX_LOGIN_ATTEMPTS - admin. loginAttempts,
      });
    }

    // Reset login attempts on successful login
    admin.loginAttempts = 0;
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT Token
    const token = jwt.sign(
      {
        adminId: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    // Set cookie
    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
});

// Admin Logout
router.post("/logout", (req, res) => {
  res.clearCookie("adminToken");
  res.json({
    success: true,
    message: "Logout successful",
  });
});

// Verify Admin Token
router.get("/verify", async (req, res) => {
  try {
    const token = req.cookies.adminToken || req.headers.authorization?.split(" ")[1];

    if (! token) {
      return res. status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const admin = await Admin.findById(decoded.adminId);

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Admin not found or inactive",
      });
    }

    res.json({
      success: true,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Token verification failed",
      error: error.message,
    });
  }
});

// Get Admin Profile
router.get("/profile", async (req, res) => {
  try {
    const token = req.cookies.adminToken || req.headers.authorization?.split(" ")[1];

    if (! token) {
      return res. status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = await Admin.findById(decoded.adminId). select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.json({
      success: true,
      admin,
    });
  } catch (error) {
    res. status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
});

export default router;