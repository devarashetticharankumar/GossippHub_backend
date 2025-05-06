// const express = require("express");
// const router = express.Router();
// const { getProfile, updateProfile } = require("../controllers/userController");
// const jwt = require("jsonwebtoken");
// const multer = require("multer");

// // Multer setup for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, "uploads/"),
//   filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
// });
// const upload = multer({
//   storage,
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
//       cb(null, true);
//     } else {
//       cb(new Error("Only JPEG and PNG files are allowed"));
//     }
//   },
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
// });

// // JWT middleware
// const authMiddleware = (req, res, next) => {
//   const token = req.header("Authorization")?.replace("Bearer ", "");
//   if (!token) return res.status(401).json({ message: "No token provided" });

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (err) {
//     res.status(401).json({ message: "Invalid token" });
//   }
// };

// router.get("/me", authMiddleware, getProfile);
// router.patch(
//   "/profile",
//   authMiddleware,
//   upload.single("profilePicture"),
//   updateProfile
// );

// module.exports = router;

const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser,
  getPublicUserProfile,
} = require("../controllers/userController");
const jwt = require("jsonwebtoken");
const multer = require("multer");

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG and PNG files are allowed"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// JWT middleware
const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Existing routes
router.get("/me", authMiddleware, getProfile);
router.patch(
  "/profile",
  authMiddleware,
  upload.single("profilePicture"),
  updateProfile
);

// New route for getting a public user profile by ID
router.get("/:id", authMiddleware, getPublicUserProfile);

// New routes for followers and following
router.get("/:id/followers", authMiddleware, getFollowers); // Get followers
router.get("/:id/following", authMiddleware, getFollowing); // Get following
router.post("/:id/follow", authMiddleware, followUser); // Follow a user
router.post("/:id/unfollow", authMiddleware, unfollowUser); // Unfollow a user

module.exports = router;
