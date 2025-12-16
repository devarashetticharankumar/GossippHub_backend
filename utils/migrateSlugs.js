const mongoose = require("mongoose");
const Post = require("../models/Post");
const { generateSlug } = require("./slugGenerator");
require("dotenv").config({ path: "./.env" });

const migrateSlugs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for migration...");

        const posts = await Post.find({ slug: { $exists: false } });
        console.log(`Found ${posts.length} posts without slugs.`);

        for (const post of posts) {
            const slug = await generateSlug(post.title);
            post.slug = slug;
            await post.save();
            console.log(`Updated post: ${post.title} -> ${slug}`);
        }

        console.log("Migration completed.");
        process.exit(0);
    } catch (err) {
        console.error("Migration error:", err);
        process.exit(1);
    }
};

migrateSlugs();
