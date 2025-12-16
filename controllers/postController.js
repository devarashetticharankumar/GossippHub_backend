



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

// // exports.createPost = async (req, res, next) => {
// //   const { title, description, isAnonymous, category } = req.body;
// //   const file = req.file;
// //   try {
// //     // Validate content
// //     if (!filterContent(description) || (title && !filterContent(title))) {
// //       return res
// //         .status(400)
// //         .json({ message: "Inappropriate content detected" });
// //     }

// //     const slug = await generateSlug(title);
// //     let mediaUrl = null;

// //     if (file) {
// //       const isVideo = file.mimetype.startsWith("video/");
// //       const fileExtension = file.originalname.split(".").pop();
// //       const fileName = `gossiphub/uploads/${Date.now()}-${file.originalname}`;

// //       try {
// //         const params = {
// //           Bucket: process.env.AWS_S3_BUCKET,
// //           Key: fileName,
// //           Body: file.buffer,
// //           ContentType: file.mimetype,
// //         };
// //         const command = new PutObjectCommand(params);
// //         await s3Client.send(command);
// //         mediaUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
// //       } catch (uploadError) {
// //         return res.status(500).json({
// //           message: "Failed to upload media to S3",
// //           error: uploadError.message,
// //         });
// //       } finally {
// //         // Clean up the temporary file
// //         try {
// //           if (file.path) {
// //             fs.unlinkSync(file.path);
// //           }
// //         } catch (fsError) {
// //           console.error("Error deleting temporary file:", fsError.message);
// //         }
// //       }
// //     }

// //     const post = new Post({
// //       title,
// //       description,
// //       slug,
// //       author: req.user,
// //       isAnonymous,
// //       category,
// //       media: mediaUrl,
// //     });
// //     await post.save();

// //     const populatedPost = await Post.findById(post._id).populate(
// //       "author",
// //       "email username"
// //     );
// //     res.json(populatedPost);
// //   } catch (err) {
// //     next(err);
// //   }
// // };

// // Rest of your postRoutes.js remains unchanged

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
//         try {
//           if (file.path) fs.unlinkSync(file.path);
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

//     // Update user's funMeter and level
//     const userId = typeof req.user === "object" ? req.user._id : req.user;
//     const user = await User.findById(userId);
//     if (user) {
//       user.funMeter += 50; // Award 50 points for creating a post
//       user.level = Math.floor(user.funMeter / 100) + 1; // Level up every 100 points

//       // Award badges based on milestones
//       if (user.funMeter >= 100 && !user.badges.includes("Newbie")) {
//         user.badges.push("Newbie");
//       }
//       if (user.funMeter >= 500 && !user.badges.includes("Gossip Pro")) {
//         user.badges.push("Gossip Pro");
//       }
//       await user.save();
//     }

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

// exports.getPostById = async (req, res, next) => {
//   const { postId } = req.params;
//   try {
//     const post = await Post.findById(postId)
//       .populate("author", "email username")
//       .populate("comments.author", "email username");

//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     // Ensure the post is not flagged unless the user is the author
//     const userId = typeof req.user === "object" ? req.user._id : req.user;
//     if (
//       post.isFlagged &&
//       (!userId || post.author.toString() !== userId.toString())
//     ) {
//       return res
//         .status(403)
//         .json({ message: "Post is flagged and cannot be accessed" });
//     }

//     res.json(post);
//   } catch (err) {
//     console.error("Error in getPostById:", err);
//     next(err);
//   }
// };

// // exports.addReaction = async (req, res, next) => {
// //   const { postId } = req.params;
// //   const { type } = req.body;

// //   try {
// //     const validReactions = ["like", "love", "laugh", "sad"];
// //     if (!validReactions.includes(type)) {
// //       return res.status(400).json({
// //         message:
// //           "Invalid reaction type. Use 'like', 'love', 'laugh', or 'sad'.",
// //       });
// //     }

// //     if (!req.user) {
// //       return res
// //         .status(401)
// //         .json({ message: "User must be logged in to add a reaction" });
// //     }

// //     const userId = typeof req.user === "object" ? req.user._id : req.user;
// //     if (!userId) {
// //       return res.status(400).json({ message: "User ID is required" });
// //     }

// //     const post = await Post.findById(postId);
// //     if (!post) {
// //       return res.status(404).json({ message: "Post not found" });
// //     }

// //     const user = await User.findById(userId);
// //     if (!user) {
// //       return res.status(404).json({ message: "User not found" });
// //     }

// //     post.likes = Array.isArray(post.likes) ? post.likes : [];
// //     post.loves = Array.isArray(post.loves) ? post.loves : [];
// //     post.laughs = Array.isArray(post.laughs) ? post.laughs : [];
// //     post.sads = Array.isArray(post.sads) ? post.sads : [];

// //     const userIdStr = userId.toString();
// //     const hasReacted = {
// //       like: post.likes.some((id) => id && id.toString() === userIdStr),
// //       love: post.loves.some((id) => id && id.toString() === userIdStr),
// //       laugh: post.laughs.some((id) => id && id.toString() === userIdStr),
// //       sad: post.sads.some((id) => id && id.toString() === userIdStr),
// //     };

// //     await Post.updateOne(
// //       { _id: postId },
// //       {
// //         $pull: {
// //           likes: userId,
// //           loves: userId,
// //           laughs: userId,
// //           sads: userId,
// //         },
// //       }
// //     );

// //     if (!hasReacted[type]) {
// //       await Post.updateOne(
// //         { _id: postId },
// //         { $addToSet: { [type + "s"]: userId } }
// //       );

// //       const today = new Date();
// //       const todayStr = today.toISOString().split("T")[0];
// //       let newStreak = user.reactionStreak;
// //       let newRewards = [...(user.streakRewards || [])];

// //       if (!user.lastReaction) {
// //         newStreak = 1;
// //       } else {
// //         const lastReaction = new Date(user.lastReaction);
// //         const lastReactionStr = lastReaction.toISOString().split("T")[0];
// //         const diffDays = Math.floor(
// //           (today - lastReaction) / (1000 * 60 * 60 * 24)
// //         );

// //         if (lastReactionStr !== todayStr) {
// //           if (diffDays === 1) {
// //             newStreak = user.reactionStreak + 1;
// //           } else if (diffDays > 1) {
// //             newStreak = 1;
// //             newRewards = [];
// //           }
// //         }
// //       }

// //       if (newStreak > 0 && newStreak !== user.reactionStreak) {
// //         const dailyReward = `Day ${newStreak} Streak`;
// //         if (!newRewards.includes(dailyReward)) {
// //           newRewards = newRewards.filter(
// //             (reward) => !reward.startsWith("Day ")
// //           );
// //           newRewards.push(dailyReward);
// //         }

// //         if (newStreak % 5 === 0) {
// //           const milestoneReward = `Reaction Streak ${newStreak}`;
// //           if (!newRewards.includes(milestoneReward)) {
// //             newRewards.push(milestoneReward);
// //           }
// //         }
// //       }

// //       user.reactionStreak = newStreak;
// //       user.lastReaction = todayStr;
// //       user.streakRewards = newRewards;
// //       await user.save();
// //     }

// //     const updatedPost = await Post.findById(postId);
// //     res.json({
// //       likes: updatedPost.likes,
// //       loves: updatedPost.loves,
// //       laughs: updatedPost.laughs,
// //       sads: updatedPost.sads,
// //     });
// //   } catch (err) {
// //     console.error("Error in addReaction:", err);
// //     next(err);
// //   }
// // };

// // exports.addComment = async (req, res, next) => {
// //   const { postId } = req.params;
// //   const { text } = req.body;
// //   try {
// //     if (!filterContent(text)) {
// //       return res
// //         .status(400)
// //         .json({ message: "Inappropriate comment detected" });
// //     }

// //     const post = await Post.findById(postId);
// //     if (!post) return res.status(404).json({ message: "Post not found" });

// //     post.comments.push({ text, author: req.user });
// //     await post.save();

// //     const updatedPost = await Post.findById(postId)
// //       .populate("author", "email username")
// //       .populate("comments.author", "email username");
// //     res.json(updatedPost);
// //   } catch (err) {
// //     next(err);
// //   }
// // };

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

//       // Update funMeter, level, and badges
//       user.funMeter += 10; // Award 10 points for a reaction
//       user.level = Math.floor(user.funMeter / 100) + 1; // Level up every 100 points

//       // Award badges based on milestones
//       if (user.funMeter >= 100 && !user.badges.includes("Newbie")) {
//         user.badges.push("Newbie");
//       }
//       if (user.funMeter >= 500 && !user.badges.includes("Gossip Pro")) {
//         user.badges.push("Gossip Pro");
//       }
//       if (user.funMeter >= 1000 && !user.badges.includes("Trendsetter")) {
//         user.badges.push("Trendsetter");
//       }

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

//     const userId = typeof req.user === "object" ? req.user._id : req.user;
//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     post.comments.push({ text, author: userId });
//     await post.save();

//     // Update funMeter, level, and badges
//     user.funMeter += 20; // Award 20 points for a comment
//     user.level = Math.floor(user.funMeter / 100) + 1; // Level up every 100 points

//     // Award badges based on milestones
//     if (user.funMeter >= 100 && !user.badges.includes("Newbie")) {
//       user.badges.push("Newbie");
//     }
//     if (user.funMeter >= 500 && !user.badges.includes("Gossip Pro")) {
//       user.badges.push("Gossip Pro");
//     }
//     if (user.funMeter >= 1000 && !user.badges.includes("Trendsetter")) {
//       user.badges.push("Trendsetter");
//     }
//     await user.save();

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

// exports.updatePost = async (req, res, next) => {
//   const { postId } = req.params;
//   const { title, description, isAnonymous, category } = req.body;
//   const file = req.file;

//   try {
//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     const userId = typeof req.user === "object" ? req.user._id : req.user;
//     if (post.author.toString() !== userId.toString()) {
//       return res
//         .status(403)
//         .json({ message: "Unauthorized to update this post" });
//     }

//     // Validate content
//     if (!filterContent(description) || (title && !filterContent(title))) {
//       return res
//         .status(400)
//         .json({ message: "Inappropriate content detected" });
//     }

//     // Update fields
//     post.title = title || post.title;
//     post.description = description || post.description;
//     post.isAnonymous =
//       isAnonymous !== undefined ? isAnonymous : post.isAnonymous;
//     post.category = category || post.category;
//     post.slug = await generateSlug(title || post.title);

//     // Handle media update
//     let mediaUrl = post.media;
//     if (file) {
//       // Delete old media from S3 if it exists
//       if (post.media) {
//         const oldKey = post.media.split(
//           `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/`
//         )[1];
//         if (oldKey) {
//           try {
//             await s3Client.send(
//               new DeleteObjectCommand({
//                 Bucket: process.env.AWS_S3_BUCKET,
//                 Key: oldKey,
//               })
//             );
//           } catch (deleteError) {
//             console.error(
//               "Error deleting old media from S3:",
//               deleteError.message
//             );
//           }
//         }
//       }

//       // Upload new media
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

//     post.media = mediaUrl;
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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// const mongoose = require("mongoose");
// const Post = require("../models/post");
// const User = require("../models/User");
// const { filterContent } = require("../utils/filters");
// const { generateSlug } = require("../utils/slugGenerator");
// const {
//   S3Client,
//   PutObjectCommand,
//   DeleteObjectCommand,
// } = require("@aws-sdk/client-s3");
// const fs = require("fs");

// const s3Client = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// exports.createPost = async (req, res, next) => {
//   const { title, description, isAnonymous, category, hashtags } = req.body;
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
//         try {
//           if (file.path) fs.unlinkSync(file.path);
//         } catch (fsError) {
//           console.error("Error deleting temporary file:", fsError.message);
//         }
//       }
//     }

//     // Process hashtags
//     let hashtagArray = [];
//     if (hashtags && typeof hashtags === "string" && hashtags.trim()) {
//       hashtagArray = hashtags
//         .split(",")
//         .map((tag) => tag.trim().toLowerCase().replace(/^#/, ""))
//         .filter((tag) => tag && !/[^a-z0-9]/.test(tag) && tag.length <= 50)
//         .slice(0, 10); // Limit to 10 hashtags, max length 50
//     }

//     const post = new Post({
//       title,
//       description,
//       slug,
//       author: req.user,
//       isAnonymous,
//       category,
//       media: mediaUrl,
//       hashtags: hashtagArray,
//     });
//     await post.save();

//     // Update user's funMeter and level
//     const userId = typeof req.user === "object" ? req.user._id : req.user;
//     const user = await User.findById(userId);
//     if (user) {
//       user.funMeter += 50;
//       user.level = Math.floor(user.funMeter / 100) + 1;
//       if (user.funMeter >= 100 && !user.badges.includes("Newbie")) {
//         user.badges.push("Newbie");
//       }
//       if (user.funMeter >= 500 && !user.badges.includes("Gossip Pro")) {
//         user.badges.push("Gossip Pro");
//       }
//       await user.save();
//     }

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
//     const { hashtag } = req.query;
//     const query = { isFlagged: false };

//     if (hashtag) {
//       query.hashtags = hashtag.toLowerCase();
//     }

//     const posts = await Post.find(query)
//       .populate("author", "email username")
//       .populate("comments.author", "email username")
//       .sort({ createdAt: -1 });
//     res.json(posts);
//   } catch (err) {
//     next(err);
//   }
// };

// exports.getPostById = async (req, res, next) => {
//   const { postId } = req.params;
//   try {
//     // Validate postId
//     if (!mongoose.isValidObjectId(postId)) {
//       return res.status(400).json({ message: "Invalid post ID" });
//     }

//     const post = await Post.findById(postId)
//       .populate("author", "email username")
//       .populate("comments.author", "email username");

//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     const userId = typeof req.user === "object" ? req.user._id : req.user;
//     if (
//       post.isFlagged &&
//       (!userId || post.author.toString() !== userId.toString())
//     ) {
//       return res
//         .status(403)
//         .json({ message: "Post is flagged and cannot be accessed" });
//     }

//     res.json(post);
//   } catch (err) {
//     console.error("Error in getPostById:", err);
//     next(err);
//   }
// };

// exports.getPostsByHashtag = async (req, res, next) => {
//   const { hashtag } = req.params;
//   try {
//     const posts = await Post.find({
//       hashtags: hashtag.toLowerCase(),
//       isFlagged: false,
//     })
//       .populate("author", "email username")
//       .populate("comments.author", "email username")
//       .sort({ createdAt: -1 });

//     res.json(posts);
//   } catch (err) {
//     console.error("Error in getPostsByHashtag:", err);
//     next(err);
//   }
// };

// exports.getHashtags = async (req, res, next) => {
//   try {
//     const hashtags = await Post.distinct("hashtags");
//     res.json(hashtags.filter((tag) => tag && tag.trim() !== ""));
//   } catch (err) {
//     console.error("Error in getHashtags:", err);
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

//       user.funMeter += 10;
//       user.level = Math.floor(user.funMeter / 100) + 1;

//       if (user.funMeter >= 100 && !user.badges.includes("Newbie")) {
//         user.badges.push("Newbie");
//       }
//       if (user.funMeter >= 500 && !user.badges.includes("Gossip Pro")) {
//         user.badges.push("Gossip Pro");
//       }
//       if (user.funMeter >= 1000 && !user.badges.includes("Trendsetter")) {
//         user.badges.push("Trendsetter");
//       }

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

//     const userId = typeof req.user === "object" ? req.user._id : req.user;
//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     post.comments.push({ text, author: userId });
//     await post.save();

//     user.funMeter += 20;
//     user.level = Math.floor(user.funMeter / 100) + 1;

//     if (user.funMeter >= 100 && !user.badges.includes("Newbie")) {
//       user.badges.push("Newbie");
//     }
//     if (user.funMeter >= 500 && !user.badges.includes("Gossip Pro")) {
//       user.badges.push("Gossip Pro");
//     }
//     if (user.funMeter >= 1000 && !user.badges.includes("Trendsetter")) {
//       user.badges.push("Trendsetter");
//     }
//     await user.save();

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

// exports.updatePost = async (req, res, next) => {
//   const { postId } = req.params;
//   const { title, description, isAnonymous, category, hashtags } = req.body;
//   const file = req.file;

//   try {
//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     const userId = typeof req.user === "object" ? req.user._id : req.user;
//     if (post.author.toString() !== userId.toString()) {
//       return res
//         .status(403)
//         .json({ message: "Unauthorized to update this post" });
//     }

//     // Validate content
//     if (!filterContent(description) || (title && !filterContent(title))) {
//       return res
//         .status(400)
//         .json({ message: "Inappropriate content detected" });
//     }

//     // Update fields
//     post.title = title || post.title;
//     post.description = description || post.description;
//     post.isAnonymous =
//       isAnonymous !== undefined ? isAnonymous : post.isAnonymous;
//     post.category = category || post.category;
//     post.slug = await generateSlug(title || post.title);

//     // Process hashtags
//     if (hashtags && typeof hashtags === "string" && hashtags.trim()) {
//       post.hashtags = hashtags
//         .split(",")
//         .map((tag) => tag.trim().toLowerCase().replace(/^#/, ""))
//         .filter((tag) => tag && !/[^a-z0-9]/.test(tag) && tag.length <= 50)
//         .slice(0, 10); // Limit to 10 hashtags, max length 50
//     } else {
//       post.hashtags = post.hashtags || []; // Preserve existing hashtags if none provided
//     }

//     // Handle media update
//     let mediaUrl = post.media;
//     if (file) {
//       if (post.media) {
//         const oldKey = post.media.split(
//           `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/`
//         )[1];
//         if (oldKey) {
//           try {
//             await s3Client.send(
//               new DeleteObjectCommand({
//                 Bucket: process.env.AWS_S3_BUCKET,
//                 Key: oldKey,
//               })
//             );
//           } catch (deleteError) {
//             console.error(
//               "Error deleting old media from S3:",
//               deleteError.message
//             );
//           }
//         }
//       }

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
//         try {
//           if (file.path) {
//             fs.unlinkSync(file.path);
//           }
//         } catch (fsError) {
//           console.error("Error deleting temporary file:", fsError.message);
//         }
//       }
//     }

//     post.media = mediaUrl;
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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const mongoose = require("mongoose");
const Post = require("../models/Post");
const User = require("../models/User");
const { filterContent } = require("../utils/filters");
const { generateSlug } = require("../utils/slugGenerator");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const fs = require("fs");

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ================= Create Post =================
exports.createPost = async (req, res, next) => {
  const { title, description, isAnonymous, category, hashtags } = req.body;
  const file = req.file;
  try {
    if (!filterContent(description) || (title && !filterContent(title))) {
      return res
        .status(400)
        .json({ message: "Inappropriate content detected" });
    }

    const slug = await generateSlug(title);
    let mediaUrl = null;

    if (file) {
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

    let hashtagArray = [];
    if (hashtags && typeof hashtags === "string" && hashtags.trim()) {
      hashtagArray = hashtags
        .split(",")
        .map((tag) => tag.trim().toLowerCase().replace(/^#/, ""))
        .filter((tag) => tag && !/[^a-z0-9]/.test(tag) && tag.length <= 50)
        .slice(0, 10);
    }

    const post = new Post({
      title,
      description,
      slug,
      author: req.user,
      isAnonymous,
      category,
      media: mediaUrl,
      hashtags: hashtagArray,
    });
    await post.save();

    const userId = typeof req.user === "object" ? req.user._id : req.user;
    const user = await User.findById(userId);
    if (user) {
      user.funMeter += 50;
      user.level = Math.floor(user.funMeter / 100) + 1;
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
      "username"
    );
    res.json(populatedPost);
  } catch (err) {
    next(err);
  }
};

// ================= Get All Posts (Optimized) =================
// exports.getPosts = async (req, res, next) => {
//   try {
//     const { hashtag, page = 1, limit = 5 } = req.query;
//     const query = { isFlagged: false };

//     if (hashtag) {
//       query.hashtags = hashtag.toLowerCase();
//     }

//     // ✅ Fetch only required fields
//     const posts = await Post.find(query)
//       .select("title slug description media author category hashtags createdAt")
//       .populate("author", "username") // only username
//       .sort({ createdAt: -1 })
//       .skip((page - 1) * limit)
//       .limit(Number(limit))
//       .lean();

//     const totalPosts = await Post.countDocuments(query);

//     res.json({
//       total: totalPosts,
//       page: Number(page),
//       limit: Number(limit),
//       totalPages: Math.ceil(totalPosts / limit),
//       posts,
//     });
//   } catch (err) {
//     console.error("Error in getPosts:", err);
//     next(err);
//   }
// };

// // ================= Get Posts by Hashtag (Optimized) =================
// exports.getPostsByHashtag = async (req, res, next) => {
//   const { hashtag } = req.params;
//   const { page = 1, limit = 5 } = req.query;

//   try {
//     const query = {
//       hashtags: hashtag.toLowerCase(),
//       isFlagged: false,
//     };

//     const posts = await Post.find(query)
//       .select("title slug description media author category hashtags createdAt")
//       .populate("author", "username")
//       .sort({ createdAt: -1 })
//       .skip((page - 1) * limit)
//       .limit(Number(limit))
//       .lean();

//     const totalPosts = await Post.countDocuments(query);

//     res.json({
//       total: totalPosts,
//       page: Number(page),
//       limit: Number(limit),
//       totalPages: Math.ceil(totalPosts / limit),
//       posts,
//     });
//   } catch (err) {
//     console.error("Error in getPostsByHashtag:", err);
//     next(err);
//   }
// };

// ================= Get All Posts (Optimized with Search) =================
exports.getPosts = async (req, res, next) => {
  try {
    const { hashtag, search, page = 1, limit = 5 } = req.query;
    const query = { isFlagged: false };

    // 🔹 Hashtag filter
    if (hashtag) {
      query.hashtags = hashtag.toLowerCase();
    }

    // 🔹 Search filter (title, description, category lo match)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { hashtags: { $regex: search, $options: "i" } },
      ];
    }

    // ✅ Fetch only required fields
    const posts = await Post.find(query)
      .select("title slug description media author category hashtags createdAt likes loves laughs sads comments")
      .populate("author", "username") // only username
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const totalPosts = await Post.countDocuments(query);

    res.json({
      total: totalPosts,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalPosts / limit),
      posts,
    });
  } catch (err) {
    console.error("Error in getPosts:", err);
    next(err);
  }
};

// ================= Get Posts by Category (New Route) =================
exports.getPostsByCategory = async (req, res, next) => {
  const { category } = req.params;
  const { search, page = 1, limit = 5 } = req.query;

  try {
    const query = {
      category: { $regex: category, $options: "i" },
      isFlagged: false,
    };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { hashtags: { $regex: search, $options: "i" } },
      ];
    }

    const posts = await Post.find(query)
      .select("title slug description media author category hashtags createdAt likes loves laughs sads comments")
      .populate("author", "username")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const totalPosts = await Post.countDocuments(query);

    res.json({
      total: totalPosts,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalPosts / limit),
      posts,
    });
  } catch (err) {
    console.error("Error in getPostsByCategory:", err);
    next(err);
  }
};

// ================= Get Posts by Hashtag (Optimized) =================
exports.getPostsByHashtag = async (req, res, next) => {
  const { hashtag } = req.params;
  const { search, page = 1, limit = 5 } = req.query;

  try {
    const query = {
      hashtags: hashtag.toLowerCase(),
      isFlagged: false,
    };

    // 🔹 Search filter inside hashtag route also
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const posts = await Post.find(query)
      .select("title slug description media author category hashtags createdAt likes loves laughs sads comments")
      .populate("author", "username")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const totalPosts = await Post.countDocuments(query);

    res.json({
      total: totalPosts,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalPosts / limit),
      posts,
    });
  } catch (err) {
    console.error("Error in getPostsByHashtag:", err);
    next(err);
  }
};

// ================= Get Single Post by ID or Slug =================
exports.getPostById = async (req, res, next) => {
  const { postId } = req.params;
  try {
    let post;
    const mongoose = require("mongoose");

    // Check if postId is a valid ObjectId
    if (mongoose.isValidObjectId(postId)) {
      post = await Post.findById(postId)
        .populate("author", "username")
        .populate("comments.author", "username")
        .lean();
    }

    // If not found by ID or not a valid ObjectId, try finding by slug
    if (!post) {
      post = await Post.findOne({ slug: postId })
        .populate("author", "username")
        .populate("comments.author", "username")
        .lean();
    }

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

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

// ================= Get Posts by Hashtag (Optimized) =================
// exports.getPostsByHashtag = async (req, res, next) => {
//   const { hashtag } = req.params;
//   const { page = 1, limit = 10 } = req.query;
//   try {
//     const query = {
//       hashtags: hashtag.toLowerCase(),
//       isFlagged: false,
//     };

//     const posts = await Post.find(query)
//       .populate("author", "username")
//       .populate("comments.author", "username")
//       .sort({ createdAt: -1 })
//       .skip((page - 1) * limit)
//       .limit(Number(limit))
//       .lean();

//     const totalPosts = await Post.countDocuments(query);

//     res.json({
//       total: totalPosts,
//       page: Number(page),
//       limit: Number(limit),
//       totalPages: Math.ceil(totalPosts / limit),
//       posts,
//     });
//   } catch (err) {
//     console.error("Error in getPostsByHashtag:", err);
//     next(err);
//   }
// };

// ================= Get Hashtags =================
exports.getHashtags = async (req, res, next) => {
  try {
    const hashtags = await Post.distinct("hashtags");
    res.json(hashtags.filter((tag) => tag && tag.trim() !== ""));
  } catch (err) {
    console.error("Error in getHashtags:", err);
    next(err);
  }
};

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

    const mongoose = require("mongoose");
    let post;
    if (mongoose.isValidObjectId(postId)) {
      post = await Post.findById(postId);
    } else {
      post = await Post.findOne({ slug: postId });
    }

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Use the actual object ID for updates
    const actualPostId = post._id;

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
      { _id: actualPostId },
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
        { _id: actualPostId },
        { $addToSet: { [type + "s"]: userId } }
      );

      user.funMeter += 10;
      user.level = Math.floor(user.funMeter / 100) + 1;

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

    const updatedPost = await Post.findById(actualPostId);
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

    const mongoose = require("mongoose");
    let post;
    if (mongoose.isValidObjectId(postId)) {
      post = await Post.findById(postId);
    } else {
      post = await Post.findOne({ slug: postId });
    }

    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = typeof req.user === "object" ? req.user._id : req.user;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    post.comments.push({ text, author: userId });
    await post.save();

    user.funMeter += 20;
    user.level = Math.floor(user.funMeter / 100) + 1;

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

    const updatedPost = await Post.findById(post._id)
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
  const { title, description, isAnonymous, category, hashtags } = req.body;
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

    // Process hashtags
    if (hashtags && typeof hashtags === "string" && hashtags.trim()) {
      post.hashtags = hashtags
        .split(",")
        .map((tag) => tag.trim().toLowerCase().replace(/^#/, ""))
        .filter((tag) => tag && !/[^a-z0-9]/.test(tag) && tag.length <= 50)
        .slice(0, 10); // Limit to 10 hashtags, max length 50
    } else {
      post.hashtags = post.hashtags || []; // Preserve existing hashtags if none provided
    }

    // Handle media update
    let mediaUrl = post.media;
    if (file) {
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
