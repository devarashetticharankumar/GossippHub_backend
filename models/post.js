// const mongoose = require("mongoose");

// const postSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   description: { type: String, required: true },
//   slug: { type: String, unique: true },
//   author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   isAnonymous: { type: Boolean, default: false },
//   likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//   downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//   comments: [
//     {
//       text: String,
//       author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//       createdAt: { type: Date, default: Date.now },
//     },
//   ],
//   category: { type: String, default: "General" },
//   media: { type: String, default: null }, // URL to uploaded file
//   isFlagged: { type: Boolean, default: false },
//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model("Post", postSchema);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///04-06-2025
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  slug: { type: String, unique: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  isAnonymous: { type: Boolean, default: false },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  loves: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  laughs: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  sads: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      text: String,
      author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      createdAt: { type: Date, default: Date.now },
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Add likes for comments
    },
  ],
  category: { type: String, default: "General" },
  media: { type: String, default: null },
  isFlagged: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Post", postSchema);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////#hastag implemented code and short videos

// const mongoose = require("mongoose");

// const postSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   description: { type: String, required: true },
//   slug: { type: String, unique: true },
//   author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   isAnonymous: { type: Boolean, default: false },
//   postType: {
//     type: String,
//     enum: ["Post", "Short"],
//     default: "Post",
//   },
//   likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//   loves: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//   laughs: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//   sads: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//   shares: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // For Shorts/Reels virality
//   views: { type: Number, default: 0 }, // Track views for short-form videos
//   comments: [
//     {
//       text: String,
//       author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//       createdAt: { type: Date, default: Date.now },
//       likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//     },
//   ],
//   category: { type: String, default: "General" },
//   media: {
//     url: { type: String, default: null },
//     type: { type: String, enum: ["image", "video"], default: null },
//   },
//   thumbnail: { type: String, default: null }, // Thumbnail for short-form videos
//   duration: {
//     type: Number,
//     default: null,
//     validate: {
//       validator: function (value) {
//         // Only validate duration if postType is "Short"
//         if (this.postType === "Short") {
//           return value !== null && value > 0 && value <= 90; // Max 90 seconds for Shorts/Reels
//         }
//         return true; // No validation for regular posts
//       },
//       message: "Short-form video duration must be between 1 and 90 seconds.",
//     },
//   },
//   hashtags: [{ type: String }], // For discoverability of Shorts/Reels
//   trendingScore: { type: Number, default: 0 }, // For ranking trending Shorts/Reels
//   isFlagged: { type: Boolean, default: false },
//   createdAt: { type: Date, default: Date.now },
// });

// // Index for efficient querying of trending Shorts/Reels
// postSchema.index({ postType: 1, trendingScore: -1, createdAt: -1 });

// module.exports = mongoose.model("Post", postSchema);
