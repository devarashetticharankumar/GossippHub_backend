const Story = require("../models/Story");
const User = require("../models/User");

exports.createStory = async (req, res) => {
  try {
    const { userId, content, type } = req.body;
    if (!userId || !content || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const user = await User.findById(userId);
    if (!user || user.blockedUsers.includes(userId)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const story = new Story({ userId, content, type });
    await story.save();
    await User.findByIdAndUpdate(userId, { $inc: { storyCount: 1 } });
    res.status(201).json(story);
  } catch (err) {
    res.status(500).json({ error: "Failed to create story" });
  }
};

exports.getUserStories = async (req, res) => {
  try {
    const { userId } = req.params;
    const stories = await Story.find({
      userId,
      status: "active",
      expiresAt: { $gt: new Date() },
    }).populate("userId", "username profilePicture");
    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stories" });
  }
};

exports.viewStory = async (req, res) => {
  try {
    const { id } = req.params;
    const { viewerId } = req.body;
    const story = await Story.findById(id);
    if (!story || story.status === "expired") {
      return res.status(404).json({ error: "Story not found or expired" });
    }
    if (!story.views.includes(viewerId)) {
      story.views.push(viewerId);
      await story.save();
      await User.findByIdAndUpdate(viewerId, { $inc: { funMeter: 1 } }); // Optional reward
    }
    res.json(story);
  } catch (err) {
    res.status(500).json({ error: "Failed to view story" });
  }
};

exports.reactToStory = async (req, res) => {
  try {
    const { id } = req.params;
    const story = await Story.findById(id);
    if (!story || story.status === "expired") {
      return res.status(404).json({ error: "Story not found or expired" });
    }
    story.reacts += 1;
    await story.save();
    res.json(story);
  } catch (err) {
    res.status(500).json({ error: "Failed to react to story" });
  }
};
