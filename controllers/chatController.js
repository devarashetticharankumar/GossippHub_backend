//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// const { Message, ChatRoom, DirectMessage } = require("../models/chat");
// const User = require("../models/User");
// const {
//   S3Client,
//   PutObjectCommand,
//   DeleteObjectCommand,
// } = require("@aws-sdk/client-s3");

// const s3Client = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// exports.createChatRoom = async (req, res, next) => {
//   try {
//     const { name, isPublic, members } = req.body;
//     const creatorId = req.user.userId;

//     const user = await User.findById(creatorId);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     if (!isPublic && members) {
//       const invalidMembers = members.filter(
//         (memberId) =>
//           !user.followers.includes(memberId) &&
//           !user.following.includes(memberId)
//       );
//       if (invalidMembers.length > 0) {
//         return res.status(400).json({
//           message: "All members must be followers or following",
//         });
//       }
//     }

//     const chatRoom = new ChatRoom({
//       name,
//       isPublic,
//       creator: creatorId,
//       members: isPublic ? [] : [creatorId, ...(members || [])],
//     });

//     await chatRoom.save();
//     res.json(chatRoom);
//   } catch (err) {
//     next(err);
//   }
// };

// exports.joinChatRoom = async (req, res, next) => {
//   try {
//     const { roomId } = req.params;
//     const userId = req.user.userId;

//     const chatRoom = await ChatRoom.findById(roomId);
//     if (!chatRoom) return res.status(404).json({ message: "Room not found" });

//     if (!chatRoom.isPublic && !chatRoom.members.includes(userId)) {
//       return res
//         .status(403)
//         .json({ message: "Not authorized to join this room" });
//     }

//     if (!chatRoom.members.includes(userId)) {
//       chatRoom.members.push(userId);
//       await chatRoom.save();
//     }

//     res.json(chatRoom);
//   } catch (err) {
//     next(err);
//   }
// };

// exports.sendRoomMessage = async (req, res, next) => {
//   try {
//     const { roomId } = req.params;
//     const { content } = req.body;
//     const files = req.files || [];
//     const userId = req.user.userId;

//     const chatRoom = await ChatRoom.findById(roomId);
//     if (!chatRoom) return res.status(404).json({ message: "Room not found" });

//     if (!chatRoom.members.includes(userId)) {
//       return res.status(403).json({ message: "Not a member of this room" });
//     }

//     const media = [];
//     for (const file of files) {
//       const fileExtension = file.originalname.split(".").pop();
//       const fileName = `gossiphub/chat_media/${Date.now()}-${
//         file.originalname
//       }`;
//       let fileType;

//       if (["jpg", "jpeg", "png", "gif"].includes(fileExtension.toLowerCase())) {
//         fileType = "image";
//       } else if (["mp4", "mov", "avi"].includes(fileExtension.toLowerCase())) {
//         fileType = "video";
//       } else if (["mp3", "wav", "ogg"].includes(fileExtension.toLowerCase())) {
//         fileType = "audio";
//       } else {
//         fileType = "file";
//       }

//       try {
//         const params = {
//           Bucket: process.env.AWS_S3_BUCKET,
//           Key: fileName,
//           Body: file.buffer,
//           ContentType: file.mimetype,
//         };
//         const command = new PutObjectCommand(params);
//         await s3Client.send(command);
//         media.push({
//           url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`,
//           type: fileType,
//         });
//       } catch (uploadError) {
//         return res.status(500).json({
//           message: "Failed to upload media to S3",
//           error: uploadError.message,
//         });
//       }
//     }

//     if (!content && media.length === 0) {
//       return res
//         .status(400)
//         .json({ message: "Message content or media required" });
//     }

//     const message = new Message({
//       sender: userId,
//       content,
//       media,
//       room: roomId,
//     });

//     await message.save();
//     chatRoom.lastMessage = new Date();
//     await chatRoom.save();

//     const populatedMessage = await Message.findById(message._id).populate(
//       "sender",
//       "username profilePicture"
//     );
//     req.io.to(roomId).emit("newMessage", populatedMessage);

//     res.json(populatedMessage);
//   } catch (err) {
//     next(err);
//   }
// };

// exports.editRoomMessage = async (req, res, next) => {
//   try {
//     const { roomId, messageId } = req.params;
//     const { content } = req.body;
//     const files = req.files || [];
//     const userId = req.user.userId;

//     const chatRoom = await ChatRoom.findById(roomId);
//     if (!chatRoom) return res.status(404).json({ message: "Room not found" });

//     const message = await Message.findById(messageId);
//     if (!message) return res.status(404).json({ message: "Message not found" });

//     if (message.sender.toString() !== userId) {
//       return res
//         .status(403)
//         .json({ message: "Not authorized to edit this message" });
//     }

//     const media = [];
//     if (files.length > 0) {
//       // Delete old media from S3
//       for (const oldMedia of message.media) {
//         const oldKey = oldMedia.url.split(
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
//       for (const file of files) {
//         const fileExtension = file.originalname.split(".").pop();
//         const fileName = `gossiphub/chat_media/${Date.now()}-${
//           file.originalname
//         }`;
//         let fileType;

//         if (
//           ["jpg", "jpeg", "png", "gif"].includes(fileExtension.toLowerCase())
//         ) {
//           fileType = "image";
//         } else if (
//           ["mp4", "mov", "avi"].includes(fileExtension.toLowerCase())
//         ) {
//           fileType = "video";
//         } else if (
//           ["mp3", "wav", "ogg"].includes(fileExtension.toLowerCase())
//         ) {
//           fileType = "audio";
//         } else {
//           fileType = "file";
//         }

//         try {
//           const params = {
//             Bucket: process.env.AWS_S3_BUCKET,
//             Key: fileName,
//             Body: file.buffer,
//             ContentType: file.mimetype,
//           };
//           const command = new PutObjectCommand(params);
//           await s3Client.send(command);
//           media.push({
//             url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`,
//             type: fileType,
//           });
//         } catch (uploadError) {
//           return res.status(500).json({
//             message: "Failed to upload media to S3",
//             error: uploadError.message,
//           });
//         }
//       }
//     } else {
//       // Keep existing media if no new files are uploaded
//       media.push(...message.media);
//     }

//     if (!content && media.length === 0) {
//       return res
//         .status(400)
//         .json({ message: "Message content or media required" });
//     }

//     message.content = content || message.content;
//     message.media = media;
//     message.isEdited = true;
//     await message.save();

//     const populatedMessage = await Message.findById(message._id).populate(
//       "sender",
//       "username profilePicture"
//     );
//     req.io.to(roomId).emit("messageEdited", populatedMessage);

//     res.json(populatedMessage);
//   } catch (err) {
//     next(err);
//   }
// };

// exports.deleteRoomMessage = async (req, res, next) => {
//   try {
//     const { roomId, messageId } = req.params;
//     const userId = req.user.userId;

//     const chatRoom = await ChatRoom.findById(roomId);
//     if (!chatRoom) return res.status(404).json({ message: "Room not found" });

//     const message = await Message.findById(messageId);
//     if (!message) return res.status(404).json({ message: "Message not found" });

//     if (message.sender.toString() !== userId) {
//       return res
//         .status(403)
//         .json({ message: "Not authorized to delete this message" });
//     }

//     // Delete media from S3
//     for (const mediaItem of message.media) {
//       const key = mediaItem.url.split(
//         `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/`
//       )[1];
//       if (key) {
//         try {
//           await s3Client.send(
//             new DeleteObjectCommand({
//               Bucket: process.env.AWS_S3_BUCKET,
//               Key: key,
//             })
//           );
//         } catch (deleteError) {
//           console.error("Error deleting media from S3:", deleteError.message);
//         }
//       }
//     }

//     await Message.findByIdAndDelete(messageId);
//     req.io.to(roomId).emit("messageDeleted", { messageId });

//     res.json({ message: "Message deleted successfully" });
//   } catch (err) {
//     next(err);
//   }
// };

// exports.sendDirectMessage = async (req, res, next) => {
//   try {
//     const { recipientId, content } = req.body;
//     const files = req.files || [];
//     const senderId = req.user.userId;

//     const user = await User.findById(senderId);
//     if (
//       !user.followers.includes(recipientId) &&
//       !user.following.includes(recipientId)
//     ) {
//       return res.status(400).json({
//         message: "Can only message followers or following users",
//       });
//     }

//     let dm = await DirectMessage.findOne({
//       participants: { $all: [senderId, recipientId] },
//     });

//     if (!dm) {
//       dm = new DirectMessage({
//         participants: [senderId, recipientId],
//         messages: [],
//       });
//     }

//     const media = [];
//     for (const file of files) {
//       const fileExtension = file.originalname.split(".").pop();
//       const fileName = `gossiphub/chat_media/${Date.now()}-${
//         file.originalname
//       }`;
//       let fileType;

//       if (["jpg", "jpeg", "png", "gif"].includes(fileExtension.toLowerCase())) {
//         fileType = "image";
//       } else if (["mp4", "mov", "avi"].includes(fileExtension.toLowerCase())) {
//         fileType = "video";
//       } else if (["mp3", "wav", "ogg"].includes(fileExtension.toLowerCase())) {
//         fileType = "audio";
//       } else {
//         fileType = "file";
//       }

//       try {
//         const params = {
//           Bucket: process.env.AWS_S3_BUCKET,
//           Key: fileName,
//           Body: file.buffer,
//           ContentType: file.mimetype,
//         };
//         const command = new PutObjectCommand(params);
//         await s3Client.send(command);
//         media.push({
//           url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`,
//           type: fileType,
//         });
//       } catch (uploadError) {
//         return res.status(500).json({
//           message: "Failed to upload media to S3",
//           error: uploadError.message,
//         });
//       }
//     }

//     if (!content && media.length === 0) {
//       return res
//         .status(400)
//         .json({ message: "Message content or media required" });
//     }

//     const newMessage = {
//       sender: senderId,
//       content,
//       media,
//       createdAt: new Date(),
//     };

//     dm.messages.push(newMessage);
//     dm.lastMessage = new Date();
//     await dm.save();

//     req.io.to(recipientId).emit("newDirectMessage", newMessage);

//     res.json(dm);
//   } catch (err) {
//     next(err);
//   }
// };

// exports.editDirectMessage = async (req, res, next) => {
//   try {
//     const { recipientId, messageId } = req.params;
//     const { content } = req.body;
//     const files = req.files || [];
//     const senderId = req.user.userId;

//     const dm = await DirectMessage.findOne({
//       participants: { $all: [senderId, recipientId] },
//     });
//     if (!dm) return res.status(404).json({ message: "Conversation not found" });

//     const message = dm.messages.id(messageId);
//     if (!message) return res.status(404).json({ message: "Message not found" });

//     if (message.sender.toString() !== senderId) {
//       return res
//         .status(403)
//         .json({ message: "Not authorized to edit this message" });
//     }

//     const media = [];
//     if (files.length > 0) {
//       // Delete old media from S3
//       for (const oldMedia of message.media) {
//         const oldKey = oldMedia.url.split(
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
//       for (const file of files) {
//         const fileExtension = file.originalname.split(".").pop();
//         const fileName = `gossiphub/chat_media/${Date.now()}-${
//           file.originalname
//         }`;
//         let fileType;

//         if (
//           ["jpg", "jpeg", "png", "gif"].includes(fileExtension.toLowerCase())
//         ) {
//           fileType = "image";
//         } else if (
//           ["mp4", "mov", "avi"].includes(fileExtension.toLowerCase())
//         ) {
//           fileType = "video";
//         } else if (
//           ["mp3", "wav", "ogg"].includes(fileExtension.toLowerCase())
//         ) {
//           fileType = "audio";
//         } else {
//           fileType = "file";
//         }

//         try {
//           const params = {
//             Bucket: process.env.AWS_S3_BUCKET,
//             Key: fileName,
//             Body: file.buffer,
//             ContentType: file.mimetype,
//           };
//           const command = new PutObjectCommand(params);
//           await s3Client.send(command);
//           media.push({
//             url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`,
//             type: fileType,
//           });
//         } catch (uploadError) {
//           return res.status(500).json({
//             message: "Failed to upload media to S3",
//             error: uploadError.message,
//           });
//         }
//       }
//     } else {
//       // Keep existing media if no new files are uploaded
//       media.push(...message.media);
//     }

//     if (!content && media.length === 0) {
//       return res
//         .status(400)
//         .json({ message: "Message content or media required" });
//     }

//     message.content = content || message.content;
//     message.media = media;
//     message.isEdited = true;
//     await dm.save();

//     req.io.to(recipientId).emit("directMessageEdited", message);

//     res.json(dm);
//   } catch (err) {
//     next(err);
//   }
// };

// exports.deleteDirectMessage = async (req, res, next) => {
//   try {
//     const { recipientId, messageId } = req.params;
//     const senderId = req.user.userId;

//     const dm = await DirectMessage.findOne({
//       participants: { $all: [senderId, recipientId] },
//     });
//     if (!dm) return res.status(404).json({ message: "Conversation not found" });

//     const message = dm.messages.id(messageId);
//     if (!message) return res.status(404).json({ message: "Message not found" });

//     if (message.sender.toString() !== senderId) {
//       return res
//         .status(403)
//         .json({ message: "Not authorized to delete this message" });
//     }

//     // Delete media from S3
//     for (const mediaItem of message.media) {
//       const key = mediaItem.url.split(
//         `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/`
//       )[1];
//       if (key) {
//         try {
//           await s3Client.send(
//             new DeleteObjectCommand({
//               Bucket: process.env.AWS_S3_BUCKET,
//               Key: key,
//             })
//           );
//         } catch (deleteError) {
//           console.error("Error deleting media from S3:", deleteError.message);
//         }
//       }
//     }

//     // Remove the message from the messages array using $pull
//     dm.messages.pull({ _id: messageId });
//     await dm.save();

//     req.io.to(recipientId).emit("directMessageDeleted", { messageId });

//     res.json({ message: "Message deleted successfully" });
//   } catch (err) {
//     next(err);
//   }
// };

// exports.getUserChatRooms = async (req, res, next) => {
//   try {
//     const userId = req.user.userId;
//     const chatRooms = await ChatRoom.find({
//       $or: [{ members: userId }, { creator: userId }],
//     })
//       .populate("creator", "username profilePicture")
//       .populate("members", "username profilePicture")
//       .sort({ lastMessage: -1 });
//     res.json(chatRooms);
//   } catch (err) {
//     next(err);
//   }
// };

// exports.getRoomMessages = async (req, res, next) => {
//   try {
//     const { roomId } = req.params;
//     const userId = req.user.userId;

//     const chatRoom = await ChatRoom.findById(roomId);
//     if (!chatRoom) return res.status(404).json({ message: "Room not found" });

//     if (!chatRoom.isPublic && !chatRoom.members.includes(userId)) {
//       return res
//         .status(403)
//         .json({ message: "Not authorized to view messages" });
//     }

//     const messages = await Message.find({ room: roomId })
//       .populate("sender", "username profilePicture")
//       .sort({ createdAt: 1 });
//     res.json(messages);
//   } catch (err) {
//     next(err);
//   }
// };

// exports.getDirectMessages = async (req, res, next) => {
//   try {
//     const { recipientId } = req.params;
//     const senderId = req.user.userId;

//     const dm = await DirectMessage.findOne({
//       participants: { $all: [senderId, recipientId] },
//     }).populate("participants", "username profilePicture");

//     res.json(dm || { messages: [] });
//   } catch (err) {
//     next(err);
//   }
// };

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// const mongoose = require("mongoose");
// const { Message, ChatRoom, DirectMessage } = require("../models/chat");
// const User = require("../models/User");
// const {
//   S3Client,
//   PutObjectCommand,
//   DeleteObjectCommand,
// } = require("@aws-sdk/client-s3");

// const s3Client = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// exports.createChatRoom = async (req, res, next) => {
//   try {
//     const { name, isPublic, members } = req.body;
//     const creatorId = req.user.userId;

//     // Validate creatorId
//     if (!mongoose.Types.ObjectId.isValid(creatorId)) {
//       return res.status(400).json({ message: "Invalid creator ID" });
//     }

//     const user = await User.findById(creatorId);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     if (!isPublic && members) {
//       const invalidMembers = members.filter(
//         (memberId) =>
//           !mongoose.Types.ObjectId.isValid(memberId) ||
//           (!user.followers.includes(memberId) &&
//             !user.following.includes(memberId))
//       );
//       if (invalidMembers.length > 0) {
//         return res.status(400).json({
//           message: "All members must be valid followers or following",
//         });
//       }
//     }

//     const chatRoom = new ChatRoom({
//       name,
//       isPublic,
//       creator: creatorId,
//       members: isPublic ? [] : [creatorId, ...(members || [])],
//     });

//     await chatRoom.save();
//     res.json(chatRoom);
//   } catch (err) {
//     console.error("Error in createChatRoom:", err);
//     next(err);
//   }
// };

// exports.joinChatRoom = async (req, res, next) => {
//   try {
//     const { roomId } = req.params;
//     const userId = req.user.userId;

//     // Validate inputs
//     if (!mongoose.Types.ObjectId.isValid(roomId)) {
//       return res.status(400).json({ message: "Invalid room ID" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ message: "Invalid user ID" });
//     }

//     const chatRoom = await ChatRoom.findById(roomId);
//     if (!chatRoom) return res.status(404).json({ message: "Room not found" });

//     if (!chatRoom.isPublic && !chatRoom.members.includes(userId)) {
//       return res
//         .status(403)
//         .json({ message: "Not authorized to join this room" });
//     }

//     if (!chatRoom.members.includes(userId)) {
//       chatRoom.members.push(userId);
//       await chatRoom.save();
//     }

//     res.json(chatRoom);
//   } catch (err) {
//     console.error("Error in joinChatRoom:", err);
//     next(err);
//   }
// };

// exports.sendRoomMessage = async (req, res, next) => {
//   try {
//     const { roomId } = req.params;
//     const { content } = req.body;
//     const files = req.files || [];
//     const userId = req.user.userId;

//     // Validate inputs
//     if (!roomId || roomId === "null") {
//       return res.status(400).json({ message: "Missing room ID" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(roomId)) {
//       return res.status(400).json({ message: "Invalid room ID" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ message: "Invalid user ID" });
//     }

//     // Check if room exists
//     const chatRoom = await ChatRoom.findById(roomId);
//     if (!chatRoom) return res.status(404).json({ message: "Room not found" });

//     // Check if user is a member
//     if (!chatRoom.members.includes(userId)) {
//       return res.status(403).json({ message: "Not a member of this room" });
//     }

//     // Validate sender
//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ message: "Sender not found" });

//     // Process media uploads
//     const media = [];
//     for (const file of files) {
//       const fileExtension = file.originalname.split(".").pop();
//       const fileName = `gossiphub/chat_media/${Date.now()}-${
//         file.originalname
//       }`;
//       let fileType;

//       if (["jpg", "jpeg", "png", "gif"].includes(fileExtension.toLowerCase())) {
//         fileType = "image";
//       } else if (["mp4", "mov", "avi"].includes(fileExtension.toLowerCase())) {
//         fileType = "video";
//       } else if (["mp3", "wav", "ogg"].includes(fileExtension.toLowerCase())) {
//         fileType = "audio";
//       } else {
//         fileType = "file";
//       }

//       try {
//         const params = {
//           Bucket: process.env.AWS_S3_BUCKET,
//           Key: fileName,
//           Body: file.buffer,
//           ContentType: file.mimetype,
//         };
//         const command = new PutObjectCommand(params);
//         await s3Client.send(command);
//         media.push({
//           url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`,
//           type: fileType,
//         });
//       } catch (uploadError) {
//         console.error("Error uploading media to S3:", uploadError);
//         return res.status(500).json({
//           message: "Failed to upload media to S3",
//           error: uploadError.message,
//         });
//       }
//     }

//     if (!content && media.length === 0) {
//       return res
//         .status(400)
//         .json({ message: "Message content or media required" });
//     }

//     // Create new message
//     const message = new Message({
//       sender: userId,
//       content,
//       media,
//       room: roomId,
//     });

//     await message.save();
//     chatRoom.lastMessage = new Date();
//     await chatRoom.save();

//     // Populate message for response
//     const populatedMessage = await Message.findById(message._id).populate(
//       "sender",
//       "username profilePicture"
//     );
//     req.io.to(roomId).emit("newMessage", populatedMessage);

//     res.json(populatedMessage);
//   } catch (err) {
//     console.error("Error in sendRoomMessage:", err);
//     next(err);
//   }
// };

// exports.editRoomMessage = async (req, res, next) => {
//   try {
//     const { roomId, messageId } = req.params;
//     const { content } = req.body;
//     const files = req.files || [];
//     const userId = req.user.userId;

//     // Validate inputs
//     if (!mongoose.Types.ObjectId.isValid(roomId)) {
//       return res.status(400).json({ message: "Invalid room ID" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(messageId)) {
//       return res.status(400).json({ message: "Invalid message ID" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ message: "Invalid user ID" });
//     }

//     const chatRoom = await ChatRoom.findById(roomId);
//     if (!chatRoom) return res.status(404).json({ message: "Room not found" });

//     const message = await Message.findById(messageId);
//     if (!message) return res.status(404).json({ message: "Message not found" });

//     if (message.sender.toString() !== userId) {
//       return res
//         .status(403)
//         .json({ message: "Not authorized to edit this message" });
//     }

//     // Process media uploads
//     const media = [];
//     if (files.length > 0) {
//       // Delete old media from S3
//       for (const oldMedia of message.media) {
//         const oldKey = oldMedia.url.split(
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
//             console.error("Error deleting old media from S3:", deleteError);
//           }
//         }
//       }

//       // Upload new media
//       for (const file of files) {
//         const fileExtension = file.originalname.split(".").pop();
//         const fileName = `gossiphub/chat_media/${Date.now()}-${
//           file.originalname
//         }`;
//         let fileType;

//         if (
//           ["jpg", "jpeg", "png", "gif"].includes(fileExtension.toLowerCase())
//         ) {
//           fileType = "image";
//         } else if (
//           ["mp4", "mov", "avi"].includes(fileExtension.toLowerCase())
//         ) {
//           fileType = "video";
//         } else if (
//           ["mp3", "wav", "ogg"].includes(fileExtension.toLowerCase())
//         ) {
//           fileType = "audio";
//         } else {
//           fileType = "file";
//         }

//         try {
//           const params = {
//             Bucket: process.env.AWS_S3_BUCKET,
//             Key: fileName,
//             Body: file.buffer,
//             ContentType: file.mimetype,
//           };
//           const command = new PutObjectCommand(params);
//           await s3Client.send(command);
//           media.push({
//             url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`,
//             type: fileType,
//           });
//         } catch (uploadError) {
//           console.error("Error uploading media to S3:", uploadError);
//           return res.status(500).json({
//             message: "Failed to upload media to S3",
//             error: uploadError.message,
//           });
//         }
//       }
//     } else {
//       media.push(...message.media);
//     }

//     if (!content && media.length === 0) {
//       return res
//         .status(400)
//         .json({ message: "Message content or media required" });
//     }

//     message.content = content || message.content;
//     message.media = media;
//     message.isEdited = true;
//     await message.save();

//     const populatedMessage = await Message.findById(message._id).populate(
//       "sender",
//       "username profilePicture"
//     );
//     req.io.to(roomId).emit("messageEdited", populatedMessage);

//     res.json(populatedMessage);
//   } catch (err) {
//     console.error("Error in editRoomMessage:", err);
//     next(err);
//   }
// };

// exports.deleteRoomMessage = async (req, res, next) => {
//   try {
//     const { roomId, messageId } = req.params;
//     const userId = req.user.userId;

//     // Validate inputs
//     if (!mongoose.Types.ObjectId.isValid(roomId)) {
//       return res.status(400).json({ message: "Invalid room ID" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(messageId)) {
//       return res.status(400).json({ message: "Invalid message ID" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ message: "Invalid user ID" });
//     }

//     const chatRoom = await ChatRoom.findById(roomId);
//     if (!chatRoom) return res.status(404).json({ message: "Room not found" });

//     const message = await Message.findById(messageId);
//     if (!message) return res.status(404).json({ message: "Message not found" });

//     if (message.sender.toString() !== userId) {
//       return res
//         .status(403)
//         .json({ message: "Not authorized to delete this message" });
//     }

//     // Delete media from S3
//     for (const mediaItem of message.media) {
//       const key = mediaItem.url.split(
//         `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/`
//       )[1];
//       if (key) {
//         try {
//           await s3Client.send(
//             new DeleteObjectCommand({
//               Bucket: process.env.AWS_S3_BUCKET,
//               Key: key,
//             })
//           );
//         } catch (deleteError) {
//           console.error("Error deleting media from S3:", deleteError);
//         }
//       }
//     }

//     await Message.findByIdAndDelete(messageId);
//     req.io.to(roomId).emit("messageDeleted", { messageId });

//     res.json({ message: "Message deleted successfully" });
//   } catch (err) {
//     console.error("Error in deleteRoomMessage:", err);
//     next(err);
//   }
// };

// exports.sendDirectMessage = async (req, res, next) => {
//   try {
//     const { recipientId, content } = req.body;
//     const files = req.files || [];
//     const senderId = req.user?.userId;

//     // Validate inputs
//     if (!senderId) {
//       console.error("sendDirectMessage: Missing sender ID", {
//         reqUser: req.user,
//       });
//       return res
//         .status(401)
//         .json({ message: "Authentication required: Missing sender ID" });
//     }
//     if (!recipientId) {
//       console.error("sendDirectMessage: Missing recipient ID", {
//         body: req.body,
//       });
//       return res.status(400).json({ message: "Missing recipient ID" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(senderId)) {
//       console.error("sendDirectMessage: Invalid sender ID", { senderId });
//       return res.status(400).json({ message: "Invalid sender ID" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(recipientId)) {
//       console.error("sendDirectMessage: Invalid recipient ID", { recipientId });
//       return res.status(400).json({ message: "Invalid recipient ID" });
//     }

//     // Check if users exist
//     const [sender, recipient] = await Promise.all([
//       User.findById(senderId),
//       User.findById(recipientId),
//     ]);

//     if (!sender) {
//       console.error("sendDirectMessage: Sender not found", { senderId });
//       return res.status(404).json({ message: "Sender not found" });
//     }
//     if (!recipient) {
//       console.error("sendDirectMessage: Recipient not found", { recipientId });
//       return res.status(404).json({ message: "Recipient not found" });
//     }

//     // Relaxed followers check (optional: remove if not needed)
//     // if (
//     //   !sender.followers.includes(recipientId) &&
//     //   !sender.following.includes(recipientId)
//     // ) {
//     //   console.error("sendDirectMessage: Sender not allowed to message recipient", {
//     //     senderId,
//     //     recipientId,
//     //   });
//     //   return res.status(403).json({
//     //     message: "Can only message followers or following users",
//     //   });
//     // }

//     // Find or create direct message conversation
//     let dm = await DirectMessage.findOne({
//       participants: { $all: [senderId, recipientId] },
//     });

//     if (!dm) {
//       dm = new DirectMessage({
//         participants: [senderId, recipientId],
//         messages: [],
//       });
//     }

//     // Process media uploads
//     const media = [];
//     for (const file of files) {
//       const fileExtension = file.originalname.split(".").pop();
//       const fileName = `gossiphub/chat_media/${Date.now()}-${
//         file.originalname
//       }`;
//       let fileType;

//       if (["jpg", "jpeg", "png", "gif"].includes(fileExtension.toLowerCase())) {
//         fileType = "image";
//       } else if (["mp4", "mov", "avi"].includes(fileExtension.toLowerCase())) {
//         fileType = "video";
//       } else if (["mp3", "wav", "ogg"].includes(fileExtension.toLowerCase())) {
//         fileType = "audio";
//       } else {
//         fileType = "file";
//       }

//       try {
//         const params = {
//           Bucket: process.env.AWS_S3_BUCKET,
//           Key: fileName,
//           Body: file.buffer,
//           ContentType: file.mimetype,
//         };
//         const command = new PutObjectCommand(params);
//         await s3Client.send(command);
//         media.push({
//           url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`,
//           type: fileType,
//         });
//       } catch (uploadError) {
//         console.error("Error uploading media to S3:", uploadError);
//         return res.status(500).json({
//           message: "Failed to upload media to S3",
//           error: uploadError.message,
//         });
//       }
//     }

//     if (!content && media.length === 0) {
//       console.error("sendDirectMessage: Missing content and media", {
//         body: req.body,
//       });
//       return res
//         .status(400)
//         .json({ message: "Message content or media required" });
//     }

//     // Create new message
//     const newMessage = {
//       sender: senderId,
//       content,
//       media,
//       createdAt: new Date(),
//     };

//     dm.messages.push(newMessage);
//     dm.lastMessage = new Date();
//     await dm.save();

//     // Populate the new message for response
//     const populatedDm = await DirectMessage.findById(dm._id).populate(
//       "participants",
//       "username profilePicture"
//     );
//     const populatedMessage = populatedDm.messages.find(
//       (msg) => msg._id.toString() === newMessage._id.toString()
//     );

//     // Emit socket event to both users
//     req.io.to(senderId).emit("newDirectMessage", populatedMessage);
//     req.io.to(recipientId).emit("newDirectMessage", populatedMessage);

//     res.json(populatedDm);
//   } catch (err) {
//     console.error("Error in sendDirectMessage:", err);
//     next(err);
//   }
// };

// exports.editDirectMessage = async (req, res, next) => {
//   try {
//     const { recipientId, messageId } = req.params;
//     const { content } = req.body;
//     const files = req.files || [];
//     const senderId = req.user?.userId;

//     // Validate inputs
//     if (!senderId) {
//       console.error("editDirectMessage: Missing sender ID", {
//         reqUser: req.user,
//       });
//       return res
//         .status(401)
//         .json({ message: "Authentication required: Missing sender ID" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(recipientId)) {
//       console.error("editDirectMessage: Invalid recipient ID", { recipientId });
//       return res.status(400).json({ message: "Invalid recipient ID" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(messageId)) {
//       console.error("editDirectMessage: Invalid message ID", { messageId });
//       return res.status(400).json({ message: "Invalid message ID" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(senderId)) {
//       console.error("editDirectMessage: Invalid sender ID", { senderId });
//       return res.status(400).json({ message: "Invalid sender ID" });
//     }

//     const dm = await DirectMessage.findOne({
//       participants: { $all: [senderId, recipientId] },
//     });
//     if (!dm) return res.status(404).json({ message: "Conversation not found" });

//     const message = dm.messages.id(messageId);
//     if (!message) return res.status(404).json({ message: "Message not found" });

//     if (message.sender.toString() !== senderId) {
//       return res
//         .status(403)
//         .json({ message: "Not authorized to edit this message" });
//     }

//     // Process media uploads
//     const media = [];
//     if (files.length > 0) {
//       // Delete old media from S3
//       for (const oldMedia of message.media) {
//         const oldKey = oldMedia.url.split(
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
//             console.error("Error deleting old media from S3:", deleteError);
//           }
//         }
//       }

//       // Upload new media
//       for (const file of files) {
//         const fileExtension = file.originalname.split(".").pop();
//         const fileName = `gossiphub/chat_media/${Date.now()}-${
//           file.originalname
//         }`;
//         let fileType;

//         if (
//           ["jpg", "jpeg", "png", "gif"].includes(fileExtension.toLowerCase())
//         ) {
//           fileType = "image";
//         } else if (
//           ["mp4", "mov", "avi"].includes(fileExtension.toLowerCase())
//         ) {
//           fileType = "video";
//         } else if (
//           ["mp3", "wav", "ogg"].includes(fileExtension.toLowerCase())
//         ) {
//           fileType = "audio";
//         } else {
//           fileType = "file";
//         }

//         try {
//           const params = {
//             Bucket: process.env.AWS_S3_BUCKET,
//             Key: fileName,
//             Body: file.buffer,
//             ContentType: file.mimetype,
//           };
//           const command = new PutObjectCommand(params);
//           await s3Client.send(command);
//           media.push({
//             url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`,
//             type: fileType,
//           });
//         } catch (uploadError) {
//           console.error("Error uploading media to S3:", uploadError);
//           return res.status(500).json({
//             message: "Failed to upload media to S3",
//             error: uploadError.message,
//           });
//         }
//       }
//     } else {
//       media.push(...message.media);
//     }

//     if (!content && media.length === 0) {
//       return res
//         .status(400)
//         .json({ message: "Message content or media required" });
//     }

//     message.content = content || message.content;
//     message.media = media;
//     message.isEdited = true;
//     await dm.save();

//     // Emit socket event
//     req.io.to(senderId).emit("directMessageEdited", message);
//     req.io.to(recipientId).emit("directMessageEdited", message);

//     res.json(dm);
//   } catch (err) {
//     console.error("Error in editDirectMessage:", err);
//     next(err);
//   }
// };

// exports.deleteDirectMessage = async (req, res, next) => {
//   try {
//     const { recipientId, messageId } = req.params;
//     const senderId = req.user?.userId;

//     // Validate inputs
//     if (!senderId) {
//       console.error("deleteDirectMessage: Missing sender ID", {
//         reqUser: req.user,
//       });
//       return res
//         .status(401)
//         .json({ message: "Authentication required: Missing sender ID" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(recipientId)) {
//       console.error("deleteDirectMessage: Invalid recipient ID", {
//         recipientId,
//       });
//       return res.status(400).json({ message: "Invalid recipient ID" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(messageId)) {
//       console.error("deleteDirectMessage: Invalid message ID", { messageId });
//       return res.status(400).json({ message: "Invalid message ID" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(senderId)) {
//       console.error("deleteDirectMessage: Invalid sender ID", { senderId });
//       return res.status(400).json({ message: "Invalid sender ID" });
//     }

//     const dm = await DirectMessage.findOne({
//       participants: { $all: [senderId, recipientId] },
//     });
//     if (!dm) return res.status(404).json({ message: "Conversation not found" });

//     const message = dm.messages.id(messageId);
//     if (!message) return res.status(404).json({ message: "Message not found" });

//     if (message.sender.toString() !== senderId) {
//       return res
//         .status(403)
//         .json({ message: "Not authorized to delete this message" });
//     }

//     // Delete media from S3
//     for (const mediaItem of message.media) {
//       const key = mediaItem.url.split(
//         `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/`
//       )[1];
//       if (key) {
//         try {
//           await s3Client.send(
//             new DeleteObjectCommand({
//               Bucket: process.env.AWS_S3_BUCKET,
//               Key: key,
//             })
//           );
//         } catch (deleteError) {
//           console.error("Error deleting media from S3:", deleteError);
//         }
//       }
//     }

//     // Remove the message from the messages array
//     dm.messages.pull({ _id: messageId });
//     await dm.save();

//     // Emit socket event
//     req.io.to(senderId).emit("directMessageDeleted", { messageId });
//     req.io.to(recipientId).emit("directMessageDeleted", { messageId });

//     res.json({ message: "Message deleted successfully" });
//   } catch (err) {
//     console.error("Error in deleteDirectMessage:", err);
//     next(err);
//   }
// };

// exports.getUserChatRooms = async (req, res, next) => {
//   try {
//     const userId = req.user?.userId;

//     // Validate userId
//     if (!userId) {
//       console.error("getUserChatRooms: Missing user ID", { reqUser: req.user });
//       return res
//         .status(401)
//         .json({ message: "Authentication required: Missing user ID" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       console.error("getUserChatRooms: Invalid user ID", { userId });
//       return res.status(400).json({ message: "Invalid user ID" });
//     }

//     const chatRooms = await ChatRoom.find({
//       $or: [{ members: userId }, { creator: userId }],
//     })
//       .populate("creator", "username profilePicture")
//       .populate("members", "username profilePicture")
//       .sort({ lastMessage: -1 });
//     res.json(chatRooms);
//   } catch (err) {
//     console.error("Error in getUserChatRooms:", err);
//     next(err);
//   }
// };

// exports.getRoomMessages = async (req, res, next) => {
//   try {
//     const { roomId } = req.params;
//     const userId = req.user?.userId;

//     // Validate inputs
//     if (!userId) {
//       console.error("getRoomMessages: Missing user ID", { reqUser: req.user });
//       return res
//         .status(401)
//         .json({ message: "Authentication required: Missing user ID" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(roomId)) {
//       console.error("getRoomMessages: Invalid room ID", { roomId });
//       return res.status(400).json({ message: "Invalid room ID" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       console.error("getRoomMessages: Invalid user ID", { userId });
//       return res.status(400).json({ message: "Invalid user ID" });
//     }

//     const chatRoom = await ChatRoom.findById(roomId);
//     if (!chatRoom) return res.status(404).json({ message: "Room not found" });

//     if (!chatRoom.isPublic && !chatRoom.members.includes(userId)) {
//       return res
//         .status(403)
//         .json({ message: "Not authorized to view messages" });
//     }

//     const messages = await Message.find({ room: roomId })
//       .populate("sender", "username profilePicture")
//       .sort({ createdAt: 1 });
//     res.json(messages);
//   } catch (err) {
//     console.error("Error in getRoomMessages:", err);
//     next(err);
//   }
// };

// exports.getDirectMessages = async (req, res, next) => {
//   try {
//     const { recipientId } = req.params;
//     const senderId = req.user?.userId;

//     // Validate inputs
//     if (!senderId) {
//       console.error("getDirectMessages: Missing sender ID", {
//         reqUser: req.user,
//       });
//       return res
//         .status(401)
//         .json({ message: "Authentication required: Missing sender ID" });
//     }
//     if (!recipientId) {
//       console.error("getDirectMessages: Missing recipient ID", { recipientId });
//       return res.status(400).json({ message: "Missing recipient ID" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(senderId)) {
//       console.error("getDirectMessages: Invalid sender ID", { senderId });
//       return res.status(400).json({ message: "Invalid sender ID" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(recipientId)) {
//       console.error("getDirectMessages: Invalid recipient ID", { recipientId });
//       return res.status(400).json({ message: "Invalid recipient ID" });
//     }

//     const dm = await DirectMessage.findOne({
//       participants: { $all: [senderId, recipientId] },
//     }).populate("participants", "username profilePicture");

//     res.json(dm || { messages: [] });
//   } catch (err) {
//     console.error("Error in getDirectMessages:", err);
//     next(err);
//   }
// };

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { Message, ChatRoom, DirectMessage } = require("../models/chat");
const User = require("../models/User");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Authentication middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    console.error("authMiddleware: No authentication token provided");
    return res.status(401).json({ message: "No authentication token" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.userId) {
      console.error("authMiddleware: Invalid token, missing userId", {
        decoded,
      });
      return res.status(401).json({ message: "Invalid token: Missing userId" });
    }
    req.user = decoded; // Set req.user with decoded JWT payload
    console.log("authMiddleware: User authenticated", {
      userId: decoded.userId,
    });
    next();
  } catch (err) {
    console.error("authMiddleware: Token verification failed", {
      error: err.message,
    });
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

exports.createChatRoom = async (req, res, next) => {
  try {
    const { name, isPublic, members } = req.body;
    const creatorId = req.user.userId;

    // Validate creatorId
    if (!mongoose.Types.ObjectId.isValid(creatorId)) {
      return res.status(400).json({ message: "Invalid creator ID" });
    }

    const user = await User.findById(creatorId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!isPublic && members) {
      const invalidMembers = members.filter(
        (memberId) =>
          !mongoose.Types.ObjectId.isValid(memberId) ||
          (!user.followers.includes(memberId) &&
            !user.following.includes(memberId))
      );
      if (invalidMembers.length > 0) {
        return res.status(400).json({
          message: "All members must be valid followers or following",
        });
      }
    }

    const chatRoom = new ChatRoom({
      name,
      isPublic,
      creator: creatorId,
      members: isPublic ? [] : [creatorId, ...(members || [])],
    });

    await chatRoom.save();
    res.json(chatRoom);
  } catch (err) {
    console.error("Error in createChatRoom:", err);
    next(err);
  }
};

exports.joinChatRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) return res.status(404).json({ message: "Room not found" });

    if (!chatRoom.isPublic && !chatRoom.members.includes(userId)) {
      return res
        .status(403)
        .json({ message: "Not authorized to join this room" });
    }

    if (!chatRoom.members.includes(userId)) {
      chatRoom.members.push(userId);
      await chatRoom.save();
    }

    res.json(chatRoom);
  } catch (err) {
    console.error("Error in joinChatRoom:", err);
    next(err);
  }
};

exports.sendRoomMessage = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;
    const files = req.files || [];
    const userId = req.user.userId;

    // Validate inputs
    if (!roomId || roomId === "null") {
      return res.status(400).json({ message: "Missing room ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Check if room exists
    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) return res.status(404).json({ message: "Room not found" });

    // Check if user is a member
    if (!chatRoom.members.includes(userId)) {
      return res.status(403).json({ message: "Not a member of this room" });
    }

    // Validate sender
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Sender not found" });

    // Process media uploads
    const media = [];
    for (const file of files) {
      const fileExtension = file.originalname.split(".").pop();
      const fileName = `gossiphub/chat_media/${Date.now()}-${
        file.originalname
      }`;
      let fileType;

      if (["jpg", "jpeg", "png", "gif"].includes(fileExtension.toLowerCase())) {
        fileType = "image";
      } else if (["mp4", "mov", "avi"].includes(fileExtension.toLowerCase())) {
        fileType = "video";
      } else if (["mp3", "wav", "ogg"].includes(fileExtension.toLowerCase())) {
        fileType = "audio";
      } else {
        fileType = "file";
      }

      try {
        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        };
        const command = new PutObjectCommand(params);
        await s3Client.send(command);
        media.push({
          url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`,
          type: fileType,
        });
      } catch (uploadError) {
        console.error("Error uploading media to S3:", uploadError);
        return res.status(500).json({
          message: "Failed to upload media to S3",
          error: uploadError.message,
        });
      }
    }

    if (!content && media.length === 0) {
      return res
        .status(400)
        .json({ message: "Message content or media required" });
    }

    // Create new message
    const message = new Message({
      sender: userId,
      content,
      media,
      room: roomId,
    });

    await message.save();
    chatRoom.lastMessage = new Date();
    await chatRoom.save();

    // Populate message for response
    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "username profilePicture"
    );
    req.io.to(roomId).emit("newMessage", populatedMessage);

    res.json(populatedMessage);
  } catch (err) {
    console.error("Error in sendRoomMessage:", err);
    next(err);
  }
};

exports.editRoomMessage = async (req, res, next) => {
  try {
    const { roomId, messageId } = req.params;
    const { content } = req.body;
    const files = req.files || [];
    const userId = req.user.userId;

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) return res.status(404).json({ message: "Room not found" });

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.sender.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this message" });
    }

    // Process media uploads
    const media = [];
    if (files.length > 0) {
      // Delete old media from S3
      for (const oldMedia of message.media) {
        const oldKey = oldMedia.url.split(
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
            console.error("Error deleting old media from S3:", deleteError);
          }
        }
      }

      // Upload new media
      for (const file of files) {
        const fileExtension = file.originalname.split(".").pop();
        const fileName = `gossiphub/chat_media/${Date.now()}-${
          file.originalname
        }`;
        let fileType;

        if (
          ["jpg", "jpeg", "png", "gif"].includes(fileExtension.toLowerCase())
        ) {
          fileType = "image";
        } else if (
          ["mp4", "mov", "avi"].includes(fileExtension.toLowerCase())
        ) {
          fileType = "video";
        } else if (
          ["mp3", "wav", "ogg"].includes(fileExtension.toLowerCase())
        ) {
          fileType = "audio";
        } else {
          fileType = "file";
        }

        try {
          const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
          };
          const command = new PutObjectCommand(params);
          await s3Client.send(command);
          media.push({
            url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`,
            type: fileType,
          });
        } catch (uploadError) {
          console.error("Error uploading media to S3:", uploadError);
          return res.status(500).json({
            message: "Failed to upload media to S3",
            error: uploadError.message,
          });
        }
      }
    } else {
      media.push(...message.media);
    }

    if (!content && media.length === 0) {
      return res
        .status(400)
        .json({ message: "Message content or media required" });
    }

    message.content = content || message.content;
    message.media = media;
    message.isEdited = true;
    await message.save();

    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "username profilePicture"
    );
    req.io.to(roomId).emit("messageEdited", populatedMessage);

    res.json(populatedMessage);
  } catch (err) {
    console.error("Error in editRoomMessage:", err);
    next(err);
  }
};

exports.deleteRoomMessage = async (req, res, next) => {
  try {
    const { roomId, messageId } = req.params;
    const userId = req.user.userId;

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) return res.status(404).json({ message: "Room not found" });

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.sender.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this message" });
    }

    // Delete media from S3
    for (const mediaItem of message.media) {
      const key = mediaItem.url.split(
        `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/`
      )[1];
      if (key) {
        try {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET,
              Key: key,
            })
          );
        } catch (deleteError) {
          console.error("Error deleting media from S3:", deleteError);
        }
      }
    }

    await Message.findByIdAndDelete(messageId);
    req.io.to(roomId).emit("messageDeleted", { messageId });

    res.json({ message: "Message deleted successfully" });
  } catch (err) {
    console.error("Error in deleteRoomMessage:", err);
    next(err);
  }
};

exports.sendDirectMessage = async (req, res, next) => {
  try {
    const { recipientId, content, senderId: providedSenderId } = req.body;
    const files = req.files || [];
    const userId = req.user.userId;

    // Validate inputs
    if (!userId) {
      console.error("sendDirectMessage: Missing user ID from JWT", {
        reqUser: req.user,
      });
      return res
        .status(401)
        .json({ message: "Authentication required: Missing user ID" });
    }
    if (providedSenderId && providedSenderId !== userId) {
      console.error("sendDirectMessage: Sender ID mismatch", {
        providedSenderId,
        userId,
      });
      return res.status(403).json({ message: "Sender ID mismatch" });
    }
    if (!recipientId) {
      console.error("sendDirectMessage: Missing recipient ID", {
        body: req.body,
      });
      return res.status(400).json({ message: "Missing recipient ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("sendDirectMessage: Invalid sender ID", { userId });
      return res.status(400).json({ message: "Invalid sender ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      console.error("sendDirectMessage: Invalid recipient ID", { recipientId });
      return res.status(400).json({ message: "Invalid recipient ID" });
    }

    // Check if users exist
    const [sender, recipient] = await Promise.all([
      User.findById(userId),
      User.findById(recipientId),
    ]);

    if (!sender) {
      console.error("sendDirectMessage: Sender not found", { userId });
      return res.status(404).json({ message: "Sender not found" });
    }
    if (!recipient) {
      console.error("sendDirectMessage: Recipient not found", { recipientId });
      return res.status(404).json({ message: "Recipient not found" });
    }

    // Find or create direct message conversation
    let dm = await DirectMessage.findOne({
      participants: { $all: [userId, recipientId] },
    });

    if (!dm) {
      dm = new DirectMessage({
        participants: [userId, recipientId],
        messages: [],
      });
    }

    // Process media uploads
    const media = [];
    for (const file of files) {
      const fileExtension = file.originalname.split(".").pop();
      const fileName = `gossiphub/chat_media/${Date.now()}-${
        file.originalname
      }`;
      let fileType;

      if (["jpg", "jpeg", "png", "gif"].includes(fileExtension.toLowerCase())) {
        fileType = "image";
      } else if (["mp4", "mov", "avi"].includes(fileExtension.toLowerCase())) {
        fileType = "video";
      } else if (["mp3", "wav", "ogg"].includes(fileExtension.toLowerCase())) {
        fileType = "audio";
      } else {
        fileType = "file";
      }

      try {
        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        };
        const command = new PutObjectCommand(params);
        await s3Client.send(command);
        media.push({
          url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`,
          type: fileType,
        });
      } catch (uploadError) {
        console.error("Error uploading media to S3:", uploadError);
        return res.status(500).json({
          message: "Failed to upload media to S3",
          error: uploadError.message,
        });
      }
    }

    if (!content && media.length === 0) {
      console.error("sendDirectMessage: Missing content and media", {
        body: req.body,
      });
      return res
        .status(400)
        .json({ message: "Message content or media required" });
    }

    // Create new message
    const newMessage = {
      sender: userId,
      content,
      media,
      createdAt: new Date(),
    };

    dm.messages.push(newMessage);
    dm.lastMessage = new Date();
    await dm.save();

    // Populate the new message for response
    const populatedDm = await DirectMessage.findById(dm._id).populate(
      "participants",
      "username profilePicture"
    );
    const populatedMessage = populatedDm.messages.find(
      (msg) => msg._id.toString() === newMessage._id.toString()
    );

    // Emit socket event to both users
    req.io.to(userId).emit("newDirectMessage", populatedMessage);
    req.io.to(recipientId).emit("newDirectMessage", populatedMessage);

    res.json(populatedDm);
  } catch (err) {
    console.error("Error in sendDirectMessage:", err);
    next(err);
  }
};

exports.editDirectMessage = async (req, res, next) => {
  try {
    const { recipientId, messageId } = req.params;
    const { content } = req.body;
    const files = req.files || [];
    const userId = req.user.userId;

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      console.error("editDirectMessage: Invalid recipient ID", { recipientId });
      return res.status(400).json({ message: "Invalid recipient ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      console.error("editDirectMessage: Invalid message ID", { messageId });
      return res.status(400).json({ message: "Invalid message ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("editDirectMessage: Invalid user ID", { userId });
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const dm = await DirectMessage.findOne({
      participants: { $all: [userId, recipientId] },
    });
    if (!dm) return res.status(404).json({ message: "Conversation not found" });

    const message = dm.messages.id(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.sender.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this message" });
    }

    // Process media uploads
    const media = [];
    if (files.length > 0) {
      // Delete old media from S3
      for (const oldMedia of message.media) {
        const oldKey = oldMedia.url.split(
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
            console.error("Error deleting old media from S3:", deleteError);
          }
        }
      }

      // Upload new media
      for (const file of files) {
        const fileExtension = file.originalname.split(".").pop();
        const fileName = `gossiphub/chat_media/${Date.now()}-${
          file.originalname
        }`;
        let fileType;

        if (
          ["jpg", "jpeg", "png", "gif"].includes(fileExtension.toLowerCase())
        ) {
          fileType = "image";
        } else if (
          ["mp4", "mov", "avi"].includes(fileExtension.toLowerCase())
        ) {
          fileType = "video";
        } else if (
          ["mp3", "wav", "ogg"].includes(fileExtension.toLowerCase())
        ) {
          fileType = "audio";
        } else {
          fileType = "file";
        }

        try {
          const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
          };
          const command = new PutObjectCommand(params);
          await s3Client.send(command);
          media.push({
            url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`,
            type: fileType,
          });
        } catch (uploadError) {
          console.error("Error uploading media to S3:", uploadError);
          return res.status(500).json({
            message: "Failed to upload media to S3",
            error: uploadError.message,
          });
        }
      }
    } else {
      media.push(...message.media);
    }

    if (!content && media.length === 0) {
      return res
        .status(400)
        .json({ message: "Message content or media required" });
    }

    message.content = content || message.content;
    message.media = media;
    message.isEdited = true;
    await dm.save();

    // Emit socket event
    req.io.to(userId).emit("directMessageEdited", message);
    req.io.to(recipientId).emit("directMessageEdited", message);

    res.json(dm);
  } catch (err) {
    console.error("Error in editDirectMessage:", err);
    next(err);
  }
};

exports.deleteDirectMessage = async (req, res, next) => {
  try {
    const { recipientId, messageId } = req.params;
    const userId = req.user.userId;

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      console.error("deleteDirectMessage: Invalid recipient ID", {
        recipientId,
      });
      return res.status(400).json({ message: "Invalid recipient ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      console.error("deleteDirectMessage: Invalid message ID", { messageId });
      return res.status(400).json({ message: "Invalid message ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("deleteDirectMessage: Invalid user ID", { userId });
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const dm = await DirectMessage.findOne({
      participants: { $all: [userId, recipientId] },
    });
    if (!dm) return res.status(404).json({ message: "Conversation not found" });

    const message = dm.messages.id(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.sender.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this message" });
    }

    // Delete media from S3
    for (const mediaItem of message.media) {
      const key = mediaItem.url.split(
        `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/`
      )[1];
      if (key) {
        try {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET,
              Key: key,
            })
          );
        } catch (deleteError) {
          console.error("Error deleting media from S3:", deleteError);
        }
      }
    }

    // Remove the message from the messages array
    dm.messages.pull({ _id: messageId });
    await dm.save();

    // Emit socket event
    req.io.to(userId).emit("directMessageDeleted", { messageId });
    req.io.to(recipientId).emit("directMessageDeleted", { messageId });

    res.json({ message: "Message deleted successfully" });
  } catch (err) {
    console.error("Error in deleteDirectMessage:", err);
    next(err);
  }
};

exports.getUserChatRooms = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("getUserChatRooms: Invalid user ID", { userId });
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const chatRooms = await ChatRoom.find({
      $or: [{ members: userId }, { creator: userId }],
    })
      .populate("creator", "username profilePicture")
      .populate("members", "username profilePicture")
      .sort({ lastMessage: -1 });
    res.json(chatRooms);
  } catch (err) {
    console.error("Error in getUserChatRooms:", err);
    next(err);
  }
};

exports.getRoomMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      console.error("getRoomMessages: Invalid room ID", { roomId });
      return res.status(400).json({ message: "Invalid room ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("getRoomMessages: Invalid user ID", { userId });
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) return res.status(404).json({ message: "Room not found" });

    if (!chatRoom.isPublic && !chatRoom.members.includes(userId)) {
      return res
        .status(403)
        .json({ message: "Not authorized to view messages" });
    }

    const messages = await Message.find({ room: roomId })
      .populate("sender", "username profilePicture")
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error("Error in getRoomMessages:", err);
    next(err);
  }
};

exports.getDirectMessages = async (req, res, next) => {
  try {
    const { recipientId } = req.params;
    const userId = req.user.userId;
    const providedSenderId = req.query.senderId;

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("getDirectMessages: Invalid user ID from JWT", { userId });
      return res.status(400).json({ message: "Invalid user ID" });
    }
    if (providedSenderId && providedSenderId !== userId) {
      console.error("getDirectMessages: Sender ID mismatch", {
        providedSenderId,
        userId,
      });
      return res.status(403).json({ message: "Sender ID mismatch" });
    }
    if (!recipientId) {
      console.error("getDirectMessages: Missing recipient ID", { recipientId });
      return res.status(400).json({ message: "Missing recipient ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      console.error("getDirectMessages: Invalid recipient ID", { recipientId });
      return res.status(400).json({ message: "Invalid recipient ID" });
    }

    // Check if users exist
    const [sender, recipient] = await Promise.all([
      User.findById(userId),
      User.findById(recipientId),
    ]);

    if (!sender) {
      console.error("getDirectMessages: Sender not found", { userId });
      return res.status(404).json({ message: "Sender not found" });
    }
    if (!recipient) {
      console.error("getDirectMessages: Recipient not found", { recipientId });
      return res.status(404).json({ message: "Recipient not found" });
    }

    const dm = await DirectMessage.findOne({
      participants: { $all: [userId, recipientId] },
    }).populate("participants", "username profilePicture");

    res.json(dm || { messages: [] });
  } catch (err) {
    console.error("Error in getDirectMessages:", err, {
      userId: req.user?.userId,
    });
    next(err);
  }
};

// Export the middleware for use in routes
exports.authMiddleware = authMiddleware;
