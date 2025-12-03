import mongoose from "mongoose";

const localSchema = new mongoose.Schema(
  {
    serverId: {
      type: String,
      required: true,
      unique: true,
    },
    serverName: String,
    serverLocation: String,
    databaseVersion: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    lastHealthCheck: Date,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.model("local", localSchema);
