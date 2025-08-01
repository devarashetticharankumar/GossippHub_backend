// const mongoose = require("mongoose");

// const messageSchema = new mongoose.Schema({
//   sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   receiver: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//   },
//   content: { type: String, required: true },
//   media: { type: String }, // S3 URL for media
//   createdAt: { type: Date, default: Date.now },
//   isRead: { type: Boolean, default: false },
//   status: { type: String, enum: ["pending", "accepted"], default: "pending" },
//   deletedFor: {
//     sender: { type: Boolean, default: false },
//     receiver: { type: Boolean, default: false },
//   },
// });

// // Indexes for performance
// messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

// module.exports = mongoose.model("Message", messageSchema);

const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    required: true,
  }, // Array for group/broadcast
  content: { type: String },
  media: { type: [String] }, // Multiple media URLs (S3)
  createdAt: { type: Date, default: Date.now },
  isRead: { type: Map, of: Boolean, default: {} }, // Per-user read status
  status: { type: String, enum: ["pending", "accepted"], default: "pending" },
  deletedFor: { type: Map, of: Boolean, default: {} }, // Per-user deletion
  edited: { type: Boolean, default: false },
  editedContent: { type: String },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  starredBy: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    default: [],
  },
  forwardCount: { type: Number, default: 0 },
  expireAt: { type: Date }, // For disappearing messages
  encryptionKey: { type: String }, // Placeholder for end-to-end encryption
  type: {
    type: String,
    enum: ["one-on-one", "group", "broadcast"],
    default: "one-on-one",
  },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" }, // For group chats
  isDeleted: { type: Boolean, default: false }, // For delete for everyone
  deleteTimeLimit: { type: Number, default: 86400 }, // 24 hours in seconds
});

// Indexes for performance
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ groupId: 1, createdAt: -1 });
messageSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for disappearing messages

module.exports = mongoose.model("Message", messageSchema);
