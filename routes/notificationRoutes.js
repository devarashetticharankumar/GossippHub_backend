const express = require("express");
const { getNotifications } = require("../controllers/notificationController");
const { auth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", auth, getNotifications);

module.exports = router;
