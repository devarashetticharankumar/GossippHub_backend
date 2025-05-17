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
/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////

// const express = require("express");
// const router = express.Router();
// const {
//   getProfile,
//   updateProfile,
//   getFollowers,
//   getFollowing,
//   followUser,
//   unfollowUser,
//   getPublicUserProfile,
// } = require("../controllers/userController");
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

// // Existing routes
// router.get("/me", authMiddleware, getProfile);
// router.patch(
//   "/profile",
//   authMiddleware,
//   upload.single("profilePicture"),
//   updateProfile
// );

// // New route for getting a public user profile by ID
// router.get("/:id", authMiddleware, getPublicUserProfile);

// // New routes for followers and following
// router.get("/:id/followers", authMiddleware, getFollowers); // Get followers
// router.get("/:id/following", authMiddleware, getFollowing); // Get following
// router.post("/:id/follow", authMiddleware, followUser); // Follow a user
// router.post("/:id/unfollow", authMiddleware, unfollowUser); // Unfollow a user

// module.exports = router;

//////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////

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
  getUsers, // Import the new controller function
} = require("../controllers/userController");
const jwt = require("jsonwebtoken");
const multer = require("multer");

// Multer setup for file uploads (store in memory for Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG and PNG files are allowed"), false);
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

// Error handling middleware for Multer
const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Handle Multer-specific errors (e.g., file size limit exceeded)
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File size exceeds 5MB limit" });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    // Handle custom Multer errors (e.g., invalid file type)
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Routes
router.get("/me", authMiddleware, getProfile);
router.patch(
  "/profile",
  authMiddleware,
  upload.single("profilePicture"),
  multerErrorHandler,
  updateProfile
);
router.get("/:id", authMiddleware, getPublicUserProfile);
router.get("/:id/followers", authMiddleware, getFollowers);
router.get("/:id/following", authMiddleware, getFollowing);
router.post("/:id/follow", authMiddleware, followUser);
router.post("/:id/unfollow", authMiddleware, unfollowUser);
router.get("/", authMiddleware, getUsers); // New route for fetching all users

module.exports = router;
