const Post = require("../models/post");

exports.getNotifications = async (req, res, next) => {
  try {
    const posts = await Post.find({ author: req.user })
      .populate("comments.author", "email username")
      .sort({ "comments.createdAt": -1 });

    const notifications = posts
      .flatMap((post) =>
        post.comments.map((comment) => ({
          message: `${
            comment.author ? comment.author.username : "Unknown user"
          } commented on your post: "${post.title}" - "${comment.text}"`,
          createdAt: comment.createdAt,
        }))
      )
      .slice(0, 10);

    res.json(notifications);
  } catch (err) {
    next(err);
  }
};

// const Post = require("../models/post");

// exports.getNotifications = async (req, res, next) => {
//   try {
//     const posts = await Post.find({ author: req.user })
//       .populate("comments.author", "email username")
//       .sort({ "comments.createdAt": -1 });

//     const notifications = posts
//       .flatMap((post) =>
//         post.comments
//           .filter((comment) => comment.author) // Filter out comments with null author
//           .map((comment) => ({
//             message: `${comment.author.username} commented on your post: "${post.title}" - "${comment.text}"`,
//             createdAt: comment.createdAt,
//           }))
//       )
//       .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Sort notifications by createdAt (newest first)
//       .slice(0, 10);

//     res.json(notifications);
//   } catch (err) {
//     next(err);
//   }
// };
