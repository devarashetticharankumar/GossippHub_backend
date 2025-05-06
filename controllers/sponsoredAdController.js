// const SponsoredAd = require("../models/SponsoredAd");
// const Post = require("../models/Post");
// const multer = require("multer");
// const path = require("path");

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/"); // Ensure this folder exists
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });

// const upload = multer({ storage });

// exports.upload = upload.single("media"); // Middleware for handling media upload

// exports.createSponsoredAd = async (req, res, next) => {
//   try {
//     const { postId, title, description, budget, duration } = req.body;
//     const isAdmin = req.user.role === "admin"; // Assuming role check via auth middleware

//     if (!isAdmin) {
//       return res
//         .status(403)
//         .json({ message: "Only admins can create sponsored ads" });
//     }

//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ message: "Post not found" });
//     }

//     const sponsoredAd = new SponsoredAd({
//       postId,
//       title,
//       description,
//       budget: parseFloat(budget) || 0,
//       duration: parseInt(duration) || 7,
//       media: req.file ? `/uploads/${req.file.filename}` : null,
//     });

//     await sponsoredAd.save();
//     res.status(201).json(sponsoredAd);
//   } catch (err) {
//     next(err);
//   }
// };

// exports.getSponsoredAds = async (req, res, next) => {
//   try {
//     const sponsoredAds = await SponsoredAd.find()
//       .populate("postId", "title description author media")
//       .sort({ sponsoredAt: -1 });
//     res.json(sponsoredAds);
//   } catch (err) {
//     next(err);
//   }
// };

const SponsoredAd = require("../models/SponsoredAd");
const Post = require("../models/post");
const multer = require("multer");
const path = require("path");
const { filterContent } = require("../utils/filters");
const { generateSlug } = require("../utils/slugGenerator");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

exports.upload = upload.single("media");

exports.createSponsoredAd = async (req, res, next) => {
  try {
    const { title, description, isAnonymous, category, budget, duration } =
      req.body;
    const isAdmin = req.user.role === "admin";

    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: "Only admins can create sponsored ads" });
    }

    // Filter content for appropriateness
    if (!filterContent(description) || (title && !filterContent(title))) {
      return res
        .status(400)
        .json({ message: "Inappropriate content detected" });
    }

    // Create the Post
    const slug = await generateSlug(title);
    const post = new Post({
      title,
      description,
      slug,
      author: req.user._id,
      isAnonymous: isAnonymous === "true",
      category,
      media: req.file ? `/uploads/${req.file.filename}` : null,
    });
    await post.save();

    // Create the SponsoredAd linked to the Post
    const sponsoredAd = new SponsoredAd({
      postId: post._id,
      title,
      description,
      budget: parseFloat(budget) || 0,
      duration: parseInt(duration) || 7,
      media: req.file ? `/uploads/${req.file.filename}` : null,
    });
    await sponsoredAd.save();

    const populatedPost = await Post.findById(post._id).populate(
      "author",
      "email username"
    );
    res.status(201).json({ post: populatedPost, sponsoredAd });
  } catch (err) {
    next(err);
  }
};

exports.getSponsoredAds = async (req, res, next) => {
  try {
    const sponsoredAds = await SponsoredAd.find()
      .populate("postId", "title description author media")
      .sort({ sponsoredAt: -1 });
    res.json(sponsoredAds);
  } catch (err) {
    next(err);
  }
};
