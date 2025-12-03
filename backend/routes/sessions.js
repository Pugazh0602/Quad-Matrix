import express from "express";
import {
  getSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  getSessionStats,
} from "../controllers/sessionController.js";

const router = express.Router();

// All sessions endpoints are public (no authentication required)
router.post("/", createSession);
router.get("/stats", getSessionStats);
router.get("/", getSessions);
router.get("/:id", getSessionById);
router.put("/:id", updateSession);
router.delete("/:id", deleteSession);

export default router;
