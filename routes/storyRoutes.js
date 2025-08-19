const express = require("express");
const router = express.Router();
const storyController = require("../controllers/storyController");

router.post("/stories", storyController.createStory);
router.get("/stories/:userId", storyController.getUserStories);
router.post("/stories/:id/view", storyController.viewStory);
router.post("/stories/:id/react", storyController.reactToStory);

module.exports = router;
