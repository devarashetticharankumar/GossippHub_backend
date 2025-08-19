// const Post = require("../models/post");
// const Reaction = require("../models/Reaction");
// const { filterContent } = require("../utils/filters");
// const { generateSlug } = require("../utils/slugGenerator");

// exports.createPost = async (req, res, next) => {
//   const { title, description, isAnonymous, category } = req.body;
//   const file = req.file; // From multer
//   try {
//     if (!filterContent(description) || (title && !filterContent(title))) {
//       return res
//         .status(400)
//         .json({ message: "Inappropriate content detected" });
//     }

//     const slug = await generateSlug(title);
//     const post = new Post({
//       title,
//       description,
//       slug,
//       author: req.user,
//       isAnonymous,
//       category,
//       media: file ? `/uploads/${file.filename}` : null,
//     });
//     await post.save();

//     const populatedPost = await Post.findById(post._id).populate(
//       "author",
//       "email username"
//     );
//     res.json(populatedPost);
//   } catch (err) {
//     next(err);
//   }
// };

// exports.getPosts = async (req, res, next) => {
//   try {
//     const posts = await Post.find({ isFlagged: false })
//       .populate("author", "email username")
//       .sort({ createdAt: -1 });
//     res.json(posts);
//   } catch (err) {
//     next(err);
//   }
// };

// exports.addReaction = async (req, res, next) => {
//   const { postId } = req.params;
//   const { type } = req.body;

//   try {
//     // Validate reaction type
//     if (type !== "like" && type !== "downvote") {
//       return res
//         .status(400)
//         .json({ message: "Invalid reaction type. Use 'like' or 'downvote'." });
//     }

//     // Ensure user is authenticated
//     if (!req.user) {
//       return res
//         .status(401)
//         .json({ message: "User must be logged in to add a reaction" });
//     }

//     // Ensure req.user is a string (user ID from JWT)
//     const userId = typeof req.user === "object" ? req.user._id : req.user;
//     if (!userId) {
//       return res.status(400).json({ message: "User ID is required" });
//     }

//     // Find the post
//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     // Initialize likes and downvotes if undefined
//     post.likes = Array.isArray(post.likes) ? post.likes : [];
//     post.downvotes = Array.isArray(post.downvotes) ? post.downvotes : [];

//     // Convert userId to string for comparison (MongoDB ObjectId)
//     const userIdStr = userId.toString();

//     // Check if user has already reacted
//     const hasLiked = post.likes.some((id) => id && id.toString() === userIdStr);
//     const hasDownvoted = post.downvotes.some(
//       (id) => id && id.toString() === userIdStr
//     );

//     // Remove any existing reaction in the Reaction collection
//     await Reaction.deleteOne({ post: postId, user: userId });

//     // Handle the reaction
//     if (type === "like") {
//       if (hasLiked) {
//         // User already liked, remove the like (toggle off)
//         await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
//         post.likes = post.likes.filter((id) => id.toString() !== userIdStr);
//       } else {
//         // Add like, remove downvote if exists
//         await Post.updateOne(
//           { _id: postId },
//           {
//             $addToSet: { likes: userId },
//             $pull: { downvotes: userId },
//           }
//         );
//         // Update local post object for response
//         if (!hasLiked) post.likes.push(userId);
//         post.downvotes = post.downvotes.filter(
//           (id) => id && id.toString() !== userIdStr
//         );

//         // Record the reaction
//         const reaction = new Reaction({ post: postId, user: userId, type });
//         await reaction.save();
//       }
//     } else if (type === "downvote") {
//       if (hasDownvoted) {
//         // User already downvoted, remove the downvote (toggle off)
//         await Post.updateOne({ _id: postId }, { $pull: { downvotes: userId } });
//         post.downvotes = post.downvotes.filter(
//           (id) => id.toString() !== userIdStr
//         );
//       } else {
//         // Add downvote, remove like if exists
//         await Post.updateOne(
//           { _id: postId },
//           {
//             $addToSet: { downvotes: userId },
//             $pull: { likes: userId },
//           }
//         );
//         // Update local post object for response
//         if (!hasDownvoted) post.downvotes.push(userId);
//         post.likes = post.likes.filter(
//           (id) => id && id.toString() !== userIdStr
//         );

//         // Record the reaction
//         const reaction = new Reaction({ post: postId, user: userId, type });
//         await reaction.save();
//       }
//     }

//     // Return updated counts
//     res.json({ likes: post.likes, downvotes: post.downvotes });
//   } catch (err) {
//     console.error("Error in addReaction:", err);
//     next(err);
//   }
// };

// exports.addComment = async (req, res, next) => {
//   const { postId } = req.params;
//   const { text } = req.body;
//   try {
//     if (!filterContent(text)) {
//       return res
//         .status(400)
//         .json({ message: "Inappropriate comment detected" });
//     }

//     const post = await Post.findById(postId);
//     if (!post) return res.status(404).json({ message: "Post not found" });

//     post.comments.push({ text, author: req.user });
//     await post.save();

//     const updatedPost = await Post.findById(postId).populate(
//       "author",
//       "email username"
//     );
//     res.json(updatedPost);
//   } catch (err) {
//     next(err);
//   }
// };

// //Delete post by Author
// exports.deletePost = async (req, res, next) => {
//   const { postId } = req.params;
//   try {
//     // Find the post
//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     // Check if the authenticated user is the author
//     const userId = typeof req.user === "object" ? req.user._id : req.user;
//     if (post.author.toString() !== userId.toString()) {
//       return res
//         .status(403)
//         .json({ message: "Unauthorized to delete this post" });
//     }

//     // Delete associated reactions
//     await Reaction.deleteMany({ post: postId });

//     // Delete the post
//     await Post.findByIdAndDelete(postId);

//     res.json({ message: "Post deleted successfully" });
//   } catch (err) {
//     next(err);
//   }
// };

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

// const Post = require("../models/post");
// const Reaction = require("../models/Reaction");
// const { filterContent } = require("../utils/filters");
// const { generateSlug } = require("../utils/slugGenerator");
// const cloudinary = require("cloudinary").v2;
// const fs = require("fs");

// exports.createPost = async (req, res, next) => {
//   const { title, description, isAnonymous, category } = req.body;
//   const file = req.file; // From multer
//   try {
//     if (!filterContent(description) || (title && !filterContent(title))) {
//       return res
//         .status(400)
//         .json({ message: "Inappropriate content detected" });
//     }

//     const slug = await generateSlug(title);
//     let mediaUrl = null;

//     // Upload file to Cloudinary if it exists
//     if (file) {
//       const result = await cloudinary.uploader.upload(file.path, {
//         folder: "gossiphub/uploads", // Organize files in a folder in Cloudinary
//       });
//       mediaUrl = result.secure_url; // Store the Cloudinary URL

//       // Delete the local file after uploading to Cloudinary
//       fs.unlinkSync(file.path);
//     }

//     const post = new Post({
//       title,
//       description,
//       slug,
//       author: req.user,
//       isAnonymous,
//       category,
//       media: mediaUrl,
//     });
//     await post.save();

//     const populatedPost = await Post.findById(post._id).populate(
//       "author",
//       "email username"
//     );
//     res.json(populatedPost);
//   } catch (err) {
//     next(err);
//   }
// };

// exports.getPosts = async (req, res, next) => {
//   try {
//     const posts = await Post.find({ isFlagged: false })
//       .populate("author", "email username")
//       .sort({ createdAt: -1 });
//     res.json(posts);
//   } catch (err) {
//     next(err);
//   }
// };

// exports.addReaction = async (req, res, next) => {
//   const { postId } = req.params;
//   const { type } = req.body;

//   try {
//     if (type !== "like" && type !== "downvote") {
//       return res
//         .status(400)
//         .json({ message: "Invalid reaction type. Use 'like' or 'downvote'." });
//     }

//     if (!req.user) {
//       return res
//         .status(401)
//         .json({ message: "User must be logged in to add a reaction" });
//     }

//     const userId = typeof req.user === "object" ? req.user._id : req.user;
//     if (!userId) {
//       return res.status(400).json({ message: "User ID is required" });
//     }

//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     post.likes = Array.isArray(post.likes) ? post.likes : [];
//     post.downvotes = Array.isArray(post.downvotes) ? post.downvotes : [];

//     const userIdStr = userId.toString();

//     const hasLiked = post.likes.some((id) => id && id.toString() === userIdStr);
//     const hasDownvoted = post.downvotes.some(
//       (id) => id && id.toString() === userIdStr
//     );

//     await Reaction.deleteOne({ post: postId, user: userId });

//     if (type === "like") {
//       if (hasLiked) {
//         await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
//         post.likes = post.likes.filter((id) => id.toString() !== userIdStr);
//       } else {
//         await Post.updateOne(
//           { _id: postId },
//           {
//             $addToSet: { likes: userId },
//             $pull: { downvotes: userId },
//           }
//         );
//         if (!hasLiked) post.likes.push(userId);
//         post.downvotes = post.downvotes.filter(
//           (id) => id && id.toString() !== userIdStr
//         );

//         const reaction = new Reaction({ post: postId, user: userId, type });
//         await reaction.save();
//       }
//     } else if (type === "downvote") {
//       if (hasDownvoted) {
//         await Post.updateOne({ _id: postId }, { $pull: { downvotes: userId } });
//         post.downvotes = post.downvotes.filter(
//           (id) => id.toString() !== userIdStr
//         );
//       } else {
//         await Post.updateOne(
//           { _id: postId },
//           {
//             $addToSet: { downvotes: userId },
//             $pull: { likes: userId },
//           }
//         );
//         if (!hasDownvoted) post.downvotes.push(userId);
//         post.likes = post.likes.filter(
//           (id) => id && id.toString() !== userIdStr
//         );

//         const reaction = new Reaction({ post: postId, user: userId, type });
//         await reaction.save();
//       }
//     }

//     res.json({ likes: post.likes, downvotes: post.downvotes });
//   } catch (err) {
//     console.error("Error in addReaction:", err);
//     next(err);
//   }
// };

// exports.addComment = async (req, res, next) => {
//   const { postId } = req.params;
//   const { text } = req.body;
//   try {
//     if (!filterContent(text)) {
//       return res
//         .status(400)
//         .json({ message: "Inappropriate comment detected" });
//     }

//     const post = await Post.findById(postId);
//     if (!post) return res.status(404).json({ message: "Post not found" });

//     post.comments.push({ text, author: req.user });
//     await post.save();

//     const updatedPost = await Post.findById(postId).populate(
//       "author",
//       "email username"
//     );
//     res.json(updatedPost);
//   } catch (err) {
//     next(err);
//   }
// };

// exports.deletePost = async (req, res, next) => {
//   const { postId } = req.params;
//   try {
//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     const userId = typeof req.user === "object" ? req.user._id : req.user;
//     if (post.author.toString() !== userId.toString()) {
//       return res
//         .status(403)
//         .json({ message: "Unauthorized to delete this post" });
//     }

//     await Reaction.deleteMany({ post: postId });
//     await Post.findByIdAndDelete(postId);

//     res.json({ message: "Post deleted successfully" });
//   } catch (err) {
//     next(err);
//   }
// };

//today's update 13-05-2025

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// const Post = require("../models/post");
// const User = require("../models/User");
// const { filterContent } = require("../utils/filters");
// const { generateSlug } = require("../utils/slugGenerator");
// const cloudinary = require("cloudinary").v2;
// const fs = require("fs");

// exports.createPost = async (req, res, next) => {
//   const { title, description, isAnonymous, category } = req.body;
//   const file = req.file;
//   try {
//     if (!filterContent(description) || (title && !filterContent(title))) {
//       return res
//         .status(400)
//         .json({ message: "Inappropriate content detected" });
//     }

//     const slug = await generateSlug(title);
//     let mediaUrl = null;

//     if (file) {
//       const result = await cloudinary.uploader.upload(file.path, {
//         folder: "gossiphub/uploads",
//       });
//       mediaUrl = result.secure_url;
//       fs.unlinkSync(file.path);
//     }

//     const post = new Post({
//       title,
//       description,
//       slug,
//       author: req.user,
//       isAnonymous,
//       category,
//       media: mediaUrl,
//     });
//     await post.save();

//     const populatedPost = await Post.findById(post._id).populate(
//       "author",
//       "email username"
//     );
//     res.json(populatedPost);
//   } catch (err) {
//     next(err);
//   }
// };

// exports.getPosts = async (req, res, next) => {
//   try {
//     const posts = await Post.find({ isFlagged: false })
//       .populate("author", "email username")
//       .populate("comments.author", "email username")
//       .sort({ createdAt: -1 });
//     res.json(posts);
//   } catch (err) {
//     next(err);
//   }
// };

// exports.addReaction = async (req, res, next) => {
//   const { postId } = req.params;
//   const { type } = req.body;

//   try {
//     const validReactions = ["like", "love", "laugh", "sad"];
//     if (!validReactions.includes(type)) {
//       return res.status(400).json({
//         message:
//           "Invalid reaction type. Use 'like', 'love', 'laugh', or 'sad'.",
//       });
//     }

//     if (!req.user) {
//       return res
//         .status(401)
//         .json({ message: "User must be logged in to add a reaction" });
//     }

//     const userId = typeof req.user === "object" ? req.user._id : req.user;
//     if (!userId) {
//       return res.status(400).json({ message: "User ID is required" });
//     }

//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Initialize reaction arrays if undefined
//     post.likes = Array.isArray(post.likes) ? post.likes : [];
//     post.loves = Array.isArray(post.loves) ? post.loves : [];
//     post.laughs = Array.isArray(post.laughs) ? post.laughs : [];
//     post.sads = Array.isArray(post.sads) ? post.sads : [];

//     const userIdStr = userId.toString();
//     const hasReacted = {
//       like: post.likes.some((id) => id && id.toString() === userIdStr),
//       love: post.loves.some((id) => id && id.toString() === userIdStr),
//       laugh: post.laughs.some((id) => id && id.toString() === userIdStr),
//       sad: post.sads.some((id) => id && id.toString() === userIdStr),
//     };

//     // Remove user from all reaction arrays
//     await Post.updateOne(
//       { _id: postId },
//       {
//         $pull: {
//           likes: userId,
//           loves: userId,
//           laughs: userId,
//           sads: userId,
//         },
//       }
//     );

//     // Add user to the selected reaction array if they haven't already reacted with that type
//     if (!hasReacted[type]) {
//       await Post.updateOne(
//         { _id: postId },
//         { $addToSet: { [type + "s"]: userId } }
//       );

//       // Update reaction streak
//       const today = new Date();
//       const todayStr = today.toISOString().split("T")[0];
//       let newStreak = user.reactionStreak;
//       let newRewards = [...(user.streakRewards || [])];

//       if (!user.lastReaction) {
//         newStreak = 1;
//       } else {
//         const lastReaction = new Date(user.lastReaction);
//         const lastReactionStr = lastReaction.toISOString().split("T")[0];
//         const diffDays = Math.floor(
//           (today - lastReaction) / (1000 * 60 * 60 * 24)
//         );

//         if (lastReactionStr !== todayStr) {
//           if (diffDays === 1) {
//             newStreak = user.reactionStreak + 1;
//           } else if (diffDays > 1) {
//             newStreak = 1;
//             newRewards = [];
//           }
//         }
//       }

//       if (newStreak > 0 && newStreak !== user.reactionStreak) {
//         const dailyReward = `Day ${newStreak} Streak`;
//         if (!newRewards.includes(dailyReward)) {
//           newRewards = newRewards.filter(
//             (reward) => !reward.startsWith("Day ")
//           );
//           newRewards.push(dailyReward);
//         }

//         if (newStreak % 5 === 0) {
//           const milestoneReward = `Reaction Streak ${newStreak}`;
//           if (!newRewards.includes(milestoneReward)) {
//             newRewards.push(milestoneReward);
//           }
//         }
//       }

//       user.reactionStreak = newStreak;
//       user.lastReaction = todayStr;
//       user.streakRewards = newRewards;
//       await user.save();
//     }

//     // Fetch updated post
//     const updatedPost = await Post.findById(postId);
//     res.json({
//       likes: updatedPost.likes,
//       loves: updatedPost.loves,
//       laughs: updatedPost.laughs,
//       sads: updatedPost.sads,
//     });
//   } catch (err) {
//     console.error("Error in addReaction:", err);
//     next(err);
//   }
// };

// exports.addComment = async (req, res, next) => {
//   const { postId } = req.params;
//   const { text } = req.body;
//   try {
//     if (!filterContent(text)) {
//       return res
//         .status(400)
//         .json({ message: "Inappropriate comment detected" });
//     }

//     const post = await Post.findById(postId);
//     if (!post) return res.status(404).json({ message: "Post not found" });

//     post.comments.push({ text, author: req.user });
//     await post.save();

//     const updatedPost = await Post.findById(postId)
//       .populate("author", "email username")
//       .populate("comments.author", "email username");
//     res.json(updatedPost);
//   } catch (err) {
//     next(err);
//   }
// };

// exports.addCommentReaction = async (req, res, next) => {
//   const { postId, commentId } = req.params;
//   const { type } = req.body;

//   try {
//     if (type !== "like") {
//       return res
//         .status(400)
//         .json({ message: "Invalid reaction type. Use 'like'." });
//     }

//     if (!req.user) {
//       return res
//         .status(401)
//         .json({ message: "User must be logged in to add a reaction" });
//     }

//     const userId = typeof req.user === "object" ? req.user._id : req.user;
//     if (!userId) {
//       return res.status(400).json({ message: "User ID is required" });
//     }

//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     const comment = post.comments.id(commentId);
//     if (!comment) {
//       return res.status(404).json({ message: "Comment not found" });
//     }

//     comment.likes = Array.isArray(comment.likes) ? comment.likes : [];
//     const userIdStr = userId.toString();
//     const hasLiked = comment.likes.some(
//       (id) => id && id.toString() === userIdStr
//     );

//     if (hasLiked) {
//       comment.likes = comment.likes.filter((id) => id.toString() !== userIdStr);
//     } else {
//       comment.likes.push(userId);
//     }

//     await post.save();

//     const updatedPost = await Post.findById(postId)
//       .populate("author", "email username")
//       .populate("comments.author", "email username");
//     res.json(updatedPost);
//   } catch (err) {
//     console.error("Error in addCommentReaction:", err);
//     next(err);
//   }
// };

// exports.deletePost = async (req, res, next) => {
//   const { postId } = req.params;
//   try {
//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     const userId = typeof req.user === "object" ? req.user._id : req.user;
//     if (post.author.toString() !== userId.toString()) {
//       return res
//         .status(403)
//         .json({ message: "Unauthorized to delete this post" });
//     }

//     await Post.findByIdAndDelete(postId);
//     res.json({ message: "Post deleted successfully" });
//   } catch (err) {
//     next(err);
//   }
// };

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///04-06-2025

// const Post = require("../models/post");
// const User = require("../models/User");
// const { filterContent } = require("../utils/filters");
// const { generateSlug } = require("../utils/slugGenerator");
// const cloudinary = require("cloudinary").v2;
// const fs = require("fs");

// exports.createPost = async (req, res, next) => {
//   const { title, description, isAnonymous, category } = req.body;
//   const file = req.file;
//   try {
//     // Validate content
//     if (!filterContent(description) || (title && !filterContent(title))) {
//       return res
//         .status(400)
//         .json({ message: "Inappropriate content detected" });
//     }

//     const slug = await generateSlug(title);
//     let mediaUrl = null;

//     if (file) {
//       // Determine the resource type based on the file's MIME type
//       const isVideo = file.mimetype.startsWith("video/");
//       const resourceType = isVideo ? "video" : "image";

//       try {
//         const result = await cloudinary.uploader.upload(file.path, {
//           folder: "gossiphub/uploads",
//           resource_type: resourceType,
//         });
//         mediaUrl = result.secure_url;
//       } catch (uploadError) {
//         // Handle Cloudinary upload errors
//         return res.status(500).json({
//           message: "Failed to upload media to Cloudinary",
//           error: uploadError.message,
//         });
//       } finally {
//         // Clean up the temporary file
//         try {
//           fs.unlinkSync(file.path);
//         } catch (fsError) {
//           console.error("Error deleting temporary file:", fsError.message);
//         }
//       }
//     }

//     const post = new Post({
//       title,
//       description,
//       slug,
//       author: req.user,
//       isAnonymous,
//       category,
//       media: mediaUrl,
//     });
//     await post.save();

//     const populatedPost = await Post.findById(post._id).populate(
//       "author",
//       "email username"
//     );
//     res.json(populatedPost);
//   } catch (err) {
//     next(err);
//   }
// };

// exports.getPosts = async (req, res, next) => {
//   try {
//     const posts = await Post.find({ isFlagged: false })
//       .populate("author", "email username")
//       .populate("comments.author", "email username")
//       .sort({ createdAt: -1 });
//     res.json(posts);
//   } catch (err) {
//     next(err);
//   }
// };

// exports.addReaction = async (req, res, next) => {
//   const { postId } = req.params;
//   const { type } = req.body;

//   try {
//     const validReactions = ["like", "love", "laugh", "sad"];
//     if (!validReactions.includes(type)) {
//       return res.status(400).json({
//         message:
//           "Invalid reaction type. Use 'like', 'love', 'laugh', or 'sad'.",
//       });
//     }

//     if (!req.user) {
//       return res
//         .status(401)
//         .json({ message: "User must be logged in to add a reaction" });
//     }

//     const userId = typeof req.user === "object" ? req.user._id : req.user;
//     if (!userId) {
//       return res.status(400).json({ message: "User ID is required" });
//     }

//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Initialize reaction arrays if undefined
//     post.likes = Array.isArray(post.likes) ? post.likes : [];
//     post.loves = Array.isArray(post.loves) ? post.loves : [];
//     post.laughs = Array.isArray(post.laughs) ? post.laughs : [];
//     post.sads = Array.isArray(post.sads) ? post.sads : [];

//     const userIdStr = userId.toString();
//     const hasReacted = {
//       like: post.likes.some((id) => id && id.toString() === userIdStr),
//       love: post.loves.some((id) => id && id.toString() === userIdStr),
//       laugh: post.laughs.some((id) => id && id.toString() === userIdStr),
//       sad: post.sads.some((id) => id && id.toString() === userIdStr),
//     };

//     // Remove user from all reaction arrays
//     await Post.updateOne(
//       { _id: postId },
//       {
//         $pull: {
//           likes: userId,
//           loves: userId,
//           laughs: userId,
//           sads: userId,
//         },
//       }
//     );

//     // Add user to the selected reaction array if they haven't already reacted with that type
//     if (!hasReacted[type]) {
//       await Post.updateOne(
//         { _id: postId },
//         { $addToSet: { [type + "s"]: userId } }
//       );

//       // Update reaction streak
//       const today = new Date();
//       const todayStr = today.toISOString().split("T")[0];
//       let newStreak = user.reactionStreak;
//       let newRewards = [...(user.streakRewards || [])];

//       if (!user.lastReaction) {
//         newStreak = 1;
//       } else {
//         const lastReaction = new Date(user.lastReaction);
//         const lastReactionStr = lastReaction.toISOString().split("T")[0];
//         const diffDays = Math.floor(
//           (today - lastReaction) / (1000 * 60 * 60 * 24)
//         );

//         if (lastReactionStr !== todayStr) {
//           if (diffDays === 1) {
//             newStreak = user.reactionStreak + 1;
//           } else if (diffDays > 1) {
//             newStreak = 1;
//             newRewards = [];
//           }
//         }
//       }

//       if (newStreak > 0 && newStreak !== user.reactionStreak) {
//         const dailyReward = `Day ${newStreak} Streak`;
//         if (!newRewards.includes(dailyReward)) {
//           newRewards = newRewards.filter(
//             (reward) => !reward.startsWith("Day ")
//           );
//           newRewards.push(dailyReward);
//         }

//         if (newStreak % 5 === 0) {
//           const milestoneReward = `Reaction Streak ${newStreak}`;
//           if (!newRewards.includes(milestoneReward)) {
//             newRewards.push(milestoneReward);
//           }
//         }
//       }

//       user.reactionStreak = newStreak;
//       user.lastReaction = todayStr;
//       user.streakRewards = newRewards;
//       await user.save();
//     }

//     // Fetch updated post
//     const updatedPost = await Post.findById(postId);
//     res.json({
//       likes: updatedPost.likes,
//       loves: updatedPost.loves,
//       laughs: updatedPost.laughs,
//       sads: updatedPost.sads,
//     });
//   } catch (err) {
//     console.error("Error in addReaction:", err);
//     next(err);
//   }
// };

// exports.addComment = async (req, res, next) => {
//   const { postId } = req.params;
//   const { text } = req.body;
//   try {
//     if (!filterContent(text)) {
//       return res
//         .status(400)
//         .json({ message: "Inappropriate comment detected" });
//     }

//     const post = await Post.findById(postId);
//     if (!post) return res.status(404).json({ message: "Post not found" });

//     post.comments.push({ text, author: req.user });
//     await post.save();

//     const updatedPost = await Post.findById(postId)
//       .populate("author", "email username")
//       .populate("comments.author", "email username");
//     res.json(updatedPost);
//   } catch (err) {
//     next(err);
//   }
// };

// exports.addCommentReaction = async (req, res, next) => {
//   const { postId, commentId } = req.params;
//   const { type } = req.body;

//   try {
//     if (type !== "like") {
//       return res
//         .status(400)
//         .json({ message: "Invalid reaction type. Use 'like'." });
//     }

//     if (!req.user) {
//       return res
//         .status(401)
//         .json({ message: "User must be logged in to add a reaction" });
//     }

//     const userId = typeof req.user === "object" ? req.user._id : req.user;
//     if (!userId) {
//       return res.status(400).json({ message: "User ID is required" });
//     }

//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     const comment = post.comments.id(commentId);
//     if (!comment) {
//       return res.status(404).json({ message: "Comment not found" });
//     }

//     comment.likes = Array.isArray(comment.likes) ? comment.likes : [];
//     const userIdStr = userId.toString();
//     const hasLiked = comment.likes.some(
//       (id) => id && id.toString() === userIdStr
//     );

//     if (hasLiked) {
//       comment.likes = comment.likes.filter((id) => id.toString() !== userIdStr);
//     } else {
//       comment.likes.push(userId);
//     }

//     await post.save();

//     const updatedPost = await Post.findById(postId)
//       .populate("author", "email username")
//       .populate("comments.author", "email username");
//     res.json(updatedPost);
//   } catch (err) {
//     console.error("Error in addCommentReaction:", err);
//     next(err);
//   }
// };

// exports.deletePost = async (req, res, next) => {
//   const { postId } = req.params;
//   try {
//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     const userId = typeof req.user === "object" ? req.user._id : req.user;
//     if (post.author.toString() !== userId.toString()) {
//       return res
//         .status(403)
//         .json({ message: "Unauthorized to delete this post" });
//     }

//     await Post.findByIdAndDelete(postId);
//     res.json({ message: "Post deleted successfully" });
//   } catch (err) {
//     next(err);
//   }
// };

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const Post = require("../models/post");
const User = require("../models/User");
const { filterContent } = require("../utils/filters");
const { generateSlug } = require("../utils/slugGenerator");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// exports.createPost = async (req, res, next) => {
//   const { title, description, isAnonymous, category } = req.body;
//   const file = req.file;
//   try {
//     // Validate content
//     if (!filterContent(description) || (title && !filterContent(title))) {
//       return res
//         .status(400)
//         .json({ message: "Inappropriate content detected" });
//     }

//     const slug = await generateSlug(title);
//     let mediaUrl = null;

//     if (file) {
//       const isVideo = file.mimetype.startsWith("video/");
//       const fileExtension = file.originalname.split(".").pop();
//       const fileName = `gossiphub/uploads/${Date.now()}-${file.originalname}`;

//       try {
//         const params = {
//           Bucket: process.env.AWS_S3_BUCKET,
//           Key: fileName,
//           Body: file.buffer,
//           ContentType: file.mimetype,
//         };
//         const command = new PutObjectCommand(params);
//         await s3Client.send(command);
//         mediaUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
//       } catch (uploadError) {
//         return res.status(500).json({
//           message: "Failed to upload media to S3",
//           error: uploadError.message,
//         });
//       } finally {
//         // Clean up the temporary file
//         try {
//           if (file.path) {
//             fs.unlinkSync(file.path);
//           }
//         } catch (fsError) {
//           console.error("Error deleting temporary file:", fsError.message);
//         }
//       }
//     }

//     const post = new Post({
//       title,
//       description,
//       slug,
//       author: req.user,
//       isAnonymous,
//       category,
//       media: mediaUrl,
//     });
//     await post.save();

//     const populatedPost = await Post.findById(post._id).populate(
//       "author",
//       "email username"
//     );
//     res.json(populatedPost);
//   } catch (err) {
//     next(err);
//   }
// };

// Rest of your postRoutes.js remains unchanged

exports.createPost = async (req, res, next) => {
  const { title, description, isAnonymous, category } = req.body;
  const file = req.file;
  try {
    // Validate content
    if (!filterContent(description) || (title && !filterContent(title))) {
      return res
        .status(400)
        .json({ message: "Inappropriate content detected" });
    }

    const slug = await generateSlug(title);
    let mediaUrl = null;

    if (file) {
      const fileExtension = file.originalname.split(".").pop();
      const fileName = `gossiphub/uploads/${Date.now()}-${file.originalname}`;
      try {
        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        };
        const command = new PutObjectCommand(params);
        await s3Client.send(command);
        mediaUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
      } catch (uploadError) {
        return res.status(500).json({
          message: "Failed to upload media to S3",
          error: uploadError.message,
        });
      } finally {
        try {
          if (file.path) fs.unlinkSync(file.path);
        } catch (fsError) {
          console.error("Error deleting temporary file:", fsError.message);
        }
      }
    }

    const post = new Post({
      title,
      description,
      slug,
      author: req.user,
      isAnonymous,
      category,
      media: mediaUrl,
    });
    await post.save();

    // Update user's funMeter and level
    const userId = typeof req.user === "object" ? req.user._id : req.user;
    const user = await User.findById(userId);
    if (user) {
      user.funMeter += 50; // Award 50 points for creating a post
      user.level = Math.floor(user.funMeter / 100) + 1; // Level up every 100 points

      // Award badges based on milestones
      if (user.funMeter >= 100 && !user.badges.includes("Newbie")) {
        user.badges.push("Newbie");
      }
      if (user.funMeter >= 500 && !user.badges.includes("Gossip Pro")) {
        user.badges.push("Gossip Pro");
      }
      await user.save();
    }

    const populatedPost = await Post.findById(post._id).populate(
      "author",
      "email username"
    );
    res.json(populatedPost);
  } catch (err) {
    next(err);
  }
};

exports.getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ isFlagged: false })
      .populate("author", "email username")
      .populate("comments.author", "email username")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    next(err);
  }
};

exports.getPostById = async (req, res, next) => {
  const { postId } = req.params;
  try {
    const post = await Post.findById(postId)
      .populate("author", "email username")
      .populate("comments.author", "email username");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Ensure the post is not flagged unless the user is the author
    const userId = typeof req.user === "object" ? req.user._id : req.user;
    if (
      post.isFlagged &&
      (!userId || post.author.toString() !== userId.toString())
    ) {
      return res
        .status(403)
        .json({ message: "Post is flagged and cannot be accessed" });
    }

    res.json(post);
  } catch (err) {
    console.error("Error in getPostById:", err);
    next(err);
  }
};

// exports.addReaction = async (req, res, next) => {
//   const { postId } = req.params;
//   const { type } = req.body;

//   try {
//     const validReactions = ["like", "love", "laugh", "sad"];
//     if (!validReactions.includes(type)) {
//       return res.status(400).json({
//         message:
//           "Invalid reaction type. Use 'like', 'love', 'laugh', or 'sad'.",
//       });
//     }

//     if (!req.user) {
//       return res
//         .status(401)
//         .json({ message: "User must be logged in to add a reaction" });
//     }

//     const userId = typeof req.user === "object" ? req.user._id : req.user;
//     if (!userId) {
//       return res.status(400).json({ message: "User ID is required" });
//     }

//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     post.likes = Array.isArray(post.likes) ? post.likes : [];
//     post.loves = Array.isArray(post.loves) ? post.loves : [];
//     post.laughs = Array.isArray(post.laughs) ? post.laughs : [];
//     post.sads = Array.isArray(post.sads) ? post.sads : [];

//     const userIdStr = userId.toString();
//     const hasReacted = {
//       like: post.likes.some((id) => id && id.toString() === userIdStr),
//       love: post.loves.some((id) => id && id.toString() === userIdStr),
//       laugh: post.laughs.some((id) => id && id.toString() === userIdStr),
//       sad: post.sads.some((id) => id && id.toString() === userIdStr),
//     };

//     await Post.updateOne(
//       { _id: postId },
//       {
//         $pull: {
//           likes: userId,
//           loves: userId,
//           laughs: userId,
//           sads: userId,
//         },
//       }
//     );

//     if (!hasReacted[type]) {
//       await Post.updateOne(
//         { _id: postId },
//         { $addToSet: { [type + "s"]: userId } }
//       );

//       const today = new Date();
//       const todayStr = today.toISOString().split("T")[0];
//       let newStreak = user.reactionStreak;
//       let newRewards = [...(user.streakRewards || [])];

//       if (!user.lastReaction) {
//         newStreak = 1;
//       } else {
//         const lastReaction = new Date(user.lastReaction);
//         const lastReactionStr = lastReaction.toISOString().split("T")[0];
//         const diffDays = Math.floor(
//           (today - lastReaction) / (1000 * 60 * 60 * 24)
//         );

//         if (lastReactionStr !== todayStr) {
//           if (diffDays === 1) {
//             newStreak = user.reactionStreak + 1;
//           } else if (diffDays > 1) {
//             newStreak = 1;
//             newRewards = [];
//           }
//         }
//       }

//       if (newStreak > 0 && newStreak !== user.reactionStreak) {
//         const dailyReward = `Day ${newStreak} Streak`;
//         if (!newRewards.includes(dailyReward)) {
//           newRewards = newRewards.filter(
//             (reward) => !reward.startsWith("Day ")
//           );
//           newRewards.push(dailyReward);
//         }

//         if (newStreak % 5 === 0) {
//           const milestoneReward = `Reaction Streak ${newStreak}`;
//           if (!newRewards.includes(milestoneReward)) {
//             newRewards.push(milestoneReward);
//           }
//         }
//       }

//       user.reactionStreak = newStreak;
//       user.lastReaction = todayStr;
//       user.streakRewards = newRewards;
//       await user.save();
//     }

//     const updatedPost = await Post.findById(postId);
//     res.json({
//       likes: updatedPost.likes,
//       loves: updatedPost.loves,
//       laughs: updatedPost.laughs,
//       sads: updatedPost.sads,
//     });
//   } catch (err) {
//     console.error("Error in addReaction:", err);
//     next(err);
//   }
// };

// exports.addComment = async (req, res, next) => {
//   const { postId } = req.params;
//   const { text } = req.body;
//   try {
//     if (!filterContent(text)) {
//       return res
//         .status(400)
//         .json({ message: "Inappropriate comment detected" });
//     }

//     const post = await Post.findById(postId);
//     if (!post) return res.status(404).json({ message: "Post not found" });

//     post.comments.push({ text, author: req.user });
//     await post.save();

//     const updatedPost = await Post.findById(postId)
//       .populate("author", "email username")
//       .populate("comments.author", "email username");
//     res.json(updatedPost);
//   } catch (err) {
//     next(err);
//   }
// };

exports.addReaction = async (req, res, next) => {
  const { postId } = req.params;
  const { type } = req.body;

  try {
    const validReactions = ["like", "love", "laugh", "sad"];
    if (!validReactions.includes(type)) {
      return res.status(400).json({
        message:
          "Invalid reaction type. Use 'like', 'love', 'laugh', or 'sad'.",
      });
    }

    if (!req.user) {
      return res
        .status(401)
        .json({ message: "User must be logged in to add a reaction" });
    }

    const userId = typeof req.user === "object" ? req.user._id : req.user;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    post.likes = Array.isArray(post.likes) ? post.likes : [];
    post.loves = Array.isArray(post.loves) ? post.loves : [];
    post.laughs = Array.isArray(post.laughs) ? post.laughs : [];
    post.sads = Array.isArray(post.sads) ? post.sads : [];

    const userIdStr = userId.toString();
    const hasReacted = {
      like: post.likes.some((id) => id && id.toString() === userIdStr),
      love: post.loves.some((id) => id && id.toString() === userIdStr),
      laugh: post.laughs.some((id) => id && id.toString() === userIdStr),
      sad: post.sads.some((id) => id && id.toString() === userIdStr),
    };

    await Post.updateOne(
      { _id: postId },
      {
        $pull: {
          likes: userId,
          loves: userId,
          laughs: userId,
          sads: userId,
        },
      }
    );

    if (!hasReacted[type]) {
      await Post.updateOne(
        { _id: postId },
        { $addToSet: { [type + "s"]: userId } }
      );

      // Update funMeter, level, and badges
      user.funMeter += 10; // Award 10 points for a reaction
      user.level = Math.floor(user.funMeter / 100) + 1; // Level up every 100 points

      // Award badges based on milestones
      if (user.funMeter >= 100 && !user.badges.includes("Newbie")) {
        user.badges.push("Newbie");
      }
      if (user.funMeter >= 500 && !user.badges.includes("Gossip Pro")) {
        user.badges.push("Gossip Pro");
      }
      if (user.funMeter >= 1000 && !user.badges.includes("Trendsetter")) {
        user.badges.push("Trendsetter");
      }

      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      let newStreak = user.reactionStreak;
      let newRewards = [...(user.streakRewards || [])];

      if (!user.lastReaction) {
        newStreak = 1;
      } else {
        const lastReaction = new Date(user.lastReaction);
        const lastReactionStr = lastReaction.toISOString().split("T")[0];
        const diffDays = Math.floor(
          (today - lastReaction) / (1000 * 60 * 60 * 24)
        );

        if (lastReactionStr !== todayStr) {
          if (diffDays === 1) {
            newStreak = user.reactionStreak + 1;
          } else if (diffDays > 1) {
            newStreak = 1;
            newRewards = [];
          }
        }
      }

      if (newStreak > 0 && newStreak !== user.reactionStreak) {
        const dailyReward = `Day ${newStreak} Streak`;
        if (!newRewards.includes(dailyReward)) {
          newRewards = newRewards.filter(
            (reward) => !reward.startsWith("Day ")
          );
          newRewards.push(dailyReward);
        }

        if (newStreak % 5 === 0) {
          const milestoneReward = `Reaction Streak ${newStreak}`;
          if (!newRewards.includes(milestoneReward)) {
            newRewards.push(milestoneReward);
          }
        }
      }

      user.reactionStreak = newStreak;
      user.lastReaction = todayStr;
      user.streakRewards = newRewards;
      await user.save();
    }

    const updatedPost = await Post.findById(postId);
    res.json({
      likes: updatedPost.likes,
      loves: updatedPost.loves,
      laughs: updatedPost.laughs,
      sads: updatedPost.sads,
    });
  } catch (err) {
    console.error("Error in addReaction:", err);
    next(err);
  }
};

exports.addComment = async (req, res, next) => {
  const { postId } = req.params;
  const { text } = req.body;
  try {
    if (!filterContent(text)) {
      return res
        .status(400)
        .json({ message: "Inappropriate comment detected" });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = typeof req.user === "object" ? req.user._id : req.user;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    post.comments.push({ text, author: userId });
    await post.save();

    // Update funMeter, level, and badges
    user.funMeter += 20; // Award 20 points for a comment
    user.level = Math.floor(user.funMeter / 100) + 1; // Level up every 100 points

    // Award badges based on milestones
    if (user.funMeter >= 100 && !user.badges.includes("Newbie")) {
      user.badges.push("Newbie");
    }
    if (user.funMeter >= 500 && !user.badges.includes("Gossip Pro")) {
      user.badges.push("Gossip Pro");
    }
    if (user.funMeter >= 1000 && !user.badges.includes("Trendsetter")) {
      user.badges.push("Trendsetter");
    }
    await user.save();

    const updatedPost = await Post.findById(postId)
      .populate("author", "email username")
      .populate("comments.author", "email username");
    res.json(updatedPost);
  } catch (err) {
    next(err);
  }
};

exports.addCommentReaction = async (req, res, next) => {
  const { postId, commentId } = req.params;
  const { type } = req.body;

  try {
    if (type !== "like") {
      return res
        .status(400)
        .json({ message: "Invalid reaction type. Use 'like'." });
    }

    if (!req.user) {
      return res
        .status(401)
        .json({ message: "User must be logged in to add a reaction" });
    }

    const userId = typeof req.user === "object" ? req.user._id : req.user;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    comment.likes = Array.isArray(comment.likes) ? comment.likes : [];
    const userIdStr = userId.toString();
    const hasLiked = comment.likes.some(
      (id) => id && id.toString() === userIdStr
    );

    if (hasLiked) {
      comment.likes = comment.likes.filter((id) => id.toString() !== userIdStr);
    } else {
      comment.likes.push(userId);
    }

    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate("author", "email username")
      .populate("comments.author", "email username");
    res.json(updatedPost);
  } catch (err) {
    console.error("Error in addCommentReaction:", err);
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  const { postId } = req.params;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userId = typeof req.user === "object" ? req.user._id : req.user;
    if (post.author.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this post" });
    }

    await Post.findByIdAndDelete(postId);
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
  const { postId } = req.params;
  const { title, description, isAnonymous, category } = req.body;
  const file = req.file;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userId = typeof req.user === "object" ? req.user._id : req.user;
    if (post.author.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized to update this post" });
    }

    // Validate content
    if (!filterContent(description) || (title && !filterContent(title))) {
      return res
        .status(400)
        .json({ message: "Inappropriate content detected" });
    }

    // Update fields
    post.title = title || post.title;
    post.description = description || post.description;
    post.isAnonymous =
      isAnonymous !== undefined ? isAnonymous : post.isAnonymous;
    post.category = category || post.category;
    post.slug = await generateSlug(title || post.title);

    // Handle media update
    let mediaUrl = post.media;
    if (file) {
      // Delete old media from S3 if it exists
      if (post.media) {
        const oldKey = post.media.split(
          `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/`
        )[1];
        if (oldKey) {
          try {
            await s3Client.send(
              new DeleteObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: oldKey,
              })
            );
          } catch (deleteError) {
            console.error(
              "Error deleting old media from S3:",
              deleteError.message
            );
          }
        }
      }

      // Upload new media
      const isVideo = file.mimetype.startsWith("video/");
      const fileExtension = file.originalname.split(".").pop();
      const fileName = `gossiphub/uploads/${Date.now()}-${file.originalname}`;

      try {
        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        };
        const command = new PutObjectCommand(params);
        await s3Client.send(command);
        mediaUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
      } catch (uploadError) {
        return res.status(500).json({
          message: "Failed to upload media to S3",
          error: uploadError.message,
        });
      } finally {
        // Clean up the temporary file
        try {
          if (file.path) {
            fs.unlinkSync(file.path);
          }
        } catch (fsError) {
          console.error("Error deleting temporary file:", fsError.message);
        }
      }
    }

    post.media = mediaUrl;
    await post.save();

    const populatedPost = await Post.findById(post._id).populate(
      "author",
      "email username"
    );
    res.json(populatedPost);
  } catch (err) {
    next(err);
  }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// const mongoose = require("mongoose");
// const Post = require("../models/post");
// const User = require("../models/User");
// const { filterContent } = require("../utils/filters");
// const { generateSlug } = require("../utils/slugGenerator");
// const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
// const fs = require("fs");

// // Initialize S3 Client
// const s3Client = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// exports.createPost = async (req, res, next) => {
//   const { title, description, isAnonymous, category } = req.body;
//   const file = req.file;

//   try {
//     // Validate req.user
//     if (!req.user || !req.user.userId) {
//       return res.status(401).json({ message: "User must be authenticated" });
//     }

//     // Convert and validate userId
//     const userId = mongoose.Types.ObjectId.isValid(req.user.userId)
//       ? new mongoose.Types.ObjectId(req.user.userId)
//       : null;
//     if (!userId) {
//       return res.status(400).json({ message: "Invalid user ID" });
//     }

//     // Validate content
//     if (!filterContent(description) || (title && !filterContent(title))) {
//       return res
//         .status(400)
//         .json({ message: "Inappropriate content detected" });
//     }

//     const slug = await generateSlug(title);
//     let mediaUrl = null;

//     if (file) {
//       const isVideo = file.mimetype.startsWith("video/");
//       const fileExtension = file.originalname.split(".").pop();
//       const fileName = `gossiphub/uploads/${Date.now()}-${file.originalname.replace(
//         /\s+/g,
//         "-"
//       )}`;

//       try {
//         const params = {
//           Bucket: process.env.AWS_S3_BUCKET,
//           Key: fileName,
//           Body: file.buffer,
//           ContentType: file.mimetype,
//         };
//         const command = new PutObjectCommand(params);
//         await s3Client.send(command);
//         mediaUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
//       } catch (uploadError) {
//         return res.status(500).json({
//           message: "Failed to upload media to S3",
//           error: uploadError.message,
//         });
//       } finally {
//         // Clean up the temporary file
//         try {
//           if (file.path) {
//             fs.unlinkSync(file.path);
//           }
//         } catch (fsError) {
//           console.error("Error deleting temporary file:", fsError.message);
//         }
//       }
//     }

//     const post = new Post({
//       title,
//       description,
//       slug,
//       author: userId, // Use validated ObjectId
//       isAnonymous,
//       category,
//       media: mediaUrl,
//     });
//     await post.save();

//     const populatedPost = await Post.findById(post._id).populate(
//       "author",
//       "email username"
//     );
//     res.json(populatedPost);
//   } catch (err) {
//     console.error("Error in createPost:", err.message);
//     next(err);
//   }
// };

// // Rest of the functions remain unchanged
// exports.getPosts = async (req, res, next) => {
//   try {
//     const posts = await Post.find({ isFlagged: false })
//       .populate("author", "email username")
//       .populate("comments.author", "email username")
//       .sort({ createdAt: -1 });
//     res.json(posts);
//   } catch (err) {
//     console.error("Error in getPosts:", err.message);
//     next(err);
//   }
// };

// exports.addReaction = async (req, res, next) => {
//   const { postId } = req.params;
//   const { type } = req.body;

//   try {
//     if (!req.user || !req.user.userId) {
//       return res.status(401).json({ message: "User must be authenticated" });
//     }

//     const validReactions = ["like", "love", "laugh", "sad"];
//     if (!validReactions.includes(type)) {
//       return res.status(400).json({
//         message:
//           "Invalid reaction type. Use 'like', 'love', 'laugh', or 'sad'.",
//       });
//     }

//     const userId = mongoose.Types.ObjectId.isValid(req.user.userId)
//       ? new mongoose.Types.ObjectId(req.user.userId)
//       : null;
//     if (!userId) {
//       return res.status(400).json({ message: "Invalid user ID" });
//     }

//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     post.likes = Array.isArray(post.likes) ? post.likes : [];
//     post.loves = Array.isArray(post.loves) ? post.loves : [];
//     post.laughs = Array.isArray(post.laughs) ? post.laughs : [];
//     post.sads = Array.isArray(post.sads) ? post.sads : [];

//     const userIdStr = userId.toString();
//     const hasReacted = {
//       like: post.likes.some((id) => id && id.toString() === userIdStr),
//       love: post.loves.some((id) => id && id.toString() === userIdStr),
//       laugh: post.laughs.some((id) => id && id.toString() === userIdStr),
//       sad: post.sads.some((id) => id && id.toString() === userIdStr),
//     };

//     await Post.updateOne(
//       { _id: postId },
//       {
//         $pull: {
//           likes: userId,
//           loves: userId,
//           laughs: userId,
//           sads: userId,
//         },
//       }
//     );

//     if (!hasReacted[type]) {
//       await Post.updateOne(
//         { _id: postId },
//         { $addToSet: { [type + "s"]: userId } }
//       );

//       const today = new Date();
//       const todayStr = today.toISOString().split("T")[0];
//       let newStreak = user.reactionStreak;
//       let newRewards = [...(user.streakRewards || [])];

//       if (!user.lastReaction) {
//         newStreak = 1;
//       } else {
//         const lastReaction = new Date(user.lastReaction);
//         const lastReactionStr = lastReaction.toISOString().split("T")[0];
//         const diffDays = Math.floor(
//           (today - lastReaction) / (1000 * 60 * 60 * 24)
//         );

//         if (lastReactionStr !== todayStr) {
//           if (diffDays === 1) {
//             newStreak = user.reactionStreak + 1;
//           } else if (diffDays > 1) {
//             newStreak = 1;
//             newRewards = [];
//           }
//         }
//       }

//       if (newStreak > 0 && newStreak !== user.reactionStreak) {
//         const dailyReward = `Day ${newStreak} Streak`;
//         if (!newRewards.includes(dailyReward)) {
//           newRewards = newRewards.filter(
//             (reward) => !reward.startsWith("Day ")
//           );
//           newRewards.push(dailyReward);
//         }

//         if (newStreak % 5 === 0) {
//           const milestoneReward = `Reaction Streak ${newStreak}`;
//           if (!newRewards.includes(milestoneReward)) {
//             newRewards.push(milestoneReward);
//           }
//         }
//       }

//       user.reactionStreak = newStreak;
//       user.lastReaction = todayStr;
//       user.streakRewards = newRewards;
//       await user.save();
//     }

//     const updatedPost = await Post.findById(postId);
//     res.json({
//       likes: updatedPost.likes,
//       loves: updatedPost.loves,
//       laughs: updatedPost.laughs,
//       sads: updatedPost.sads,
//     });
//   } catch (err) {
//     console.error("Error in addReaction:", err.message);
//     next(err);
//   }
// };

// exports.addComment = async (req, res, next) => {
//   const { postId } = req.params;
//   const { text } = req.body;

//   try {
//     if (!req.user || !req.user.userId) {
//       return res.status(401).json({ message: "User must be authenticated" });
//     }

//     const userId = mongoose.Types.ObjectId.isValid(req.user.userId)
//       ? new mongoose.Types.ObjectId(req.user.userId)
//       : null;
//     if (!userId) {
//       return res.status(400).json({ message: "Invalid user ID" });
//     }

//     if (!filterContent(text)) {
//       return res
//         .status(400)
//         .json({ message: "Inappropriate comment detected" });
//     }

//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     post.comments.push({ text, author: userId });
//     await post.save();

//     const updatedPost = await Post.findById(postId)
//       .populate("author", "email username")
//       .populate("comments.author", "email username");
//     res.json(updatedPost);
//   } catch (err) {
//     console.error("Error in addComment:", err.message);
//     next(err);
//   }
// };

// exports.addCommentReaction = async (req, res, next) => {
//   const { postId, commentId } = req.params;
//   const { type } = req.body;

//   try {
//     if (!req.user || !req.user.userId) {
//       return res.status(401).json({ message: "User must be authenticated" });
//     }

//     const userId = mongoose.Types.ObjectId.isValid(req.user.userId)
//       ? new mongoose.Types.ObjectId(req.user.userId)
//       : null;
//     if (!userId) {
//       return res.status(400).json({ message: "Invalid user ID" });
//     }

//     if (type !== "like") {
//       return res
//         .status(400)
//         .json({ message: "Invalid reaction type. Use 'like'." });
//     }

//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     const comment = post.comments.id(commentId);
//     if (!comment) {
//       return res.status(404).json({ message: "Comment not found" });
//     }

//     comment.likes = Array.isArray(comment.likes) ? comment.likes : [];
//     const userIdStr = userId.toString();
//     const hasLiked = comment.likes.some(
//       (id) => id && id.toString() === userIdStr
//     );

//     if (hasLiked) {
//       comment.likes = comment.likes.filter((id) => id.toString() !== userIdStr);
//     } else {
//       comment.likes.push(userId);
//     }

//     await post.save();

//     const updatedPost = await Post.findById(postId)
//       .populate("author", "email username")
//       .populate("comments.author", "email username");
//     res.json(updatedPost);
//   } catch (err) {
//     console.error("Error in addCommentReaction:", err.message);
//     next(err);
//   }
// };

// exports.deletePost = async (req, res, next) => {
//   const { postId } = req.params;

//   try {
//     if (!req.user || !req.user.userId) {
//       return res.status(401).json({ message: "User must be authenticated" });
//     }

//     const userId = mongoose.Types.ObjectId.isValid(req.user.userId)
//       ? new mongoose.Types.ObjectId(req.user.userId)
//       : null;
//     if (!userId) {
//       return res.status(400).json({ message: "Invalid user ID" });
//     }

//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     if (post.author.toString() !== userId.toString()) {
//       return res
//         .status(403)
//         .json({ message: "Unauthorized to delete this post" });
//     }

//     await Post.findByIdAndDelete(postId);
//     res.json({ message: "Post deleted successfully" });
//   } catch (err) {
//     console.error("Error in deletePost:", err.message);
//     next(err);
//   }
// };
