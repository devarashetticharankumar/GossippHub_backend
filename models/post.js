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
///23-08-2025
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
  hashtags: [{ type: String, index: true }], // Add hashtags array with index for faster querying
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

module.exports = mongoose.models.Post || mongoose.model("Post", postSchema);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////#hastag implemented code

// const mongoose = require("mongoose");

// const postSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   description: { type: String, required: true },
//   slug: { type: String, unique: true },
//   author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   isAnonymous: { type: Boolean, default: false },
//   likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//   loves: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//   laughs: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//   sads: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//   comments: [
//     {
//       text: String,
//       author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//       createdAt: { type: Date, default: Date.now },
//       likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//     },
//   ],
//   category: { type: String, default: "General" },
//   media: { type: String, default: null },
//   isFlagged: { type: Boolean, default: false },
//   createdAt: { type: Date, default: Date.now },
//   hashtags: [{ type: String }], // Added hashtags field as an array of strings
// });

// // Add index for hashtag field to improve query performance
// postSchema.index({ hashtags: 1 });

// module.exports = mongoose.model("Post", postSchema);
