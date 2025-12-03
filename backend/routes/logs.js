import express from "express";
import {
  getLoginLogs,
  getSecurityLogs,
  getSuspiciousActivities,
  getLoginStats,
  getFailedLoginAttempts,
} from "../controllers/logsController.js";

const router = express.Router();

// All log endpoints are public (no authentication required)
router.get("/login", getLoginLogs);
router.get("/security", getSecurityLogs);
router.get("/suspicious", getSuspiciousActivities);
router.get("/stats", getLoginStats);
router.get("/failed-attempts", getFailedLoginAttempts);

export default router;
