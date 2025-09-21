// module.exports = {
//   setupSocket: (io) => {
//     io.on("connection", (socket) => {
//       console.log("New client connected:", socket.id);

//       socket.on("join", (userId) => {
//         socket.join(userId);
//         console.log(`User ${userId} joined room`);
//       });

//       socket.on("disconnect", () => {
//         console.log("Client disconnected:", socket.id);
//       });
//     });

//     io.emitNotification = (userId, message) => {
//       io.to(userId).emit("notification", { message, createdAt: new Date() });
//     };

//     io.emitMessage = (receiverId, message) => {
//       io.to(receiverId.toString()).emit("newMessage", message);
//     };
//   },
// };

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// const User = require("../models/User");

// module.exports = {
//   setupSocket: (io) => {
//     io.on("connection", (socket) => {
//       console.log("New client connected:", socket.id);

//       socket.on("join", async (userId) => {
//         try {
//           socket.join(userId);
//           console.log(`User ${userId} joined room`);
//           // Update online status
//           await User.findByIdAndUpdate(userId, { onlineStatus: true });
//         } catch (err) {
//           console.error("Error joining room:", err);
//         }
//       });

//       socket.on("disconnect", async () => {
//         console.log("Client disconnected:", socket.id);
//         // Update online status (simplified; consider tracking specific socket IDs)
//         try {
//           await User.updateMany(
//             { socketId: socket.id },
//             { onlineStatus: false }
//           );
//         } catch (err) {
//           console.error("Error updating online status:", err);
//         }
//       });
//     });

//     io.emitNotification = (userId, message) => {
//       io.to(userId).emit("notification", { message, createdAt: new Date() });
//     };

//     io.emitMessage = (receiverId, message) => {
//       io.to(receiverId.toString()).emit("newMessage", message);
//     };
//   },
// };

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const User = require("../models/User");
const Message = require("../models/Message");
const jwt = require("jsonwebtoken"); // Ensure this is included

module.exports = {
  setupSocket: (io) => {
    io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication error"));
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        next();
      } catch (err) {
        next(new Error("Invalid token"));
      }
    });

    io.on("connection", (socket) => {
      console.log("New client connected:", socket.id);

      // Join user's room and update online status
      socket.join(socket.userId);
      User.findByIdAndUpdate(socket.userId, { onlineStatus: true }).exec();
      socket.broadcast.emit("userOnline", socket.userId);

      // Handle disconnect and update offline status
      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
        User.findByIdAndUpdate(socket.userId, { onlineStatus: false }).exec();
        socket.broadcast.emit("userOffline", socket.userId);
      });

      // Typing indicator
      socket.on("typing", (receiverId) => {
        socket
          .to(receiverId.toString())
          .emit("typing", { userId: socket.userId });
      });

      socket.on("stopTyping", (receiverId) => {
        socket
          .to(receiverId.toString())
          .emit("stopTyping", { userId: socket.userId });
      });

      // Send message
      socket.on("sendMessage", async (data) => {
        const { receiverId, groupId, content, media, type, expireAfter } = data;
        const receivers =
          type === "broadcast"
            ? (await User.find().select("_id")).map((u) => u._id)
            : [new mongoose.Types.ObjectId(receiverId)];
        const message = new Message({
          sender: socket.userId,
          receiver: receivers,
          content,
          media,
          type,
          groupId:
            type === "group" ? new mongoose.Types.ObjectId(groupId) : null,
          expireAt: expireAfter
            ? new Date(Date.now() + expireAfter * 1000)
            : null,
        });
        await message.save();
        const populatedMessage = await Message.findById(message._id)
          .populate("sender", "username profilePicture")
          .populate("receiver", "username profilePicture");
        receivers.forEach((r) =>
          io.to(r.toString()).emit("newMessage", populatedMessage)
        );
      });

      // Mark message as read
      socket.on("markSeen", async ({ messageId }) => {
        const userId = socket.userId;
        const query = {
          _id: messageId,
          receiver: userId,
        };
        query["isRead." + userId] = false; // Dynamic key construction outside object literal

        const update = {
          $set: { ["isRead." + userId]: true },
        };

        const message = await Message.findOneAndUpdate(query, update, {
          new: true,
        }).populate("sender", "username profilePicture");
        if (message) {
          io.to(message.sender.toString()).emit("messageSeen", {
            messageId,
            status: "read",
          });
        }
      });

      // Delete message
      socket.on("deleteMessage", async ({ messageId }) => {
        const message = await Message.findById(messageId);
        if (message && message.sender.toString() === socket.userId) {
          message.deletedFor[socket.userId] = true;
          if (
            Object.values(message.deletedFor).every(Boolean) &&
            message.type === "one-on-one"
          ) {
            await Message.deleteOne({ _id: messageId });
          } else {
            await message.save();
          }
          message.receiver.forEach((r) =>
            io.to(r.toString()).emit("messageDeleted", messageId)
          );
        }
      });

      // Edit message
      socket.on("editMessage", async ({ messageId, content }) => {
        const message = await Message.findOneAndUpdate(
          { _id: messageId, sender: socket.userId },
          {
            content: sanitizeHtml(content),
            edited: true,
            editedContent: content,
          },
          { new: true }
        ).populate("sender", "username profilePicture");
        if (message) {
          message.receiver.forEach((r) =>
            io.to(r.toString()).emit("messageEdited", { messageId, content })
          );
        }
      });

      // Reply to message
      socket.on("replyToMessage", async (data) => {
        const { receiverId, content, replyTo } = data;
        const message = new Message({
          sender: socket.userId,
          receiver: [new mongoose.Types.ObjectId(receiverId)],
          content: sanitizeHtml(content),
          replyTo: new mongoose.Types.ObjectId(replyTo),
        });
        await message.save();
        const populatedMessage = await Message.findById(message._id)
          .populate("sender", "username profilePicture")
          .populate("replyTo", "content");
        io.to(receiverId.toString()).emit("newMessage", populatedMessage);
      });

      // Forward message
      socket.on("forwardMessage", async (data) => {
        const { messageId, receiverId } = data;
        const originalMessage = await Message.findById(messageId);
        if (originalMessage) {
          const newMessage = new Message({
            sender: socket.userId,
            receiver: [new mongoose.Types.ObjectId(receiverId)],
            content: originalMessage.content,
            media: originalMessage.media,
            forwardCount: originalMessage.forwardCount + 1,
          });
          await newMessage.save();
          const populatedMessage = await Message.findById(
            newMessage._id
          ).populate("sender", "username profilePicture");
          io.to(receiverId.toString()).emit("newMessage", populatedMessage);
        }
      });

      // Star message
      socket.on("starMessage", async ({ messageId }) => {
        const message = await Message.findById(messageId);
        if (message && !message.starredBy.includes(socket.userId)) {
          message.starredBy.push(socket.userId);
          await message.save();
          io.to(socket.userId.toString()).emit("messageStarred", messageId);
        }
      });
    });

    io.emitNotification = (userId, message) => {
      io.to(userId).emit("notification", { message, createdAt: new Date() });
    };

    io.emitMessage = (receiverId, message) => {
      io.to(receiverId.toString()).emit("newMessage", message);
    };
  },
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// const { Message, DirectMessage } = require("../models/chat");
// const User = require("../models/User");
// const jwt = require("jsonwebtoken");
// const mongoose = require("mongoose");
// const sanitizeHtml = require("sanitize-html");

// module.exports = {
//   setupSocket: (io) => {
//     // Socket.IO middleware for authentication
//     io.use(async (socket, next) => {
//       const token = socket.handshake.auth.token;
//       const userId = socket.handshake.query.userId;

//       // Validate token and userId
//       if (!token || !userId) {
//         console.error("Authentication error: Missing token or userId", {
//           token: !!token,
//           userId: !!userId,
//           socketId: socket.id,
//         });
//         return next(new Error("Authentication error: Missing token or userId"));
//       }

//       try {
//         // Verify JWT token
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         if (decoded.userId !== userId) {
//           console.error("Authentication error: userId mismatch", {
//             decodedUserId: decoded.userId,
//             userId,
//             socketId: socket.id,
//           });
//           return next(new Error("Authentication error: Invalid userId"));
//         }

//         // Verify user exists
//         const user = await User.findById(userId).select(
//           "username profilePicture"
//         );
//         if (!user) {
//           console.error("Authentication error: User not found", {
//             userId,
//             socketId: socket.id,
//           });
//           return next(new Error("Authentication error: User not found"));
//         }

//         socket.userId = userId;
//         socket.user = user; // Attach user object for convenience
//         console.log("Socket authenticated:", { userId, socketId: socket.id });
//         next();
//       } catch (err) {
//         console.error("Authentication error:", {
//           error: err.message,
//           socketId: socket.id,
//         });
//         return next(new Error("Authentication error: Invalid token"));
//       }
//     });

//     io.on("connection", (socket) => {
//       console.log("New client connected:", {
//         socketId: socket.id,
//         userId: socket.userId,
//       });

//       // Handle joinUser event (for direct messaging)
//       socket.on("joinUser", (userId) => {
//         if (userId === socket.userId) {
//           socket.join(userId);
//           console.log(`User ${userId} joined their room`, {
//             socketId: socket.id,
//           });
//           // Update online status
//           User.findByIdAndUpdate(userId, { onlineStatus: true })
//             .exec()
//             .catch((err) =>
//               console.error("Error updating online status:", {
//                 userId,
//                 error: err.message,
//               })
//             );
//           socket.broadcast.emit("userOnline", userId);
//         } else {
//           console.error("Join failed: userId mismatch", {
//             userId,
//             socketUserId: socket.userId,
//             socketId: socket.id,
//           });
//           socket.emit("error", { message: "Invalid userId for joinUser" });
//         }
//       });

//       // Handle joining a chat room
//       socket.on("joinRoom", (roomId) => {
//         if (!mongoose.Types.ObjectId.isValid(roomId)) {
//           console.error("Invalid roomId:", { roomId, socketId: socket.id });
//           socket.emit("error", { message: "Invalid room ID" });
//           return;
//         }

//         socket.join(roomId);
//         console.log(`User ${socket.userId} joined room ${roomId}`, {
//           socketId: socket.id,
//         });
//       });

//       // Handle disconnect
//       socket.on("disconnect", () => {
//         console.log("Client disconnected:", {
//           socketId: socket.id,
//           userId: socket.userId,
//         });
//         User.findByIdAndUpdate(socket.userId, { onlineStatus: false })
//           .exec()
//           .catch((err) =>
//             console.error("Error updating offline status:", {
//               userId: socket.userId,
//               error: err.message,
//             })
//           );
//         socket.broadcast.emit("userOffline", socket.userId);
//       });

//       // Typing indicator for direct messages
//       socket.on("typing", (recipientId) => {
//         if (mongoose.Types.ObjectId.isValid(recipientId)) {
//           io.to(recipientId).emit("typing", { userId: socket.userId });
//           console.log("Typing event:", { userId: socket.userId, recipientId });
//         }
//       });

//       socket.on("stopTyping", (recipientId) => {
//         if (mongoose.Types.ObjectId.isValid(recipientId)) {
//           io.to(recipientId).emit("stopTyping", { userId: socket.userId });
//           console.log("Stop typing event:", {
//             userId: socket.userId,
//             recipientId,
//           });
//         }
//       });

//       // Typing indicator for chat rooms
//       socket.on("roomTyping", ({ roomId }) => {
//         if (mongoose.Types.ObjectId.isValid(roomId)) {
//           socket.to(roomId).emit("roomTyping", { userId: socket.userId });
//           console.log("Room typing event:", { userId: socket.userId, roomId });
//         }
//       });

//       socket.on("roomStopTyping", ({ roomId }) => {
//         if (mongoose.Types.ObjectId.isValid(roomId)) {
//           socket.to(roomId).emit("roomStopTyping", { userId: socket.userId });
//           console.log("Room stop typing event:", {
//             userId: socket.userId,
//             roomId,
//           });
//         }
//       });

//       // Send direct message
//       socket.on("sendDirectMessage", async (data) => {
//         const { recipientId, content, media } = data;

//         if (!mongoose.Types.ObjectId.isValid(recipientId)) {
//           console.error("Invalid recipientId:", {
//             recipientId,
//             socketId: socket.id,
//           });
//           socket.emit("error", { message: "Invalid recipient ID" });
//           return;
//         }

//         try {
//           // Validate users
//           const [sender, recipient] = await Promise.all([
//             User.findById(socket.userId),
//             User.findById(recipientId),
//           ]);
//           if (!sender || !recipient) {
//             console.error("User not found:", {
//               sender: !sender,
//               recipient: !recipient,
//               socketId: socket.id,
//             });
//             socket.emit("error", { message: "Sender or recipient not found" });
//             return;
//           }

//           // Sanitize content
//           const sanitizedContent = content ? sanitizeHtml(content) : content;
//           if (!sanitizedContent && (!media || media.length === 0)) {
//             console.error("Invalid message: No content or media", {
//               socketId: socket.id,
//             });
//             socket.emit("error", {
//               message: "Message content or media required",
//             });
//             return;
//           }

//           // Find or create direct message conversation
//           let dm = await DirectMessage.findOne({
//             participants: { $all: [socket.userId, recipientId] },
//           });
//           if (!dm) {
//             dm = new DirectMessage({
//               participants: [socket.userId, recipientId],
//               messages: [],
//             });
//           }

//           // Create new message
//           const newMessage = {
//             sender: socket.userId,
//             content: sanitizedContent,
//             media: media || [],
//             createdAt: new Date(),
//           };
//           dm.messages.push(newMessage);
//           dm.lastMessage = new Date();
//           await dm.save();

//           // Populate the message
//           const populatedDm = await DirectMessage.findById(dm._id).populate(
//             "participants",
//             "username profilePicture"
//           );
//           const populatedMessage = populatedDm.messages.find(
//             (msg) => msg._id.toString() === newMessage._id.toString()
//           );

//           // Emit to sender and recipient
//           io.to(socket.userId).emit("newDirectMessage", populatedMessage);
//           io.to(recipientId).emit("newDirectMessage", populatedMessage);
//           console.log("Direct message sent:", {
//             messageId: newMessage._id,
//             sender: socket.userId,
//             recipient: recipientId,
//             socketId: socket.id,
//           });
//         } catch (err) {
//           console.error("Error sending direct message:", {
//             recipientId,
//             userId: socket.userId,
//             error: err.message,
//             socketId: socket.id,
//           });
//           socket.emit("error", { message: "Failed to send direct message" });
//         }
//       });

//       // Edit direct message
//       socket.on(
//         "editDirectMessage",
//         async ({ messageId, recipientId, content, media }) => {
//           if (
//             !mongoose.Types.ObjectId.isValid(messageId) ||
//             !mongoose.Types.ObjectId.isValid(recipientId)
//           ) {
//             console.error("Invalid messageId or recipientId:", {
//               messageId,
//               recipientId,
//               socketId: socket.id,
//             });
//             socket.emit("error", {
//               message: "Invalid message or recipient ID",
//             });
//             return;
//           }

//           try {
//             const dm = await DirectMessage.findOne({
//               participants: { $all: [socket.userId, recipientId] },
//             });
//             if (!dm) {
//               console.error("Conversation not found:", {
//                 userId: socket.userId,
//                 recipientId,
//                 socketId: socket.id,
//               });
//               socket.emit("error", { message: "Conversation not found" });
//               return;
//             }

//             const message = dm.messages.id(messageId);
//             if (!message) {
//               console.error("Message not found:", {
//                 messageId,
//                 socketId: socket.id,
//               });
//               socket.emit("error", { message: "Message not found" });
//               return;
//             }
//             if (message.sender.toString() !== socket.userId) {
//               console.error("Unauthorized edit attempt:", {
//                 messageId,
//                 userId: socket.userId,
//                 socketId: socket.id,
//               });
//               socket.emit("error", {
//                 message: "Not authorized to edit this message",
//               });
//               return;
//             }

//             const sanitizedContent = content ? sanitizeHtml(content) : content;
//             if (!sanitizedContent && (!media || media.length === 0)) {
//               console.error("Invalid edit: No content or media", {
//                 messageId,
//                 socketId: socket.id,
//               });
//               socket.emit("error", {
//                 message: "Message content or media required",
//               });
//               return;
//             }

//             message.content = sanitizedContent || message.content;
//             message.media = media || message.media;
//             message.isEdited = true;
//             message.createdAt = new Date(); // Update timestamp to createdAt as per schema
//             await dm.save();

//             // Emit to sender and recipient
//             io.to(socket.userId).emit("directMessageEdited", message);
//             io.to(recipientId).emit("directMessageEdited", message);
//             console.log("Direct message edited:", {
//               messageId,
//               userId: socket.userId,
//               socketId: socket.id,
//             });
//           } catch (err) {
//             console.error("Error editing direct message:", {
//               messageId,
//               recipientId,
//               userId: socket.userId,
//               error: err.message,
//               socketId: socket.id,
//             });
//             socket.emit("error", { message: "Failed to edit direct message" });
//           }
//         }
//       );

//       // Delete direct message
//       socket.on("deleteDirectMessage", async ({ messageId, recipientId }) => {
//         if (
//           !mongoose.Types.ObjectId.isValid(messageId) ||
//           !mongoose.Types.ObjectId.isValid(recipientId)
//         ) {
//           console.error("Invalid messageId or recipientId:", {
//             messageId,
//             recipientId,
//             socketId: socket.id,
//           });
//           socket.emit("error", { message: "Invalid message or recipient ID" });
//           return;
//         }

//         try {
//           const dm = await DirectMessage.findOne({
//             participants: { $all: [socket.userId, recipientId] },
//           });
//           if (!dm) {
//             console.error("Conversation not found:", {
//               userId: socket.userId,
//               recipientId,
//               socketId: socket.id,
//             });
//             socket.emit("error", { message: "Conversation not found" });
//             return;
//           }

//           const message = dm.messages.id(messageId);
//           if (!message) {
//             console.error("Message not found:", {
//               messageId,
//               socketId: socket.id,
//             });
//             socket.emit("error", { message: "Message not found" });
//             return;
//           }
//           if (message.sender.toString() !== socket.userId) {
//             console.error("Unauthorized delete attempt:", {
//               messageId,
//               userId: socket.userId,
//               socketId: socket.id,
//             });
//             socket.emit("error", {
//               message: "Not authorized to delete this message",
//             });
//             return;
//           }

//           dm.messages.pull({ _id: messageId });
//           await dm.save();

//           // Emit to sender and recipient
//           io.to(socket.userId).emit("directMessageDeleted", { messageId });
//           io.to(recipientId).emit("directMessageDeleted", { messageId });
//           console.log("Direct message deleted:", {
//             messageId,
//             userId: socket.userId,
//             socketId: socket.id,
//           });
//         } catch (err) {
//           console.error("Error deleting direct message:", {
//             messageId,
//             recipientId,
//             userId: socket.userId,
//             error: err.message,
//             socketId: socket.id,
//           });
//           socket.emit("error", { message: "Failed to delete direct message" });
//         }
//       });

//       // Send room message
//       socket.on("sendRoomMessage", async ({ roomId, content, media }) => {
//         if (!mongoose.Types.ObjectId.isValid(roomId)) {
//           console.error("Invalid roomId:", { roomId, socketId: socket.id });
//           socket.emit("error", { message: "Invalid room ID" });
//           return;
//         }

//         try {
//           const chatRoom = await ChatRoom.findById(roomId);
//           if (!chatRoom) {
//             console.error("Room not found:", { roomId, socketId: socket.id });
//             socket.emit("error", { message: "Room not found" });
//             return;
//           }
//           if (!chatRoom.isPublic && !chatRoom.members.includes(socket.userId)) {
//             console.error("Unauthorized room access:", {
//               roomId,
//               userId: socket.userId,
//               socketId: socket.id,
//             });
//             socket.emit("error", {
//               message: "Not authorized to send message to this room",
//             });
//             return;
//           }

//           const sanitizedContent = content ? sanitizeHtml(content) : content;
//           if (!sanitizedContent && (!media || media.length === 0)) {
//             console.error("Invalid message: No content or media", {
//               roomId,
//               socketId: socket.id,
//             });
//             socket.emit("error", {
//               message: "Message content or media required",
//             });
//             return;
//           }

//           const message = new Message({
//             sender: socket.userId,
//             content: sanitizedContent,
//             media: media || [],
//             room: roomId,
//             createdAt: new Date(),
//           });
//           await message.save();
//           chatRoom.lastMessage = new Date();
//           await chatRoom.save();

//           const populatedMessage = await Message.findById(message._id).populate(
//             "sender",
//             "username profilePicture"
//           );

//           socket.to(roomId).emit("newMessage", populatedMessage);
//           io.to(socket.userId).emit("newMessage", populatedMessage); // Echo to sender
//           console.log("Room message sent:", {
//             messageId: message._id,
//             roomId,
//             userId: socket.userId,
//             socketId: socket.id,
//           });
//         } catch (err) {
//           console.error("Error sending room message:", {
//             roomId,
//             userId: socket.userId,
//             error: err.message,
//             socketId: socket.id,
//           });
//           socket.emit("error", { message: "Failed to send room message" });
//         }
//       });

//       // Edit room message
//       socket.on(
//         "editRoomMessage",
//         async ({ roomId, messageId, content, media }) => {
//           if (
//             !mongoose.Types.ObjectId.isValid(roomId) ||
//             !mongoose.Types.ObjectId.isValid(messageId)
//           ) {
//             console.error("Invalid roomId or messageId:", {
//               roomId,
//               messageId,
//               socketId: socket.id,
//             });
//             socket.emit("error", { message: "Invalid room or message ID" });
//             return;
//           }

//           try {
//             const chatRoom = await ChatRoom.findById(roomId);
//             if (!chatRoom) {
//               console.error("Room not found:", { roomId, socketId: socket.id });
//               socket.emit("error", { message: "Room not found" });
//               return;
//             }
//             if (
//               !chatRoom.isPublic &&
//               !chatRoom.members.includes(socket.userId)
//             ) {
//               console.error("Unauthorized room access:", {
//                 roomId,
//                 userId: socket.userId,
//                 socketId: socket.id,
//               });
//               socket.emit("error", {
//                 message: "Not authorized to edit messages in this room",
//               });
//               return;
//             }

//             const message = await Message.findById(messageId);
//             if (!message) {
//               console.error("Message not found:", {
//                 messageId,
//                 socketId: socket.id,
//               });
//               socket.emit("error", { message: "Message not found" });
//               return;
//             }
//             if (message.sender.toString() !== socket.userId) {
//               console.error("Unauthorized edit attempt:", {
//                 messageId,
//                 userId: socket.userId,
//                 socketId: socket.id,
//               });
//               socket.emit("error", {
//                 message: "Not authorized to edit this message",
//               });
//               return;
//             }

//             const sanitizedContent = content ? sanitizeHtml(content) : content;
//             if (!sanitizedContent && (!media || media.length === 0)) {
//               console.error("Invalid edit: No content or media", {
//                 messageId,
//                 socketId: socket.id,
//               });
//               socket.emit("error", {
//                 message: "Message content or media required",
//               });
//               return;
//             }

//             message.content = sanitizedContent || message.content;
//             message.media = media || message.media;
//             message.isEdited = true;
//             message.createdAt = new Date(); // Update timestamp to createdAt as per schema
//             await message.save();

//             const populatedMessage = await Message.findById(
//               message._id
//             ).populate("sender", "username profilePicture");

//             socket.to(roomId).emit("messageEdited", populatedMessage);
//             io.to(socket.userId).emit("messageEdited", populatedMessage); // Echo to sender
//             console.log("Room message edited:", {
//               messageId,
//               roomId,
//               userId: socket.userId,
//               socketId: socket.id,
//             });
//           } catch (err) {
//             console.error("Error editing room message:", {
//               roomId,
//               messageId,
//               userId: socket.userId,
//               error: err.message,
//               socketId: socket.id,
//             });
//             socket.emit("error", { message: "Failed to edit room message" });
//           }
//         }
//       );

//       // Delete room message
//       socket.on("deleteRoomMessage", async ({ roomId, messageId }) => {
//         if (
//           !mongoose.Types.ObjectId.isValid(roomId) ||
//           !mongoose.Types.ObjectId.isValid(messageId)
//         ) {
//           console.error("Invalid roomId or messageId:", {
//             roomId,
//             messageId,
//             socketId: socket.id,
//           });
//           socket.emit("error", { message: "Invalid room or message ID" });
//           return;
//         }

//         try {
//           const chatRoom = await ChatRoom.findById(roomId);
//           if (!chatRoom) {
//             console.error("Room not found:", { roomId, socketId: socket.id });
//             socket.emit("error", { message: "Room not found" });
//             return;
//           }
//           if (!chatRoom.isPublic && !chatRoom.members.includes(socket.userId)) {
//             console.error("Unauthorized room access:", {
//               roomId,
//               userId: socket.userId,
//               socketId: socket.id,
//             });
//             socket.emit("error", {
//               message: "Not authorized to delete messages in this room",
//             });
//             return;
//           }

//           const message = await Message.findById(messageId);
//           if (!message) {
//             console.error("Message not found:", {
//               messageId,
//               socketId: socket.id,
//             });
//             socket.emit("error", { message: "Message not found" });
//             return;
//           }
//           if (message.sender.toString() !== socket.userId) {
//             console.error("Unauthorized delete attempt:", {
//               messageId,
//               userId: socket.userId,
//               socketId: socket.id,
//             });
//             socket.emit("error", {
//               message: "Not authorized to delete this message",
//             });
//             return;
//           }

//           await Message.findByIdAndDelete(messageId);

//           socket.to(roomId).emit("messageDeleted", { messageId });
//           io.to(socket.userId).emit("messageDeleted", { messageId }); // Echo to sender
//           console.log("Room message deleted:", {
//             messageId,
//             roomId,
//             userId: socket.userId,
//             socketId: socket.id,
//           });
//         } catch (err) {
//           console.error("Error deleting room message:", {
//             roomId,
//             messageId,
//             userId: socket.userId,
//             error: err.message,
//             socketId: socket.id,
//           });
//           socket.emit("error", { message: "Failed to delete room message" });
//         }
//       });

//       // Mark message as read (for direct messages)
//       socket.on("markSeen", async ({ messageId, recipientId }) => {
//         if (
//           !mongoose.Types.ObjectId.isValid(messageId) ||
//           !mongoose.Types.ObjectId.isValid(recipientId)
//         ) {
//           console.error("Invalid messageId or recipientId:", {
//             messageId,
//             recipientId,
//             socketId: socket.id,
//           });
//           socket.emit("error", { message: "Invalid message or recipient ID" });
//           return;
//         }

//         try {
//           const dm = await DirectMessage.findOne({
//             participants: { $all: [socket.userId, recipientId] },
//           });
//           if (!dm) {
//             console.error("Conversation not found:", {
//               userId: socket.userId,
//               recipientId,
//               socketId: socket.id,
//             });
//             socket.emit("error", { message: "Conversation not found" });
//             return;
//           }

//           const message = dm.messages.id(messageId);
//           if (!message) {
//             console.error("Message not found:", {
//               messageId,
//               socketId: socket.id,
//             });
//             socket.emit("error", { message: "Message not found" });
//             return;
//           }
//           if (message.sender.toString() === socket.userId) {
//             console.error("Cannot mark own message as read:", {
//               messageId,
//               userId: socket.userId,
//               socketId: socket.id,
//             });
//             socket.emit("error", {
//               message: "Cannot mark own message as read",
//             });
//             return;
//           }

//           message.isRead = true;
//           await dm.save();

//           io.to(message.sender).emit("messageSeen", {
//             messageId,
//             status: "read",
//           });
//           console.log("Direct message marked as read:", {
//             messageId,
//             userId: socket.userId,
//             socketId: socket.id,
//           });
//         } catch (err) {
//           console.error("Error marking direct message as read:", {
//             messageId,
//             recipientId,
//             userId: socket.userId,
//             error: err.message,
//             socketId: socket.id,
//           });
//           socket.emit("error", { message: "Failed to mark message as read" });
//         }
//       });

//       // Mark room message as read
//       socket.on("markRoomMessageSeen", async ({ messageId, roomId }) => {
//         if (
//           !mongoose.Types.ObjectId.isValid(messageId) ||
//           !mongoose.Types.ObjectId.isValid(roomId)
//         ) {
//           console.error("Invalid messageId or roomId:", {
//             messageId,
//             roomId,
//             socketId: socket.id,
//           });
//           socket.emit("error", { message: "Invalid message or room ID" });
//           return;
//         }

//         try {
//           const chatRoom = await ChatRoom.findById(roomId);
//           if (!chatRoom) {
//             console.error("Room not found:", { roomId, socketId: socket.id });
//             socket.emit("error", { message: "Room not found" });
//             return;
//           }
//           if (!chatRoom.isPublic && !chatRoom.members.includes(socket.userId)) {
//             console.error("Unauthorized room access:", {
//               roomId,
//               userId: socket.userId,
//               socketId: socket.id,
//             });
//             socket.emit("error", {
//               message: "Not authorized to view messages in this room",
//             });
//             return;
//           }

//           const message = await Message.findById(messageId);
//           if (!message) {
//             console.error("Message not found:", {
//               messageId,
//               socketId: socket.id,
//             });
//             socket.emit("error", { message: "Message not found" });
//             return;
//           }
//           if (message.sender.toString() === socket.userId) {
//             console.error("Cannot mark own message as read:", {
//               messageId,
//               userId: socket.userId,
//               socketId: socket.id,
//             });
//             socket.emit("error", {
//               message: "Cannot mark own message as read",
//             });
//             return;
//           }

//           message.isRead = true;
//           await message.save();

//           io.to(message.sender).emit("messageSeen", {
//             messageId,
//             status: "read",
//           });
//           console.log("Room message marked as read:", {
//             messageId,
//             roomId,
//             userId: socket.userId,
//             socketId: socket.id,
//           });
//         } catch (err) {
//           console.error("Error marking room message as read:", {
//             messageId,
//             roomId,
//             userId: socket.userId,
//             error: err.message,
//             socketId: socket.id,
//           });
//           socket.emit("error", { message: "Failed to mark message as read" });
//         }
//       });
//     });

//     // Utility to emit notifications
//     io.emitNotification = (userId, message) => {
//       io.to(userId).emit("notification", { message, createdAt: new Date() });
//     };

//     // Utility to emit direct messages
//     io.emitMessage = (receiverId, message) => {
//       io.to(receiverId).emit("newDirectMessage", message);
//     };

//     // Utility to emit room messages
//     io.emitRoomMessage = (roomId, message) => {
//       io.to(roomId).emit("newMessage", message);
//     };
//   },
// };
