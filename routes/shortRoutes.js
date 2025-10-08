const express = require("express");
const multer = require("multer");
const {
  createShort,
  getShorts,
  getShortById,
  updateShort,
  deleteShort,
  toggleShortLike,
  addComment,
} = require("../controllers/shortController");
const { auth } = require("../middleware/authMiddleware");

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

// Routes
router.get("/", getShorts); // all shorts (paginated)
router.get("/:shortId", getShortById); // single short
router.post("/", [auth, upload.single("video")], createShort); // upload new short
router.put("/:shortId", [auth, upload.single("media")], updateShort); // update caption
// router.delete("/:shortId", [auth, upload.single("media")], deleteShort); // delete short
router.delete("/:shortId", auth, deleteShort);

router.post("/:shortId/like", auth, toggleShortLike); // like/unlike

router.post("/:shortId/comment", auth, addComment); // add comment

module.exports = router;
