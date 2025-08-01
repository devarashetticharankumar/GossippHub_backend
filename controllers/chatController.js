// const mongoose = require("mongoose");
// const Message = require("../models/Message");
// const User = require("../models/User");
// const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
// const sanitizeHtml = require("sanitize-html");
// const fs = require("fs");

// // Initialize S3 Client
// const s3Client = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// exports.getChats = async (req, res, next) => {
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

//     const chats = await Message.aggregate([
//       { $match: { $or: [{ sender: userId }, { receiver: userId }] } },
//       {
//         $group: {
//           _id: {
//             $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"],
//           },
//           lastMessage: { $last: "$content" },
//           timestamp: { $last: "$createdAt" },
//           unreadCount: {
//             $sum: {
//               $cond: [
//                 {
//                   $and: [
//                     { $eq: ["$receiver", userId] },
//                     { $eq: ["$isRead", false] },
//                   ],
//                 },
//                 1,
//                 0,
//               ],
//             },
//           },
//         },
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "_id",
//           foreignField: "_id",
//           as: "user",
//         },
//       },
//       { $unwind: "$user" },
//       {
//         $project: {
//           _id: 1,
//           lastMessage: 1,
//           timestamp: 1,
//           unreadCount: 1,
//           user: {
//             _id: 1,
//             username: 1,
//             profilePicture: 1,
//             email: 1,
//             bio: 1,
//             isAdmin: 1,
//             funMeter: 1,
//             createdAt: 1,
//             reactionStreak: 1,
//             lastReaction: 1,
//             streakRewards: 1,
//             followers: 1,
//             following: 1,
//             blockedUsers: 1,
//             onlineStatus: 1,
//           },
//         },
//       },
//     ]);

//     res.json(chats);
//   } catch (err) {
//     console.error("Error in getChats:", err.message);
//     next(err);
//   }
// };

// exports.getMessages = async (req, res, next) => {
//   try {
//     if (!req.user || !req.user.userId) {
//       return res.status(401).json({ message: "User must be authenticated" });
//     }

//     const { userId } = req.params;
//     const currentUserId = mongoose.Types.ObjectId.isValid(req.user.userId)
//       ? new mongoose.Types.ObjectId(req.user.userId)
//       : null;
//     if (!currentUserId) {
//       return res.status(400).json({ message: "Invalid user ID" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ message: "Invalid target user ID" });
//     }

//     const messages = await Message.find({
//       $or: [
//         { sender: currentUserId, receiver: userId, "deletedFor.sender": false },
//         {
//           sender: userId,
//           receiver: currentUserId,
//           "deletedFor.receiver": false,
//         },
//       ],
//     })
//       .populate("sender", "username profilePicture")
//       .populate("receiver", "username profilePicture")
//       .sort("createdAt");

//     res.json(messages);
//   } catch (err) {
//     console.error("Error in getMessages:", err.message);
//     next(err);
//   }
// };

// exports.sendMessage = async (req, res, next) => {
//   const { receiverId } = req.params;
//   const { content } = req.body;
//   const file = req.file;

//   try {
//     // Validate req.user
//     if (!req.user || !req.user.userId) {
//       return res.status(401).json({ message: "User must be authenticated" });
//     }

//     // Convert and validate senderId
//     const senderId = mongoose.Types.ObjectId.isValid(req.user.userId)
//       ? new mongoose.Types.ObjectId(req.user.userId)
//       : null;
//     if (!senderId) {
//       return res.status(400).json({ message: "Invalid sender ID" });
//     }

//     // Validate receiverId
//     if (!mongoose.Types.ObjectId.isValid(receiverId)) {
//       return res.status(400).json({ message: "Invalid receiver ID" });
//     }

//     // Check for existing user or block
//     const receiver = await User.findById(receiverId);
//     if (!receiver) {
//       return res.status(404).json({ message: "Receiver not found" });
//     }
//     if (receiver.blockedUsers.some((id) => id.equals(senderId))) {
//       return res.status(403).json({ message: "You are blocked by this user" });
//     }

//     // Sanitize content
//     const sanitizedContent = content
//       ? sanitizeHtml(content, {
//           allowedTags: [],
//           allowedAttributes: {},
//         })
//       : "";

//     let mediaUrl = null;
//     if (file) {
//       const fileExtension = file.originalname.split(".").pop();
//       const fileName = `gossiphub/chats/${Date.now()}-${file.originalname.replace(
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
//         await s3Client.send(new PutObjectCommand(params));
//         mediaUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
//       } catch (uploadError) {
//         return res.status(500).json({
//           message: "Failed to upload media to S3",
//           error: uploadError.message,
//         });
//       } finally {
//         // Clean up temporary file
//         try {
//           if (file.path) {
//             fs.unlinkSync(file.path);
//           }
//         } catch (fsError) {
//           console.error("Error deleting temporary file:", fsError.message);
//         }
//       }
//     }

//     const message = new Message({
//       sender: senderId,
//       receiver: receiverId,
//       content: sanitizedContent,
//       media: mediaUrl,
//       status: receiver.followers.some((id) => id.equals(senderId))
//         ? "accepted"
//         : "pending",
//     });
//     await message.save();

//     const populatedMessage = await Message.findById(message._id)
//       .populate("sender", "username profilePicture")
//       .populate("receiver", "username profilePicture");

//     req.app
//       .get("io")
//       .to(receiverId.toString())
//       .emit("newMessage", populatedMessage);
//     res.status(201).json(populatedMessage);
//   } catch (err) {
//     console.error("Error in sendMessage:", err.message);
//     next(err);
//   }
// };

// exports.markMessageAsRead = async (req, res, next) => {
//   try {
//     if (!req.user || !req.user.userId) {
//       return res.status(401).json({ message: "User must be authenticated" });
//     }

//     const { messageId } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(messageId)) {
//       return res.status(400).json({ message: "Invalid message ID" });
//     }

//     const message = await Message.findOneAndUpdate(
//       { _id: messageId, receiver: req.user.userId, isRead: false },
//       { isRead: true },
//       { new: true }
//     ).populate("sender", "username profilePicture");

//     if (!message) {
//       return res
//         .status(404)
//         .json({ message: "Message not found or already read" });
//     }

//     req.app
//       .get("io")
//       .to(message.sender.toString())
//       .emit("messageSeen", messageId);
//     res.json(message);
//   } catch (err) {
//     console.error("Error in markMessageAsRead:", err.message);
//     next(err);
//   }
// };

// exports.deleteMessage = async (req, res, next) => {
//   try {
//     if (!req.user || !req.user.userId) {
//       return res.status(401).json({ message: "User must be authenticated" });
//     }

//     const { messageId } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(messageId)) {
//       return res.status(400).json({ message: "Invalid message ID" });
//     }

//     const userId = mongoose.Types.ObjectId.isValid(req.user.userId)
//       ? new mongoose.Types.ObjectId(req.user.userId)
//       : null;
//     if (!userId) {
//       return res.status(400).json({ message: "Invalid user ID" });
//     }

//     const message = await Message.findById(messageId);
//     if (!message) {
//       return res.status(404).json({ message: "Message not found" });
//     }

//     if (message.sender.equals(userId)) {
//       message.deletedFor.sender = true;
//     } else if (message.receiver.equals(userId)) {
//       message.deletedFor.receiver = true;
//     } else {
//       return res
//         .status(403)
//         .json({ message: "Unauthorized to delete this message" });
//     }

//     await message.save();

//     if (message.deletedFor.sender && message.deletedFor.receiver) {
//       await Message.deleteOne({ _id: messageId });
//     }

//     const io = req.app.get("io");
//     const recipientId = message.sender.equals(userId)
//       ? message.receiver
//       : message.sender;
//     io.to(recipientId.toString()).emit("messageDeleted", messageId);
//     res.json({ message: "Message deleted successfully" });
//   } catch (err) {
//     console.error("Error in deleteMessage:", err.message);
//     next(err);
//   }
// };

// exports.reportMessage = async (req, res, next) => {
//   try {
//     if (!req.user || !req.user.userId) {
//       return res.status(401).json({ message: "User must be authenticated" });
//     }

//     const { messageId } = req.params;
//     const { reason } = req.body;
//     if (!mongoose.Types.ObjectId.isValid(messageId)) {
//       return res.status(400).json({ message: "Invalid message ID" });
//     }

//     const message = await Message.findById(messageId);
//     if (!message) {
//       return res.status(404).json({ message: "Message not found" });
//     }

//     // TODO: Implement report storage in a Reports collection
//     res.json({ message: "Message reported successfully" });
//   } catch (err) {
//     console.error("Error in reportMessage:", err.message);
//     next(err);
//   }
// };

// exports.blockUser = async (req, res, next) => {
//   try {
//     if (!req.user || !req.user.userId) {
//       return res.status(401).json({ message: "User must be authenticated" });
//     }

//     const { userId } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ message: "Invalid user ID" });
//     }

//     const currentUser = await User.findById(req.user.userId);
//     if (!currentUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     if (!currentUser.blockedUsers.some((id) => id.equals(userId))) {
//       currentUser.blockedUsers.push(userId);
//       await currentUser.save();
//     }

//     res.json({ message: "User blocked successfully" });
//   } catch (err) {
//     console.error("Error in blockUser:", err.message);
//     next(err);
//   }
// };

// exports.unblockUser = async (req, res, next) => {
//   try {
//     if (!req.user || !req.user.userId) {
//       return res.status(401).json({ message: "User must be authenticated" });
//     }

//     const { userId } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ message: "Invalid user ID" });
//     }

//     const currentUser = await User.findById(req.user.userId);
//     if (!currentUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Check if the user is actually blocked
//     if (!currentUser.blockedUsers.some((id) => id.equals(userId))) {
//       return res.status(400).json({ message: "User is not blocked" });
//     }

//     // Remove userId from blockedUsers array
//     await User.findByIdAndUpdate(
//       req.user.userId,
//       { $pull: { blockedUsers: userId } },
//       { new: true }
//     );

//     res.json({ message: "User unblocked successfully" });
//   } catch (err) {
//     console.error("Error in unblockUser:", err.message);
//     next(err);
//   }
// };

const mongoose = require("mongoose");
const Message = require("../models/Message");
const User = require("../models/User");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const sanitizeHtml = require("sanitize-html");
const fs = require("fs");
const sharp = require("sharp"); // For image compression

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const compressImage = async (buffer, quality = 80) => {
  return await sharp(buffer).jpeg({ quality }).toBuffer();
};

exports.getChats = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId)
      return res.status(401).json({ message: "Unauthorized" });
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const chats = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"],
          },
          lastMessage: { $last: "$content" },
          timestamp: { $last: "$createdAt" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiver", userId] },
                    {
                      $not: {
                        $gt: [
                          { $ifNull: ["$isRead." + userId.toString(), false] },
                          true,
                        ],
                      },
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $unset: ["user.password"],
      },
      {
        $project: {
          lastMessage: 1,
          timestamp: 1,
          unreadCount: 1,
          user: 1,
        },
      },
    ]);
    res.json(chats);
  } catch (err) {
    next(err);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId)
      return res.status(401).json({ message: "Unauthorized" });
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const { userId: targetId, groupId } = req.query;

    const query = groupId
      ? { groupId: new mongoose.Types.ObjectId(groupId), isDeleted: false }
      : {
          $or: [
            { sender: userId, receiver: targetId },
            { sender: targetId, receiver: userId },
          ].map((condition) => ({
            ...condition,
            ["deletedFor." + userId.toString()]: { $ne: true },
          })),
        };
    const messages = await Message.find(query)
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture")
      .populate("replyTo", "content")
      .sort("createdAt");
    res.json(messages);
  } catch (err) {
    next(err);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId)
      return res.status(401).json({ message: "Unauthorized" });
    const senderId = new mongoose.Types.ObjectId(req.user.userId);
    const {
      receiverId,
      groupId,
      content,
      type = "one-on-one",
      expireAfter,
    } = req.body;
    const files = req.files || [];

    const receivers =
      type === "broadcast"
        ? await User.find().select("_id")
        : [new mongoose.Types.ObjectId(receiverId)];
    if (type === "group" && !groupId)
      return res
        .status(400)
        .json({ message: "Group ID required for group chat" });

    let mediaUrls = [];
    for (const file of files) {
      const fileName = `gossiphub/chats/${Date.now()}-${file.originalname.replace(
        /\s+/g,
        "-"
      )}`;
      let buffer = file.buffer;
      if (file.mimetype.startsWith("image/"))
        buffer = await compressImage(buffer, 80);
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: fileName,
        Body: buffer,
        ContentType: file.mimetype,
      };
      await s3Client.send(new PutObjectCommand(params));
      mediaUrls.push(
        `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`
      );
    }

    const message = new Message({
      sender: senderId,
      receiver: receivers,
      content: sanitizeHtml(content || "", {
        allowedTags: [],
        allowedAttributes: {},
      }),
      media: mediaUrls,
      type,
      groupId: type === "group" ? new mongoose.Types.ObjectId(groupId) : null,
      expireAt: expireAfter ? new Date(Date.now() + expireAfter * 1000) : null,
    });
    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture");
    req.app.get("io").emit("newMessage", populatedMessage);
    res.status(201).json(populatedMessage);
  } catch (err) {
    next(err);
  }
};

exports.markMessageAsRead = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId)
      return res.status(401).json({ message: "Unauthorized" });
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const { messageId } = req.params;

    const query = {
      _id: messageId,
      receiver: userId,
    };
    query["isRead." + userId.toString()] = false; // Dynamic key construction

    const update = {
      $set: { ["isRead." + userId.toString()]: true },
    };

    const message = await Message.findOneAndUpdate(query, update, {
      new: true,
    }).populate("sender", "username profilePicture");
    if (!message)
      return res
        .status(404)
        .json({ message: "Message not found or already read" });
    req.app
      .get("io")
      .to(message.sender.toString())
      .emit("messageSeen", messageId);
    res.json(message);
  } catch (err) {
    console.error("Error in markMessageAsRead:", err.message);
    next(err);
  }
};

exports.deleteMessage = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId)
      return res.status(401).json({ message: "Unauthorized" });
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (
      !message ||
      (Date.now() - message.createdAt.getTime()) / 1000 >
        message.deleteTimeLimit
    )
      return res
        .status(400)
        .json({ message: "Cannot delete message after time limit" });

    if (message.sender.equals(userId)) {
      message.deletedFor[userId.toString()] = true;
      if (
        Object.values(message.deletedFor).every(Boolean) &&
        message.type === "one-on-one"
      ) {
        await Message.deleteOne({ _id: messageId });
      } else {
        await message.save();
      }
    } else {
      return res.status(403).json({ message: "Only sender can delete" });
    }
    req.app
      .get("io")
      .to(message.receiver.toString())
      .emit("messageDeleted", messageId);
    res.json({ message: "Message deleted" });
  } catch (err) {
    console.error("Error in deleteMessage:", err.message);
    next(err);
  }
};

exports.reportMessage = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId)
      return res.status(401).json({ message: "Unauthorized" });
    const { messageId } = req.params;
    const { reason } = req.body;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    // TODO: Implement report storage in a Reports collection
    res.json({ message: "Message reported successfully" });
  } catch (err) {
    console.error("Error in reportMessage:", err.message);
    next(err);
  }
};

exports.blockUser = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId)
      return res.status(401).json({ message: "Unauthorized" });
    const { userId: targetId } = req.params;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.blockedUsers.some((id) => id.equals(targetId))) {
      user.blockedUsers.push(new mongoose.Types.ObjectId(targetId));
      await user.save();
    }
    res.json({ message: "User blocked successfully" });
  } catch (err) {
    console.error("Error in blockUser:", err.message);
    next(err);
  }
};

exports.unblockUser = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId)
      return res.status(401).json({ message: "Unauthorized" });
    const { userId: targetId } = req.params;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.blockedUsers.some((id) => id.equals(targetId))) {
      await User.findByIdAndUpdate(
        req.user.userId,
        { $pull: { blockedUsers: targetId } },
        { new: true }
      );
    } else {
      return res.status(400).json({ message: "User is not blocked" });
    }
    res.json({ message: "User unblocked successfully" });
  } catch (err) {
    console.error("Error in unblockUser:", err.message);
    next(err);
  }
};

exports.editMessage = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId)
      return res.status(401).json({ message: "Unauthorized" });
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const { messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findOneAndUpdate(
      { _id: messageId, sender: userId },
      { content: sanitizeHtml(content), edited: true, editedContent: content },
      { new: true }
    ).populate("sender", "username profilePicture");
    if (!message)
      return res
        .status(404)
        .json({ message: "Message not found or not authorized" });
    req.app.get("io").emit("messageEdited", { messageId, content });
    res.json(message);
  } catch (err) {
    console.error("Error in editMessage:", err.message);
    next(err);
  }
};

exports.replyToMessage = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId)
      return res.status(401).json({ message: "Unauthorized" });
    const senderId = new mongoose.Types.ObjectId(req.user.userId);
    const { receiverId, content, replyTo } = req.body;

    const message = new Message({
      sender: senderId,
      receiver: [new mongoose.Types.ObjectId(receiverId)],
      content: sanitizeHtml(content),
      replyTo: new mongoose.Types.ObjectId(replyTo),
    });
    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "username profilePicture")
      .populate("replyTo", "content");
    req.app
      .get("io")
      .to(receiverId.toString())
      .emit("newMessage", populatedMessage);
    res.status(201).json(populatedMessage);
  } catch (err) {
    console.error("Error in replyToMessage:", err.message);
    next(err);
  }
};

exports.forwardMessage = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId)
      return res.status(401).json({ message: "Unauthorized" });
    const senderId = new mongoose.Types.ObjectId(req.user.userId);
    const { messageId, receiverId } = req.body;

    const originalMessage = await Message.findById(messageId);
    if (!originalMessage)
      return res.status(404).json({ message: "Original message not found" });

    const newMessage = new Message({
      sender: senderId,
      receiver: [new mongoose.Types.ObjectId(receiverId)],
      content: originalMessage.content,
      media: originalMessage.media,
      forwardCount: originalMessage.forwardCount + 1,
    });
    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id).populate(
      "sender",
      "username profilePicture"
    );
    req.app
      .get("io")
      .to(receiverId.toString())
      .emit("newMessage", populatedMessage);
    res.status(201).json(populatedMessage);
  } catch (err) {
    console.error("Error in forwardMessage:", err.message);
    next(err);
  }
};

exports.starMessage = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId)
      return res.status(401).json({ message: "Unauthorized" });
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });
    if (!message.starredBy.includes(userId)) {
      message.starredBy.push(userId);
      await message.save();
    }
    res.json(message);
  } catch (err) {
    console.error("Error in starMessage:", err.message);
    next(err);
  }
};
