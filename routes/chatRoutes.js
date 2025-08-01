// const express = require("express");
// const router = express.Router();
// const { auth } = require("../middleware/authMiddleware");
// const multer = require("multer");
// const {
//   getChats,
//   sendMessage,
//   markMessageAsRead,
//   deleteMessage,
//   reportMessage,
//   blockUser,
//   getMessages,
//   unblockUser,
// } = require("../controllers/chatController");

// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = ["image/jpeg", "image/png", "video/mp4", "image/gif"];
//     if (allowedTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only JPEG, PNG, MP4, and GIF files are allowed"), false);
//     }
//   },
// });

// router.get("/chats", auth, getChats);
// router.get("/messages/:userId", auth, getMessages);
// router.post("/send/:receiverId", auth, upload.single("media"), sendMessage);
// router.patch("/messages/:messageId/read", auth, markMessageAsRead);
// router.delete("/messages/:messageId", auth, deleteMessage);
// router.post("/report/:messageId", auth, reportMessage);
// router.post("/block/:userId", auth, blockUser);
// router.post("/unblock/:userId", auth, blockUser);

// module.exports = router;

const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/authMiddleware");
const multer = require("multer");
const {
  getChats,
  getMessages,
  sendMessage,
  markMessageAsRead,
  deleteMessage,
  reportMessage,
  blockUser,
  unblockUser,
  editMessage,
  replyToMessage,
  forwardMessage,
  starMessage,
} = require("../controllers/chatController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // Increased to 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "video/mp4",
      "image/gif",
      "audio/mpeg",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"), false);
    }
  },
});

router.get("/chats", auth, getChats);
router.get("/messages", auth, getMessages); // Query params: userId or groupId
router.post("/send", auth, upload.array("media", 10), sendMessage); // Multiple media
router.patch("/messages/:messageId/read", auth, markMessageAsRead);
router.delete("/messages/:messageId", auth, deleteMessage);
router.post("/report/:messageId", auth, reportMessage);
router.post("/block/:userId", auth, blockUser);
router.post("/unblock/:userId", auth, unblockUser);
router.patch("/messages/:messageId/edit", auth, editMessage);
router.post("/messages/:messageId/reply", auth, replyToMessage);
router.post("/messages/:messageId/forward", auth, forwardMessage);
router.post("/messages/:messageId/star", auth, starMessage);

module.exports = router;
