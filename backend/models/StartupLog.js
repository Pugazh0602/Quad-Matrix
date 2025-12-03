import mongoose from "mongoose";

const startupLogSchema = new mongoose.Schema(
  {
    startupId: {
      type: String,
      required: true,
      unique: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    serverId: String,
    systemUptime: String,
    databaseStatus: {
      type: String,
      enum: ["healthy", "degraded", "down"],
      default: "healthy",
    },
    collectionsInitialized: [String],
    startupDuration: String,
    errors: [String],
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.model("startup_log", startupLogSchema);
