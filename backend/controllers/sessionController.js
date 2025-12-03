import Session from "../models/Session.js";
import User from "../models/User.js";

export const getSessions = async (req, res) => {
  try {
    const { userId } = req.query;

    const query = userId ? { userId } : {};
    const sessions = await Session.find(query)
      .sort({ loginTime: -1 });

    res.json(sessions);
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({ message: "Error fetching sessions" });
  }
};

export const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;

    const session = await Session.findOne({ sessionId: id });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json(session);
  } catch (error) {
    console.error("Get session error:", error);
    res.status(500).json({ message: "Error fetching session" });
  }
};

export const createSession = async (req, res) => {
  try {
    const { sessionId, userId, ipAddress, userAgent, deviceType, os, browser, location, status } = req.body;

    const session = new Session({
      sessionId,
      userId,
      ipAddress,
      userAgent,
      deviceType,
      os,
      browser,
      location,
      status,
      loginTime: new Date(),
    });

    await session.save();

    res.status(201).json({
      message: "Session created",
      session,
    });
  } catch (error) {
    console.error("Create session error:", error);
    res.status(500).json({ message: "Error creating session" });
  }
};

export const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const session = await Session.findOneAndUpdate({ sessionId: id }, updates, { new: true });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json({
      message: "Session updated",
      session,
    });
  } catch (error) {
    console.error("Update session error:", error);
    res.status(500).json({ message: "Error updating session" });
  }
};

export const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;

    const session = await Session.findOneAndDelete({ sessionId: id });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json({ message: "Session deleted" });
  } catch (error) {
    console.error("Delete session error:", error);
    res.status(500).json({ message: "Error deleting session" });
  }
};

export const getSessionStats = async (req, res) => {
  try {
    const totalSessions = await Session.countDocuments();
    const activeSessions = await Session.countDocuments({ status: "active" });
    const inactiveSessions = await Session.countDocuments({ status: "inactive" });

    const sessionsByDevice = await Session.aggregate([
      {
        $group: {
          _id: "$deviceType",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      totalSessions,
      activeSessions,
      inactiveSessions,
      sessionsByDevice,
    });
  } catch (error) {
    console.error("Get session stats error:", error);
    res.status(500).json({ message: "Error fetching session stats" });
  }
};
