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
/////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
////////////////////////////////////////////////

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

//today's update 13-05-2025

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////04-06-2025

// const express = require("express");
// const multer = require("multer");
// const {
//   createPost,
//   getPosts,
//   addReaction,
//   addComment,
//   addCommentReaction,
//   deletePost,
// } = require("../controllers/postController");
// const { auth } = require("../middleware/authMiddleware");
// const upload = multer({ dest: "uploads/" });

// const router = express.Router();

// router.get("/", getPosts);
// router.post("/", [auth, upload.single("media")], createPost);
// router.post("/:postId/reaction", auth, addReaction);
// router.post("/:postId/comment", auth, addComment);
// router.post("/:postId/comment/:commentId/reaction", auth, addCommentReaction);
// router.delete("/:postId", auth, deletePost);

// module.exports = router;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////#hastag impemented code
const express = require("express");
const multer = require("multer");
const {
  createPost,
  getPosts,
  addReaction,
  addComment,
  addCommentReaction,
  deletePost,
} = require("../controllers/postController");
const { auth } = require("../middleware/authMiddleware");

// Use memoryStorage for multer to access file.buffer
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.get("/", getPosts);
router.post("/", [auth, upload.single("media")], createPost);
router.post("/:postId/reaction", auth, addReaction);
router.post("/:postId/comment", auth, addComment);
router.post("/:postId/comment/:commentId/reaction", auth, addCommentReaction);
router.delete("/:postId", auth, deletePost);

module.exports = router;
