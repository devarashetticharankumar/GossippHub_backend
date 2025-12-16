// utils/embedFetcher.js
const fetch = require("node-fetch");

const oEmbedEndpoints = {
  twitter: "https://publish.twitter.com/oembed",
  instagram: "https://api.instagram.com/oembed",
  youtube: "https://www.youtube.com/oembed",
  tiktok: "https://www.tiktok.com/oembed",
};

async function fetchEmbed(url) {
  const domain = new URL(url).hostname.replace("www.", "");

  let endpoint = null;
  let platform = "none";

  if (domain.includes("twitter.com") || domain.includes("x.com")) {
    endpoint = oEmbedEndpoints.twitter;
    platform = "twitter";
  } else if (domain.includes("instagram.com")) {
    endpoint = oEmbedEndpoints.instagram;
    platform = "instagram";
  } else if (domain.includes("youtube.com") || domain.includes("youtu.be")) {
    endpoint = oEmbedEndpoints.youtube;
    platform = "youtube";
  } else if (domain.includes("tiktok.com")) {
    endpoint = oEmbedEndpoints.tiktok;
    platform = "tiktok";
  }

  if (!endpoint) return null;

  try {
    const response = await fetch(`${endpoint}?url=${encodeURIComponent(url)}`);
    const data = await response.json();

    return {
      type: platform,
      url,
      html: data.html,
      thumbnail: data.thumbnail_url || data.thumbnail,
      title: data.title || data.author_name,
      author: data.author_name || data.provider_name,
    };
  } catch (err) {
    console.error("Embed fetch error:", err.message);
    return null;
  }
}

module.exports = { fetchEmbed };
