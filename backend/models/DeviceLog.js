import mongoose from "mongoose";

const deviceLogSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    deviceType: String,
    operatingSystem: String,
    browser: String,
    browserVersion: String,
    ipAddress: {
      type: String,
      index: true,
    },
    macAddress: String,
    location: String,
    geolocation: {
      latitude: Number,
      longitude: Number,
    },
    firstSeen: {
      type: Date,
      default: Date.now,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    isKnownDevice: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    deviceName: String,
    trustLevel: {
      type: String,
      enum: ["trusted", "unknown", "suspicious", "blocked"],
      default: "unknown",
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("device_log", deviceLogSchema);
