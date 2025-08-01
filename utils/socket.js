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
