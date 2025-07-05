const extractHashtags = (text) => {
  if (!text || typeof text !== "string") return [];
  // Match hashtags: # followed by letters, numbers, or underscores
  const hashtagRegex = /#[\w]+/g;
  const hashtags = text.match(hashtagRegex) || [];
  // Remove the # symbol and convert to lowercase for consistency
  return hashtags.map((tag) => tag.substring(1).toLowerCase());
};

module.exports = { extractHashtags };
