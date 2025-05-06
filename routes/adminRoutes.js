const express = require("express");
const {
  moderatePost,
  getReports,
  resolveReport,
  getAnalytics,
  sponsorPost,
} = require("../controllers/adminController");
const { auth, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/posts/:postId/moderate", [auth, admin], moderatePost);
router.get("/reports", [auth, admin], getReports);
router.post("/reports/:reportId/resolve", [auth, admin], resolveReport);
router.get("/analytics", [auth, admin], getAnalytics);

module.exports = router;
