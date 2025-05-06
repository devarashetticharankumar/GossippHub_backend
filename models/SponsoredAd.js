const mongoose = require("mongoose");

const sponsoredAdSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true }, // Link to existing post
  title: { type: String, required: true },
  description: { type: String, required: true },
  budget: { type: Number, default: 0 },
  duration: { type: Number, default: 7 },
  media: { type: String }, // URL to the uploaded image
  sponsoredAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SponsoredAd", sponsoredAdSchema);
