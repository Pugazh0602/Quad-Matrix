import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    loginTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    logoutTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    ipAddress: {
      type: String,
      default: "unknown",
    },
    userAgent: {
      type: String,
      default: "",
    },
    deviceType: {
      type: String,
      default: "web",
    },
    os: {
      type: String,
      default: "unknown",
    },
    browser: {
      type: String,
      default: "web",
    },
    location: {
      type: String,
      default: "Unknown",
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying active sessions by userId
sessionSchema.index({ userId: 1, status: 1 });
// Index for querying sessions by loginTime
sessionSchema.index({ loginTime: -1 });

const Session = mongoose.model("Session", sessionSchema);

export default Session;
