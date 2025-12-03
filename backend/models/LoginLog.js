import mongoose from "mongoose";

const loginLogSchema = new mongoose.Schema(
  {
    id: {
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
      lowercase: true,
    },
    username: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      enum: ["super_admin", "admin", "security_officer", "user"],
      required: true,
    },
    accountStatus: {
      type: String,
      enum: ["active", "inactive", "locked", "suspended"],
      default: "active",
    },
    loginTime: {
      type: Date,
      required: true,
    },
    logoutTime: {
      type: Date,
      default: null,
    },
    sessionDuration: {
      type: String,
      default: null,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "unknown"],
      required: true,
    },
    operatingSystem: {
      type: String,
      required: true,
    },
    browser: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    loginResult: {
      type: String,
      enum: ["success", "failed"],
      required: true,
    },
    logoutResult: {
      type: String,
      default: null,
    },
    failedReason: {
      type: String,
      default: null,
    },
    twoFactorStatus: {
      type: String,
      enum: ["passed", "failed", "not_required"],
      default: "not_required",
    },
    tokenId: {
      type: String,
      required: true,
    },
    suspiciousActivity: {
      type: Boolean,
      default: false,
      index: true,
    },
    suspiciousReasons: [String],
    location: String,
    geolocation: {
      latitude: Number,
      longitude: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.model("login_log", loginLogSchema);
