// const express = require("express");
// const router = express.Router();
// const { auth } = require("../middleware/authMiddleware");
// const multer = require("multer");
// const {
//   getChats,
//   getMessages,
//   sendMessage,
//   markMessageAsRead,
//   deleteMessage,
//   reportMessage,
//   blockUser,
//   unblockUser,
//   editMessage,
//   replyToMessage,
//   forwardMessage,
//   starMessage,
// } = require("../controllers/chatController");

// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: { fileSize: 10 * 1024 * 1024 }, // Increased to 10MB
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = [
//       "image/jpeg",
//       "image/png",
//       "video/mp4",
//       "image/gif",
//       "audio/mpeg",
//       "application/pdf",
//     ];
//     if (allowedTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error("Unsupported file type"), false);
//     }
//   },
// });

// router.get("/chats", auth, getChats);
// router.get("/messages", auth, getMessages); // Query params: userId or groupId
// router.post("/send", auth, upload.array("media", 10), sendMessage); // Multiple media
// router.patch("/messages/:messageId/read", auth, markMessageAsRead);
// router.delete("/messages/:messageId", auth, deleteMessage);
// router.post("/report/:messageId", auth, reportMessage);
// router.post("/block/:userId", auth, blockUser);
// router.post("/unblock/:userId", auth, unblockUser);
// router.patch("/messages/:messageId/edit", auth, editMessage);
// router.post("/messages/:messageId/reply", auth, replyToMessage);
// router.post("/messages/:messageId/forward", auth, forwardMessage);
// router.post("/messages/:messageId/star", auth, starMessage);

// module.exports = router;

const express = require("express");
const multer = require("multer");
const { Server } = require("socket.io");
const {
  createChatRoom,
  joinChatRoom,
  sendRoomMessage,
  editRoomMessage,
  deleteRoomMessage,
  sendDirectMessage,
  editDirectMessage,
  deleteDirectMessage,
  getUserChatRooms,
  getRoomMessages,
  getDirectMessages,
} = require("../controllers/chatController");
const { auth } = require("../middleware/authMiddleware");

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "video/mp4",
      "video/mov",
      "video/avi",
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "application/pdf",
      "text/plain",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Multer error handling
const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Socket.IO middleware
router.use((req, res, next) => {
  req.io = req.app.get("io");
  next();
});

// Chat routes
router.post("/room", auth, createChatRoom);
router.post("/room/:roomId/join", auth, joinChatRoom);
router.post(
  "/room/:roomId/message",
  auth,
  upload.array("media", 5),
  multerErrorHandler,
  sendRoomMessage
);
router.put(
  "/room/:roomId/message/:messageId",
  auth,
  upload.array("media", 5),
  multerErrorHandler,
  editRoomMessage
);
router.delete("/room/:roomId/message/:messageId", auth, deleteRoomMessage);
router.post(
  "/dm",
  auth,
  upload.array("media", 5),
  multerErrorHandler,
  sendDirectMessage
);
router.put(
  "/dm/:recipientId/message/:messageId",
  auth,
  upload.array("media", 5),
  multerErrorHandler,
  editDirectMessage
);
router.delete("/dm/:recipientId/message/:messageId", auth, deleteDirectMessage);
router.get("/rooms", auth, getUserChatRooms);
router.get("/room/:roomId/messages", auth, getRoomMessages);
router.get("/dm/:recipientId", auth, getDirectMessages);

// Socket.IO setup
const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinUser", (userId) => {
      socket.join(userId);
    });

    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

module.exports = {
  router,
  setupSocket,
};
