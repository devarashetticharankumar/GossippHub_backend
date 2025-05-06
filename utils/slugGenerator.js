const Post = require("../models/post");

module.exports = {
  generateSlug: async (title) => {
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    let count = 0;
    let uniqueSlug = slug;

    while (await Post.findOne({ slug: uniqueSlug })) {
      count++;
      uniqueSlug = `${slug}-${count}`;
    }

    return uniqueSlug;
  },
};
