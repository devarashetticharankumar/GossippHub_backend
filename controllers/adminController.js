const mongoose = require("mongoose");
const Post = require("../models/post");
const Report = require("../models/Report");
const User = require("../models/User");

const Short = require("../models/Short");

exports.moderatePost = async (req, res, next) => {
  const { postId } = req.params;
  const { action } = req.body;
  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (action === "flag") {
      post.isFlagged = true;
    } else if (action === "remove") {
      await Post.findByIdAndDelete(postId);
      return res.json({ message: "Post removed" });
    } else if (action === "restore") {
      post.isFlagged = false;
    }
    await post.save();
    res.json(post);
  } catch (err) {
    next(err);
  }
};

exports.getReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ status: "pending" })
      .populate("post")
      .populate("reportedBy", "email username");
    res.json(reports);
  } catch (err) {
    next(err);
  }
};

exports.resolveReport = async (req, res, next) => {
  const { reportId } = req.params;
  const { status } = req.body;
  try {
    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ message: "Report not found" });

    report.status = status;
    await report.save();
    res.json(report);
  } catch (err) {
    next(err);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalShorts = await Short.countDocuments();
    const flaggedPosts = await Post.countDocuments({ isFlagged: true });
    res.json({ totalUsers, totalPosts, totalShorts, flaggedPosts });
  } catch (err) {
    next(err);
  }
};
