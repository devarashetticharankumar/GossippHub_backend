const mongoose = require("mongoose");
const Short = require("../models/Short");
const User = require("../models/User");

const { filterContent } = require("../utils/filters");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const fs = require("fs");

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ================= Create Short =================
exports.createShort = async (req, res, next) => {
  const { caption } = req.body;
  const file = req.file;

  try {
    if (caption && !filterContent(caption)) {
      return res
        .status(400)
        .json({ message: "Inappropriate caption detected" });
    }
    if (!file) return res.status(400).json({ message: "Video file required" });

    const fileName = `gossiphub/shorts/${Date.now()}-${file.originalname}`;
    let videoUrl = null;

    try {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };
      const command = new PutObjectCommand(params);
      await s3Client.send(command);
      videoUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    } catch (uploadError) {
      return res.status(500).json({
        message: "Failed to upload video to S3",
        error: uploadError.message,
      });
    } finally {
      try {
        if (file.path) fs.unlinkSync(file.path);
      } catch (fsError) {
        console.error("Error deleting temp file:", fsError.message);
      }
    }

    const short = new Short({
      user: req.user,
      caption,
      videoUrl,
    });
    await short.save();

    // gamification reward
    const userId = typeof req.user === "object" ? req.user._id : req.user;
    const user = await User.findById(userId);
    if (user) {
      user.funMeter += 30;
      user.level = Math.floor(user.funMeter / 100) + 1;
      if (user.funMeter >= 100 && !user.badges.includes("Newbie"))
        user.badges.push("Newbie");
      if (user.funMeter >= 500 && !user.badges.includes("Gossip Pro"))
        user.badges.push("Gossip Pro");
      await user.save();
    }

    res.json(await Short.findById(short._id).populate("user", "username"));
  } catch (err) {
    next(err);
  }
};
// exports.createShort = async (req, res, next) => {
//   const { caption } = req.body;
//   const file = req.file;

//   try {
//     if (caption && !filterContent(caption)) {
//       return res
//         .status(400)
//         .json({ message: "Inappropriate caption detected" });
//     }
//     if (!file) return res.status(400).json({ message: "Video file required" });

//     // Validate file type and size
//     const validTypes = ["video/mp4", "video/webm"];
//     if (!validTypes.includes(file.mimetype)) {
//       return res
//         .status(400)
//         .json({ message: "Invalid video format. Use MP4 or WebM" });
//     }
//     const maxSize = 50 * 1024 * 1024; // 50MB limit
//     if (file.size > maxSize) {
//       return res.status(400).json({ message: "File size exceeds 10MB" });
//     }

//     const fileName = `gossiphub/shorts/${Date.now()}-${file.originalname}`;
//     let videoUrl = null;

//     // ... (S3 upload logic remains the same)
//     const params = {
//       Bucket: process.env.AWS_S3_BUCKET,
//       Key: fileName,
//       Body: file.buffer,
//       ContentType: file.mimetype,
//     };
//     const command = new PutObjectCommand(params);
//     await s3Client.send(command);
//     videoUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

//     // ... (rest of the function remains the same)
//   } catch (err) {
//     next(err);
//   }
// };

// ================= Get All Shorts =================
// exports.getShorts = async (req, res, next) => {
//   try {
//     const { page = 1, limit = 10 } = req.query;
//     const shorts = await Short.find()
//       .populate("user", "username")
//       .sort({ createdAt: -1 })
//       .skip((page - 1) * limit)
//       .limit(Number(limit))
//       .lean();

//     const total = await Short.countDocuments();
//     res.json({
//       total,
//       page: Number(page),
//       limit: Number(limit),
//       totalPages: Math.ceil(total / limit),
//       shorts,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

exports.getShorts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const shorts = await Short.find()
      .populate("user", "_id username") // Include _id and username
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await Short.countDocuments();
    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      shorts,
    });
  } catch (err) {
    next(err);
  }
};

// ================= Get Short By ID =================
exports.getShortById = async (req, res, next) => {
  const { shortId } = req.params;
  try {
    if (!mongoose.isValidObjectId(shortId)) {
      return res.status(400).json({ message: "Invalid short ID" });
    }
    const short = await Short.findById(shortId)
      .populate("user", "username")
      .populate("comments.user", "username");
    if (!short) return res.status(404).json({ message: "Short not found" });

    res.json(short);
  } catch (err) {
    next(err);
  }
};

// ================= Update Short (caption only) =================
// exports.updateShort = async (req, res) => {
//   try {
//     const { shortId } = req.params;
//     const { caption } = req.body;

//     const short = await Short.findById(shortId);
//     if (!short) {
//       return res.status(404).json({ message: "Short not found" });
//     }

//     // check if new video file is uploaded
//     if (req.file) {
//       const fileContent = req.file.buffer;
//       const fileName = `shorts/${Date.now()}-${req.file.originalname}`;

//       // upload to S3
//       const uploadParams = {
//         Bucket: process.env.AWS_S3_BUCKET,
//         Key: fileName,
//         Body: fileContent,
//         ContentType: req.file.mimetype,
//       };

//       await s3.upload(uploadParams).promise();

//       // update videoUrl
//       short.videoUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
//     }

//     // update caption if provided
//     if (caption) {
//       short.caption = caption;
//     }

//     await short.save();

//     res.json({ message: "Short updated successfully", short });
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ message: "Something went wrong!", error: error.message });
//   }
// };
exports.updateShort = async (req, res) => {
  try {
    const { shortId } = req.params;
    const { caption } = req.body;

    const short = await Short.findById(shortId);
    if (!short) {
      return res.status(404).json({ message: "Short not found" });
    }

    if (req.file) {
      const fileContent = req.file.buffer;
      const fileName = `shorts/${Date.now()}-${req.file.originalname}`;

      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: fileName,
        Body: fileContent,
        ContentType: req.file.mimetype,
      };

      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);

      short.videoUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    }

    if (caption) {
      short.caption = caption;
    }

    await short.save();

    res.json({ message: "Short updated successfully", short });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Something went wrong!", error: error.message });
  }
};

// ================= Delete Short =================
// exports.deleteShort = async (req, res, next) => {
//   const { shortId } = req.params;
//   try {
//     if (!mongoose.isValidObjectId(shortId)) {
//       return res.status(400).json({ message: "Invalid short ID" });
//     }
//     const short = await Short.findById(shortId);
//     if (!short) return res.status(404).json({ message: "Short not found" });

//     if (short.user.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: "Not authorized" });
//     }

//     // delete from S3
//     const fileKey = short.videoUrl.split(".amazonaws.com/")[1];
//     try {
//       const params = {
//         Bucket: process.env.AWS_S3_BUCKET,
//         Key: fileKey,
//       };
//       const command = new DeleteObjectCommand(params);
//       await s3Client.send(command);
//     } catch (s3err) {
//       console.error("Error deleting S3 video:", s3err.message);
//     }

//     await short.deleteOne();
//     res.json({ message: "Short deleted successfully" });
//   } catch (err) {
//     next(err);
//   }
// };
exports.deleteShort = async (req, res, next) => {
  const { shortId } = req.params;

  try {
    if (!mongoose.isValidObjectId(shortId)) {
      return res.status(400).json({ message: "Invalid short ID" });
    }

    const short = await Short.findById(shortId);
    if (!short) return res.status(404).json({ message: "Short not found" });

    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (short.user.toString() !== req.user.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const fileKey = short.videoUrl.split(".amazonaws.com/")[1];
    try {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: fileKey,
      };
      const command = new DeleteObjectCommand(params);
      await s3Client.send(command);
    } catch (s3err) {
      console.error("Error deleting S3 video:", s3err.message);
    }

    await short.deleteOne();
    res.json({ message: "Short deleted successfully" });
  } catch (err) {
    next(err);
  }
};

exports.toggleShortLike = async (req, res, next) => {
  const { shortId } = req.params;
  try {
    if (!mongoose.isValidObjectId(shortId)) {
      return res.status(400).json({ message: "Invalid short ID" });
    }
    const short = await Short.findById(shortId);
    if (!short) return res.status(404).json({ message: "Short not found" });

    const userId = typeof req.user === "object" ? req.user._id : req.user;
    const alreadyLiked = short.likes.some(
      (id) => id.toString() === userId.toString()
    );

    if (alreadyLiked) {
      short.likes = short.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      short.likes.push(userId);
    }
    await short.save();

    res.json({ likes: short.likes.length });
  } catch (err) {
    next(err);
  }
};

// ================= Comment on Short =================
exports.addComment = async (req, res, next) => {
  const { shortId } = req.params;
  const { text } = req.body;
  try {
    if (!mongoose.isValidObjectId(shortId)) {
      return res.status(400).json({ message: "Invalid short ID" });
    }
    if (!filterContent(text)) {
      return res.status(400).json({ message: "Inappropriate comment" });
    }
    const short = await Short.findById(shortId);
    if (!short) return res.status(404).json({ message: "Short not found" });

    const comment = {
      user: req.user,
      text,
    };
    short.comments.push(comment);
    await short.save();

    res.json(
      await Short.findById(shortId).populate("comments.user", "username")
    );
  } catch (err) {
    next(err);
  }
};
