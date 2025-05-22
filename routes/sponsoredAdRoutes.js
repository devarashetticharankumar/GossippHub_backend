const express = require("express");
const {
  createSponsoredAd,
  getSponsoredAds,
  upload,
} = require("../controllers/sponsoredAdController");
const { auth, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/sponsored-ads", [auth, admin, upload], createSponsoredAd);
router.get("/sponsored-ads", getSponsoredAds);

module.exports = router;
