// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema({
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   username: { type: String, unique: true, sparse: true },
//   bio: { type: String, default: "" }, // Added for user bio
//   profilePicture: { type: String, default: "" }, // URL to profile picture
//   isAdmin: { type: Boolean, default: false },
//   funMeter: { type: Number, default: 0 }, // For gamification
//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model("User", userSchema);
////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
////////////////////////////////////////////

// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema({
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   username: { type: String, unique: true, sparse: true },
//   bio: { type: String, default: "" },
//   profilePicture: { type: String, default: "" },
//   isAdmin: { type: Boolean, default: false },
//   funMeter: { type: Number, default: 0 },
//   createdAt: { type: Date, default: Date.now },
//   // Streak fields
//   streak: { type: Number, default: 0 },
//   lastLogin: { type: String, default: null }, // Store as YYYY-MM-DD
//   streakRewards: { type: [String], default: [] }, // Array of reward names
//   followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Array of user IDs who follow this user
//   following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Array of user IDs this user follows
// });

// module.exports = mongoose.model("User", userSchema);

//// Today's update 13-05-2025
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, unique: true, sparse: true },
  bio: { type: String, default: "" },
  profilePicture: { type: String, default: "" },
  isAdmin: { type: Boolean, default: false },
  funMeter: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  // Reaction streak fields
  reactionStreak: { type: Number, default: 0 },
  lastReaction: { type: String, default: null }, // Store as YYYY-MM-DD
  streakRewards: { type: [String], default: [] }, // Array of reward names
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

module.exports = mongoose.model("User", userSchema);
