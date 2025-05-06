const Post = require("../models/post");
const Reaction = require("../models/Reaction");
const { filterContent } = require("../utils/filters");
const { generateSlug } = require("../utils/slugGenerator");

exports.createPost = async (req, res, next) => {
  const { title, description, isAnonymous, category } = req.body;
  const file = req.file; // From multer
  try {
    if (!filterContent(description) || (title && !filterContent(title))) {
      return res
        .status(400)
        .json({ message: "Inappropriate content detected" });
    }

    const slug = await generateSlug(title);
    const post = new Post({
      title,
      description,
      slug,
      author: req.user,
      isAnonymous,
      category,
      media: file ? `/uploads/${file.filename}` : null,
    });
    await post.save();

    const populatedPost = await Post.findById(post._id).populate(
      "author",
      "email username"
    );
    res.json(populatedPost);
  } catch (err) {
    next(err);
  }
};

exports.getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ isFlagged: false })
      .populate("author", "email username")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    next(err);
  }
};

exports.addReaction = async (req, res, next) => {
  const { postId } = req.params;
  const { type } = req.body;

  try {
    // Validate reaction type
    if (type !== "like" && type !== "downvote") {
      return res
        .status(400)
        .json({ message: "Invalid reaction type. Use 'like' or 'downvote'." });
    }

    // Ensure user is authenticated
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "User must be logged in to add a reaction" });
    }

    // Ensure req.user is a string (user ID from JWT)
    const userId = typeof req.user === "object" ? req.user._id : req.user;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Initialize likes and downvotes if undefined
    post.likes = Array.isArray(post.likes) ? post.likes : [];
    post.downvotes = Array.isArray(post.downvotes) ? post.downvotes : [];

    // Convert userId to string for comparison (MongoDB ObjectId)
    const userIdStr = userId.toString();

    // Check if user has already reacted
    const hasLiked = post.likes.some((id) => id && id.toString() === userIdStr);
    const hasDownvoted = post.downvotes.some(
      (id) => id && id.toString() === userIdStr
    );

    // Remove any existing reaction in the Reaction collection
    await Reaction.deleteOne({ post: postId, user: userId });

    // Handle the reaction
    if (type === "like") {
      if (hasLiked) {
        // User already liked, remove the like (toggle off)
        await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
        post.likes = post.likes.filter((id) => id.toString() !== userIdStr);
      } else {
        // Add like, remove downvote if exists
        await Post.updateOne(
          { _id: postId },
          {
            $addToSet: { likes: userId },
            $pull: { downvotes: userId },
          }
        );
        // Update local post object for response
        if (!hasLiked) post.likes.push(userId);
        post.downvotes = post.downvotes.filter(
          (id) => id && id.toString() !== userIdStr
        );

        // Record the reaction
        const reaction = new Reaction({ post: postId, user: userId, type });
        await reaction.save();
      }
    } else if (type === "downvote") {
      if (hasDownvoted) {
        // User already downvoted, remove the downvote (toggle off)
        await Post.updateOne({ _id: postId }, { $pull: { downvotes: userId } });
        post.downvotes = post.downvotes.filter(
          (id) => id.toString() !== userIdStr
        );
      } else {
        // Add downvote, remove like if exists
        await Post.updateOne(
          { _id: postId },
          {
            $addToSet: { downvotes: userId },
            $pull: { likes: userId },
          }
        );
        // Update local post object for response
        if (!hasDownvoted) post.downvotes.push(userId);
        post.likes = post.likes.filter(
          (id) => id && id.toString() !== userIdStr
        );

        // Record the reaction
        const reaction = new Reaction({ post: postId, user: userId, type });
        await reaction.save();
      }
    }

    // Return updated counts
    res.json({ likes: post.likes, downvotes: post.downvotes });
  } catch (err) {
    console.error("Error in addReaction:", err);
    next(err);
  }
};

exports.addComment = async (req, res, next) => {
  const { postId } = req.params;
  const { text } = req.body;
  try {
    if (!filterContent(text)) {
      return res
        .status(400)
        .json({ message: "Inappropriate comment detected" });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ text, author: req.user });
    await post.save();

    const updatedPost = await Post.findById(postId).populate(
      "author",
      "email username"
    );
    res.json(updatedPost);
  } catch (err) {
    next(err);
  }
};

//Delete post by Author
exports.deletePost = async (req, res, next) => {
  const { postId } = req.params;
  try {
    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the authenticated user is the author
    const userId = typeof req.user === "object" ? req.user._id : req.user;
    if (post.author.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this post" });
    }

    // Delete associated reactions
    await Reaction.deleteMany({ post: postId });

    // Delete the post
    await Post.findByIdAndDelete(postId);

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    next(err);
  }
};
