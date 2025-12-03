import mongoose from "mongoose";

const configSchema = new mongoose.Schema(
  {
    configKey: {
      type: String,
      required: true,
      unique: true,
    },
    configValue: mongoose.Schema.Types.Mixed,
    description: String,
    lastModified: {
      type: Date,
      default: Date.now,
    },
    modifiedBy: String,
  },
  { timestamps: true }
);

export default mongoose.model("config", configSchema);
