const mongoose = require("mongoose");

const storySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true }, // URL or base64 for image/text
  type: { type: String, enum: ["image", "text"], required: true },
  views: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users who viewed
  reacts: { type: Number, default: 0 }, // Total reactions (e.g., likes)
  createdAt: { type: Date, default: Date.now },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
  }, // 24-hour expiration
  status: { type: String, enum: ["active", "expired"], default: "active" },
});

module.exports = mongoose.model("Story", storySchema);
