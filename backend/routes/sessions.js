import express from "express";
import Session from '../models/Session.js'; // Adjust path as needed
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

// Updated route to handle 'work done' submission
router.put('/:sessionId/work', async (req, res) => {
  try {
    // Get the custom string sessionId from the URL parameters
    const { sessionId } = req.params;
    const { workDone } = req.body;

    // Use findOneAndUpdate to search for the specific 'sessionId' field in the DB
    const updatedSession = await Session.findOneAndUpdate(
      { sessionId: sessionId }, // Query: Find the document where the 'sessionId' field matches the parameter
      { workDone: workDone },   // Update: Set the 'workDone' field with the incoming data
      { new: true, runValidators: true } // Options: Return the updated document and run schema validation
    );

    if (!updatedSession) {
      // If no session is found with that specific string ID, return 404
      return res.status(404).json({ message: 'Session not found with that sessionId' });
    }

    res.status(200).json(updatedSession);
  } catch (error) {
    // Catch any database or server errors
    console.error("Error updating work done:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
