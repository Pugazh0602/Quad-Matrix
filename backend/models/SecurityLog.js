import mongoose from "mongoose";

const securityLogSchema = new mongoose.Schema(
  {
    securityEventId: {
      type: String,
      required: true,
      unique: true,
    },
    eventType: {
      type: String,
      enum: [
        "multiple_failed_logins",
        "unknown_device",
        "new_ip_address",
        "suspicious_location",
        "unauthorized_access",
        "token_tampering",
        "brute_force_attempt",
        "account_lockout",
        "password_change",
        "permission_change",
        "data_access",
        "other",
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    userEmail: String,
    ipAddress: String,
    description: {
      type: String,
      required: true,
    },
    details: mongoose.Schema.Types.Mixed,
    actionTaken: String,
    isResolved: {
      type: Boolean,
      default: false,
    },
    resolvedAt: Date,
    resolvedBy: String,
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model("security_log", securityLogSchema);
