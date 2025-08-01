// const User = require("../models/User");
// const jwt = require("jsonwebtoken");

// exports.getProfile = async (req, res, next) => {
//   try {
//     const user = await User.findById(req.user.userId).select("-password");
//     if (!user) return res.status(404).json({ message: "User not found" });
//     res.json(user);
//   } catch (err) {
//     next(err);
//   }
// };

// exports.updateProfile = async (req, res, next) => {
//   try {
//     const updates = {};
//     if (req.body.username) updates.username = req.body.username;
//     if (req.body.bio) updates.bio = req.body.bio;
//     if (req.file) updates.profilePicture = `/uploads/${req.file.filename}`;

//     const user = await User.findByIdAndUpdate(
//       req.user.userId,
//       { $set: updates },
//       { new: true, runValidators: true }
//     ).select("-password");

//     if (!user) return res.status(404).json({ message: "User not found" });
//     res.json(user);
//   } catch (err) {
//     next(err);
//   }
// };

///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////

// const User = require("../models/User");
// const jwt = require("jsonwebtoken");

// exports.getProfile = async (req, res, next) => {
//   try {
//     const user = await User.findById(req.user.userId).select("-password");
//     if (!user) return res.status(404).json({ message: "User not found" });

//     // Streak logic
//     const today = new Date();
//     const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
//     let newStreak = user.streak;
//     let newRewards = [...(user.streakRewards || [])];

//     if (!user.lastLogin) {
//       // First login
//       newStreak = 1;
//     } else {
//       const lastLogin = new Date(user.lastLogin);
//       const lastLoginStr = lastLogin.toISOString().split("T")[0];
//       const diffDays = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));

//       if (lastLoginStr !== todayStr) {
//         if (diffDays === 1) {
//           // Consecutive day login
//           newStreak = user.streak + 1;
//         } else if (diffDays > 1) {
//           // Missed days: decrease streak by the number of days missed
//           newStreak = Math.max(0, user.streak - diffDays);
//           if (newStreak === 0) {
//             newRewards = []; // Reset rewards if streak reaches 0
//           }
//           // Increment streak by 1 since the user logged in today
//           newStreak = newStreak > 0 ? newStreak + 1 : 1;
//         }
//       }
//     }

//     // Daily streak and weekly milestone logic
//     if (newStreak > 0) {
//       const dailyReward = `Day ${newStreak} Streak`;
//       // Add daily streak reward if streak increased or changed
//       if (!newRewards.includes(dailyReward) && newStreak !== user.streak) {
//         // Remove the previous daily streak reward to keep only the latest
//         newRewards = newRewards.filter((reward) => !reward.startsWith("Day "));
//         newRewards.push(dailyReward);
//       }

//       // Check for weekly milestones (every 7 days)
//       if (newStreak % 7 === 0 && newStreak !== user.streak) {
//         const weekNumber = newStreak / 7;
//         const milestoneReward = `Week ${weekNumber} Milestone`;
//         if (!newRewards.includes(milestoneReward)) {
//           newRewards.push(milestoneReward);
//         }
//       }
//     }

//     // Update user with new streak and rewards
//     user.streak = newStreak;
//     user.lastLogin = todayStr;
//     user.streakRewards = newRewards;
//     await user.save();

//     res.json(user);
//   } catch (err) {
//     next(err);
//   }
// };

// exports.updateProfile = async (req, res, next) => {
//   try {
//     const updates = {};
//     if (req.body.username) updates.username = req.body.username;
//     if (req.body.bio) updates.bio = req.body.bio;
//     if (req.file) updates.profilePicture = `/uploads/${req.file.filename}`;
//     if (req.body.streak !== undefined) updates.streak = req.body.streak;
//     if (req.body.lastLogin) updates.lastLogin = req.body.lastLogin;
//     if (req.body.streakRewards) updates.streakRewards = req.body.streakRewards;

//     const user = await User.findByIdAndUpdate(
//       req.user.userId,
//       { $set: updates },
//       { new: true, runValidators: true }
//     ).select("-password");

//     if (!user) return res.status(404).json({ message: "User not found" });
//     res.json(user);
//   } catch (err) {
//     next(err);
//   }
// };

///////////////////////////////////////////////////
/////////////////////////////////////
////////////////////////////

// const User = require("../models/User");
// const jwt = require("jsonwebtoken");

// // Get user profile (updated to include followers and following counts)
// exports.getProfile = async (req, res, next) => {
//   try {
//     const user = await User.findById(req.user.userId).select("-password");
//     if (!user) return res.status(404).json({ message: "User not found" });

//     // Streak logic
//     const today = new Date();
//     const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
//     let newStreak = user.streak;
//     let newRewards = [...(user.streakRewards || [])];

//     if (!user.lastLogin) {
//       // First login
//       newStreak = 1;
//     } else {
//       const lastLogin = new Date(user.lastLogin);
//       const lastLoginStr = lastLogin.toISOString().split("T")[0];
//       const diffDays = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));

//       if (lastLoginStr !== todayStr) {
//         if (diffDays === 1) {
//           // Consecutive day login
//           newStreak = user.streak + 1;
//         } else if (diffDays > 1) {
//           // Missed days: decrease streak by the number of days missed
//           newStreak = Math.max(0, user.streak - diffDays);
//           if (newStreak === 0) {
//             newRewards = []; // Reset rewards if streak reaches 0
//           }
//           // Increment streak by 1 since the user logged in today
//           newStreak = newStreak > 0 ? newStreak + 1 : 1;
//         }
//       }
//     }

//     // Daily streak and weekly milestone logic
//     if (newStreak > 0) {
//       const dailyReward = `Day ${newStreak} Streak`;
//       // Add daily streak reward if streak increased or changed
//       if (!newRewards.includes(dailyReward) && newStreak !== user.streak) {
//         // Remove the previous daily streak reward to keep only the latest
//         newRewards = newRewards.filter((reward) => !reward.startsWith("Day "));
//         newRewards.push(dailyReward);
//       }

//       // Check for weekly milestones (every 7 days)
//       if (newStreak % 7 === 0 && newStreak !== user.streak) {
//         const weekNumber = newStreak / 7;
//         const milestoneReward = `Week ${weekNumber} Milestone`;
//         if (!newRewards.includes(milestoneReward)) {
//           newRewards.push(milestoneReward);
//         }
//       }
//     }

//     // Update user with new streak and rewards
//     user.streak = newStreak;
//     user.lastLogin = todayStr;
//     user.streakRewards = newRewards;
//     await user.save();

//     // Include followers and following counts in the response
//     res.json({
//       ...user._doc,
//       followersCount: user.followers.length,
//       followingCount: user.following.length,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// // Update user profile (unchanged)
// exports.updateProfile = async (req, res, next) => {
//   try {
//     const updates = {};
//     if (req.body.username) updates.username = req.body.username;
//     if (req.body.bio) updates.bio = req.body.bio;
//     if (req.file) updates.profilePicture = `/uploads/${req.file.filename}`;
//     if (req.body.streak !== undefined) updates.streak = req.body.streak;
//     if (req.body.lastLogin) updates.lastLogin = req.body.lastLogin;
//     if (req.body.streakRewards) updates.streakRewards = req.body.streakRewards;

//     const user = await User.findByIdAndUpdate(
//       req.user.userId,
//       { $set: updates },
//       { new: true, runValidators: true }
//     ).select("-password");

//     if (!user) return res.status(404).json({ message: "User not found" });
//     res.json(user);
//   } catch (err) {
//     next(err);
//   }
// };

// // Get user's followers
// exports.getFollowers = async (req, res, next) => {
//   try {
//     const user = await User.findById(req.params.id)
//       .populate("followers", "username profilePicture")
//       .select("followers");
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     res.json(user.followers);
//   } catch (err) {
//     next(err);
//   }
// };

// // Get user's following
// exports.getFollowing = async (req, res, next) => {
//   try {
//     const user = await User.findById(req.params.id)
//       .populate("following", "username profilePicture")
//       .select("following");
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     res.json(user.following);
//   } catch (err) {
//     next(err);
//   }
// };

// // Follow a user
// exports.followUser = async (req, res, next) => {
//   try {
//     const userToFollow = await User.findById(req.params.id);
//     const currentUser = await User.findById(req.user.userId);

//     if (!userToFollow || !currentUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     if (userToFollow._id.equals(currentUser._id)) {
//       return res.status(400).json({ message: "You cannot follow yourself" });
//     }

//     if (currentUser.following.includes(userToFollow._id)) {
//       return res.status(400).json({ message: "You already follow this user" });
//     }

//     currentUser.following.push(userToFollow._id);
//     userToFollow.followers.push(currentUser._id);

//     await currentUser.save();
//     await userToFollow.save();

//     res.json({ message: "User followed successfully" });
//   } catch (err) {
//     next(err);
//   }
// };

// // Unfollow a user
// exports.unfollowUser = async (req, res, next) => {
//   try {
//     const userToUnfollow = await User.findById(req.params.id);
//     const currentUser = await User.findById(req.user.userId);

//     if (!userToUnfollow || !currentUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     if (!currentUser.following.includes(userToUnfollow._id)) {
//       return res.status(400).json({ message: "You do not follow this user" });
//     }

//     currentUser.following = currentUser.following.filter(
//       (id) => !id.equals(userToUnfollow._id)
//     );
//     userToUnfollow.followers = userToUnfollow.followers.filter(
//       (id) => !id.equals(currentUser._id)
//     );

//     await currentUser.save();
//     await userToUnfollow.save();

//     res.json({ message: "User unfollowed successfully" });
//   } catch (err) {
//     next(err);
//   }
// };

// // Get public user profile by ID (new controller for PublicUserProfile.jsx)
// exports.getPublicUserProfile = async (req, res, next) => {
//   try {
//     const user = await User.findById(req.params.id)
//       .select("-password")
//       .populate("followers", "username profilePicture")
//       .populate("following", "username profilePicture");
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     res.json({
//       ...user._doc,
//       followersCount: user.followers.length,
//       followingCount: user.following.length,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

/////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////

// const User = require("../models/User");
// const jwt = require("jsonwebtoken");
// const cloudinary = require("cloudinary").v2;

// // Get user profile
// exports.getProfile = async (req, res, next) => {
//   try {
//     const user = await User.findById(req.user.userId).select("-password");
//     if (!user) return res.status(404).json({ message: "User not found" });

//     // Streak logic
//     const today = new Date();
//     const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
//     let newStreak = user.streak;
//     let newRewards = [...(user.streakRewards || [])];

//     if (!user.lastLogin) {
//       newStreak = 1;
//     } else {
//       const lastLogin = new Date(user.lastLogin);
//       const lastLoginStr = lastLogin.toISOString().split("T")[0];
//       const diffDays = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));

//       if (lastLoginStr !== todayStr) {
//         if (diffDays === 1) {
//           newStreak = user.streak + 1;
//         } else if (diffDays > 1) {
//           newStreak = Math.max(0, user.streak - diffDays);
//           if (newStreak === 0) {
//             newRewards = [];
//           }
//           newStreak = newStreak > 0 ? newStreak + 1 : 1;
//         }
//       }
//     }

//     if (newStreak > 0) {
//       const dailyReward = `Day ${newStreak} Streak`;
//       if (!newRewards.includes(dailyReward) && newStreak !== user.streak) {
//         newRewards = newRewards.filter((reward) => !reward.startsWith("Day "));
//         newRewards.push(dailyReward);
//       }

//       if (newStreak % 7 === 0 && newStreak !== user.streak) {
//         const weekNumber = newStreak / 7;
//         const milestoneReward = `Week ${weekNumber} Milestone`;
//         if (!newRewards.includes(milestoneReward)) {
//           newRewards.push(milestoneReward);
//         }
//       }
//     }

//     user.streak = newStreak;
//     user.lastLogin = todayStr;
//     user.streakRewards = newRewards;
//     await user.save();

//     res.json({
//       ...user._doc,
//       followersCount: user.followers.length,
//       followingCount: user.following.length,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// // Update user profile
// exports.updateProfile = async (req, res, next) => {
//   try {
//     const updates = {};
//     if (req.body.username) updates.username = req.body.username;
//     if (req.body.bio) updates.bio = req.body.bio;
//     if (req.body.streak !== undefined) updates.streak = req.body.streak;
//     if (req.body.lastLogin) updates.lastLogin = req.body.lastLogin;
//     if (req.body.streakRewards) updates.streakRewards = req.body.streakRewards;

//     // Handle Cloudinary upload if a file is provided
//     if (req.file) {
//       // Since we're using multer.memoryStorage(), we need to convert the buffer to a base64 string
//       const fileBuffer = req.file.buffer;
//       const base64String = fileBuffer.toString("base64");
//       const fileUri = `data:${req.file.mimetype};base64,${base64String}`;

//       let mediaUrl = "";
//       try {
//         const result = await cloudinary.uploader.upload(fileUri, {
//           folder: "gossiphub/profile_pictures", // Organize files in a folder in Cloudinary
//           width: 150,
//           height: 150,
//           crop: "fill",
//         });
//         mediaUrl = result.secure_url; // Store the Cloudinary URL
//         updates.profilePicture = mediaUrl;
//       } catch (uploadError) {
//         return res.status(500).json({
//           message: "Failed to upload image to Cloudinary",
//           error: uploadError.message,
//         });
//       }
//     }

//     const user = await User.findByIdAndUpdate(
//       req.user.userId,
//       { $set: updates },
//       { new: true, runValidators: true }
//     ).select("-password");

//     if (!user) return res.status(404).json({ message: "User not found" });
//     res.json(user);
//   } catch (err) {
//     next(err);
//   }
// };

// // Get user's followers
// exports.getFollowers = async (req, res, next) => {
//   try {
//     const user = await User.findById(req.params.id)
//       .populate("followers", "username profilePicture")
//       .select("followers");
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     res.json(user.followers);
//   } catch (err) {
//     next(err);
//   }
// };

// // Get user's following
// exports.getFollowing = async (req, res, next) => {
//   try {
//     const user = await User.findById(req.params.id)
//       .populate("following", "username profilePicture")
//       .select("following");
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     res.json(user.following);
//   } catch (err) {
//     next(err);
//   }
// };

// // Follow a user
// exports.followUser = async (req, res, next) => {
//   try {
//     const userToFollow = await User.findById(req.params.id);
//     const currentUser = await User.findById(req.user.userId);

//     if (!userToFollow || !currentUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     if (userToFollow._id.equals(currentUser._id)) {
//       return res.status(400).json({ message: "You cannot follow yourself" });
//     }

//     if (currentUser.following.includes(userToFollow._id)) {
//       return res.status(400).json({ message: "You already follow this user" });
//     }

//     currentUser.following.push(userToFollow._id);
//     userToFollow.followers.push(currentUser._id);

//     await currentUser.save();
//     await userToFollow.save();

//     res.json({ message: "User followed successfully" });
//   } catch (err) {
//     next(err);
//   }
// };

// // Unfollow a user
// exports.unfollowUser = async (req, res, next) => {
//   try {
//     const userToUnfollow = await User.findById(req.params.id);
//     const currentUser = await User.findById(req.user.userId);

//     if (!userToUnfollow || !currentUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     if (!currentUser.following.includes(userToUnfollow._id)) {
//       return res.status(400).json({ message: "You do not follow this user" });
//     }

//     currentUser.following = currentUser.following.filter(
//       (id) => !id.equals(userToUnfollow._id)
//     );
//     userToUnfollow.followers = userToUnfollow.followers.filter(
//       (id) => !id.equals(currentUser._id)
//     );

//     await currentUser.save();
//     await userToUnfollow.save();

//     res.json({ message: "User unfollowed successfully" });
//   } catch (err) {
//     next(err);
//   }
// };

// // Get public user profile by ID
// exports.getPublicUserProfile = async (req, res, next) => {
//   try {
//     const user = await User.findById(req.params.id)
//       .select("-password")
//       .populate("followers", "username profilePicture")
//       .populate("following", "username profilePicture");
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     res.json({
//       ...user._doc,
//       followersCount: user.followers.length,
//       followingCount: user.following.length,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

//Today's update 13-05-2025

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// const User = require("../models/User");
// const jwt = require("jsonwebtoken");
// const cloudinary = require("cloudinary").v2;

// // Get user profile
// exports.getProfile = async (req, res, next) => {
//   try {
//     const user = await User.findById(req.user.userId).select("-password");
//     if (!user) return res.status(404).json({ message: "User not found" });

//     res.json({
//       ...user._doc,
//       followersCount: user.followers.length,
//       followingCount: user.following.length,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// // Update user profile
// exports.updateProfile = async (req, res, next) => {
//   try {
//     const updates = {};
//     if (req.body.username) updates.username = req.body.username;
//     if (req.body.bio) updates.bio = req.body.bio;
//     if (req.body.reactionStreak !== undefined)
//       updates.reactionStreak = req.body.reactionStreak;
//     if (req.body.lastReaction) updates.lastReaction = req.body.lastReaction;
//     if (req.body.streakRewards) updates.streakRewards = req.body.streakRewards;

//     if (req.file) {
//       const fileBuffer = req.file.buffer;
//       const base64String = fileBuffer.toString("base64");
//       const fileUri = `data:${req.file.mimetype};base64,${base64String}`;

//       let mediaUrl = "";
//       try {
//         const result = await cloudinary.uploader.upload(fileUri, {
//           folder: "gossiphub/profile_pictures",
//           width: 150,
//           height: 150,
//           crop: "fill",
//         });
//         mediaUrl = result.secure_url;
//         updates.profilePicture = mediaUrl;
//       } catch (uploadError) {
//         return res.status(500).json({
//           message: "Failed to upload image to Cloudinary",
//           error: uploadError.message,
//         });
//       }
//     }

//     const user = await User.findByIdAndUpdate(
//       req.user.userId,
//       { $set: updates },
//       { new: true, runValidators: true }
//     ).select("-password");

//     if (!user) return res.status(404).json({ message: "User not found" });
//     res.json(user);
//   } catch (err) {
//     next(err);
//   }
// };

// // Get user's followers
// exports.getFollowers = async (req, res, next) => {
//   try {
//     const user = await User.findById(req.params.id)
//       .populate("followers", "username profilePicture")
//       .select("followers");
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     res.json(user.followers);
//   } catch (err) {
//     next(err);
//   }
// };

// // Get user's following
// exports.getFollowing = async (req, res, next) => {
//   try {
//     const user = await User.findById(req.params.id)
//       .populate("following", "username profilePicture")
//       .select("following");
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     res.json(user.following);
//   } catch (err) {
//     next(err);
//   }
// };

// // Follow a user
// exports.followUser = async (req, res, next) => {
//   try {
//     const userToFollow = await User.findById(req.params.id);
//     const currentUser = await User.findById(req.user.userId);

//     if (!userToFollow || !currentUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     if (userToFollow._id.equals(currentUser._id)) {
//       return res.status(400).json({ message: "You cannot follow yourself" });
//     }

//     if (currentUser.following.includes(userToFollow._id)) {
//       return res.status(400).json({ message: "You already follow this user" });
//     }

//     currentUser.following.push(userToFollow._id);
//     userToFollow.followers.push(currentUser._id);

//     await currentUser.save();
//     await userToFollow.save();

//     res.json({ message: "User followed successfully" });
//   } catch (err) {
//     next(err);
//   }
// };

// // Unfollow a user
// exports.unfollowUser = async (req, res, next) => {
//   try {
//     const userToUnfollow = await User.findById(req.params.id);
//     const currentUser = await User.findById(req.user.userId);

//     if (!userToUnfollow || !currentUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     if (!currentUser.following.includes(userToUnfollow._id)) {
//       return res.status(400).json({ message: "You do not follow this user" });
//     }

//     currentUser.following = currentUser.following.filter(
//       (id) => !id.equals(userToUnfollow._id)
//     );
//     userToUnfollow.followers = userToUnfollow.followers.filter(
//       (id) => !id.equals(currentUser._id)
//     );

//     await currentUser.save();
//     await userToUnfollow.save();

//     res.json({ message: "User unfollowed successfully" });
//   } catch (err) {
//     next(err);
//   }
// };

// // Get public user profile by ID
// exports.getPublicUserProfile = async (req, res, next) => {
//   try {
//     const user = await User.findById(req.params.id)
//       .select("-password")
//       .populate("followers", "username profilePicture")
//       .populate("following", "username profilePicture");
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     res.json({
//       ...user._doc,
//       followersCount: user.followers.length,
//       followingCount: user.following.length,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// // New function to get all users (for suggested users)
// exports.getUsers = async (req, res, next) => {
//   try {
//     const users = await User.find()
//       .select("_id username profilePicture followers")
//       .lean(); // Use lean() for better performance (returns plain JS object)

//     // Map users to include followersCount
//     const usersWithCounts = users.map((user) => ({
//       ...user,
//       followersCount: user.followers.length,
//     }));

//     res.json(usersWithCounts);
//   } catch (err) {
//     next(err);
//   }
// };

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////vps lo deploy cheyalsina code:

const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Get user profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      ...user._doc,
      followersCount: user.followers.length,
      followingCount: user.following.length,
    });
  } catch (err) {
    next(err);
  }
};

// Update user profile
// exports.updateProfile = async (req, res, next) => {
//   try {
//     const updates = {};
//     if (req.body.username) updates.username = req.body.username;
//     if (req.body.bio) updates.bio = req.body.bio;
//     if (req.body.reactionStreak !== undefined)
//       updates.reactionStreak = req.body.reactionStreak;
//     if (req.body.lastReaction) updates.lastReaction = req.body.lastReaction;
//     if (req.body.streakRewards) updates.streakRewards = req.body.streakRewards;

//     if (req.file) {
//       const fileName = `gossiphub/profile_pictures/original/${Date.now()}-${
//         req.file.originalname
//       }`;
//       try {
//         const params = {
//           Bucket: process.env.AWS_S3_BUCKET,
//           Key: fileName,
//           Body: req.file.buffer,
//           ContentType: req.file.mimetype,
//         };
//         const command = new PutObjectCommand(params);
//         await s3Client.send(command);
//         // The resized image URL will be generated by Lambda and stored in the User model
//         updates.profilePicture = `https://${process.env.AWS_S3_BUCKET}.s3.${
//           process.env.AWS_REGION
//         }.amazonaws.com/gossiphub/profile_pictures/resized/${Date.now()}-${
//           req.file.originalname
//         }`;
//       } catch (uploadError) {
//         return res.status(500).json({
//           message: "Failed to upload image to S3",
//           error: uploadError.message,
//         });
//       }
//     }

//     const user = await User.findByIdAndUpdate(
//       req.user.userId,
//       { $set: updates },
//       { new: true, runValidators: true }
//     ).select("-password");

//     if (!user) return res.status(404).json({ message: "User not found" });
//     res.json(user);
//   } catch (err) {
//     next(err);
//   }
// };

<<<<<<< HEAD
// Update user profile
=======
>>>>>>> 1ccd5949c03b4212d7cfed25e233168d55aa75d3
exports.updateProfile = async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.username) updates.username = req.body.username;
    if (req.body.bio) updates.bio = req.body.bio;
    if (req.body.reactionStreak !== undefined)
      updates.reactionStreak = req.body.reactionStreak;
    if (req.body.lastReaction) updates.lastReaction = req.body.lastReaction;
    if (req.body.streakRewards) updates.streakRewards = req.body.streakRewards;

    if (req.file) {
      const fileName = `gossiphub/profile_pictures/original/${Date.now()}-${
        req.file.originalname
      }`;
      try {
        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: fileName,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        };
        const command = new PutObjectCommand(params);
        await s3Client.send(command);
        // Update profilePicture to point to the original image
        updates.profilePicture = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
      } catch (uploadError) {
        return res.status(500).json({
          message: "Failed to upload image to S3",
          error: uploadError.message,
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
};


// Rest of your user.js remains unchanged
exports.getFollowers = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("followers", "username profilePicture")
      .select("followers");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user.followers);
  } catch (err) {
    next(err);
  }
};

exports.getFollowing = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("following", "username profilePicture")
      .select("following");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user.following);
  } catch (err) {
    next(err);
  }
};

exports.followUser = async (req, res, next) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.userId);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (userToFollow._id.equals(currentUser._id)) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    if (currentUser.following.includes(userToFollow._id)) {
      return res.status(400).json({ message: "You already follow this user" });
    }

    currentUser.following.push(userToFollow._id);
    userToFollow.followers.push(currentUser._id);

    await currentUser.save();
    await userToFollow.save();

    res.json({ message: "User followed successfully" });
  } catch (err) {
    next(err);
  }
};

exports.unfollowUser = async (req, res, next) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.userId);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!currentUser.following.includes(userToUnfollow._id)) {
      return res.status(400).json({ message: "You do not follow this user" });
    }

    currentUser.following = currentUser.following.filter(
      (id) => !id.equals(userToUnfollow._id)
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => !id.equals(currentUser._id)
    );

    await currentUser.save();
    await userToUnfollow.save();

    res.json({ message: "User unfollowed successfully" });
  } catch (err) {
    next(err);
  }
};

exports.getPublicUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("followers", "username profilePicture")
      .populate("following", "username profilePicture");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      ...user._doc,
      followersCount: user.followers.length,
      followingCount: user.following.length,
    });
  } catch (err) {
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select("_id username profilePicture followers")
      .lean();

    const usersWithCounts = users.map((user) => ({
      ...user,
      followersCount: user.followers.length,
    }));

    res.json(usersWithCounts);
  } catch (err) {
    next(err);
  }
};
