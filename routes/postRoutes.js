// const express = require("express");
// const multer = require("multer");
// const {
//   createPost,
//   getPosts,
//   addReaction,
//   addComment,
//   deletePost,
// } = require("../controllers/postController");
// const { auth } = require("../middleware/authMiddleware");

// const upload = multer({ dest: "uploads/" });

// const router = express.Router();

// router.get("/", getPosts);
// router.post("/", [auth, upload.single("media")], createPost);
// router.post("/:postId/reaction", auth, addReaction);
// router.post("/:postId/comment", auth, addComment);
// router.delete("/:postId", auth, deletePost);

// module.exports = router;

const express = require("express");
const multer = require("multer");
const {
  createPost,
  getPosts,
  addReaction,
  addComment,
  deletePost,
} = require("../controllers/postController");
const { auth } = require("../middleware/authMiddleware");

const upload = multer({ dest: "uploads/" });

const router = express.Router();

router.get("/", getPosts);
router.post("/", [auth, upload.single("media")], createPost);
router.post("/:postId/reaction", auth, addReaction);
router.post("/:postId/comment", auth, addComment);
router.delete("/:postId", auth, deletePost);

module.exports = router;
