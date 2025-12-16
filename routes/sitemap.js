// const express = require("express");
// const builder = require("xmlbuilder");

// const sitemapRouter = express.Router();
// sitemapRouter.get("/sitemap.xml", async (req, res) => {
//   try {
//     const db = req.app.locals.db; // Access MongoDB via app.locals
//     const baseUrl = "https://gossiphub.in";

//     // Fetch posts from the database
//     const posts = await db.collection("posts").find().toArray();

//     // Create Sitemap XML
//     const sitemap = builder
//       .create("urlset", { encoding: "UTF-8" })
//       .att("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9");

//     // Add Static Pages
//     const staticPages = [
//       { url: "/", updatedAt: new Date().toISOString() },
//       { url: "/about", updatedAt: new Date().toISOString() },
//       { url: "/contact", updatedAt: new Date().toISOString() },
//       { url: "/privacy", updatedAt: new Date().toISOString() },
//       //   { url: "/terms", updatedAt: new Date().toISOString() },
//     ];
//     staticPages.forEach((page) => {
//       sitemap
//         .ele("url")
//         .ele("loc", `${baseUrl}${page.url}`)
//         .up()
//         .ele("lastmod", page.updatedAt)
//         .up()
//         .ele("changefreq", "monthly")
//         .up()
//         .ele("priority", "1.0")
//         .up();
//     });

//     // Add Dynamic Post Pages
//     posts.forEach((post) => {
//       sitemap
//         .ele("url")
//         .ele("loc", `${baseUrl}/posts/${post._id}`)
//         .up()
//         .ele("lastmod", post.updatedAt || new Date().toISOString())
//         .up()
//         .ele("changefreq", "daily")
//         .up()
//         .ele("priority", "0.9")
//         .up();
//     });

//     // Add API-related static pages (if accessible or relevant for sitemap)
//     const apiStaticPages = [
//       { url: "/api/auth", updatedAt: new Date().toISOString() },
//       { url: "/api/posts", updatedAt: new Date().toISOString() },
//       { url: "/api/admin", updatedAt: new Date().toISOString() },
//       { url: "/api/notifications", updatedAt: new Date().toISOString() },
//       { url: "/api/users", updatedAt: new Date().toISOString() },
//     ];
//     apiStaticPages.forEach((page) => {
//       sitemap
//         .ele("url")
//         .ele("loc", `${baseUrl}${page.url}`)
//         .up()
//         .ele("lastmod", page.updatedAt)
//         .up()
//         .ele("changefreq", "weekly")
//         .up()
//         .ele("priority", "0.6")
//         .up();
//     });

//     // Set Header and Send Response
//     res.header("Content-Type", "application/xml");
//     res.send(sitemap.end({ pretty: true }));
//   } catch (error) {
//     console.error("Error generating sitemap:", error);
//     res.status(500).send("Error generating sitemap");
//   }
// });

// module.exports = sitemapRouter;

const express = require("express");
const builder = require("xmlbuilder");

const sitemapRouter = express.Router();
sitemapRouter.get("/sitemap.xml", async (req, res) => {
  try {
    const db = req.app.locals.db;
    if (!db) {
      throw new Error(
        "Database connection not available. Please check MongoDB setup."
      );
    }

    const baseUrl = "https://gossiphub.in";

    // Fetch posts from the database
    const posts = await db.collection("posts").find().toArray();

    // Create Sitemap XML
    const sitemap = builder
      .create("urlset", { encoding: "UTF-8" })
      .att("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9");

    // Add Static Pages
    const staticPages = [
      { url: "/", updatedAt: new Date().toISOString() },
      { url: "/about", updatedAt: new Date().toISOString() },
      { url: "/contact", updatedAt: new Date().toISOString() },
      { url: "/privacy", updatedAt: new Date().toISOString() },
      { url: "/terms", updatedAt: new Date().toISOString() },
    ];
    staticPages.forEach((page) => {
      sitemap
        .ele("url")
        .ele("loc", `${baseUrl}${page.url}`)
        .up()
        .ele("lastmod", page.updatedAt)
        .up()
        .ele("changefreq", "daily")
        .up()
        .ele("priority", "1.0")
        .up();
    });

    // Add Dynamic Post Pages
    posts.forEach((post) => {
      const postId = post.slug || (post._id ? post._id.toString() : "unknown");
      sitemap
        .ele("url")
        .ele("loc", `${baseUrl}/posts/${postId}`)
        .up()
        .ele(
          "lastmod",
          post.updatedAt
            ? post.updatedAt.toISOString()
            : new Date().toISOString()
        )
        .up()
        .ele("changefreq", "daily")
        .up()
        .ele("priority", "0.9")
        .up();
    });

    // Add API-related static pages
    // const apiStaticPages = [
    //   { url: "/api/posts", updatedAt: new Date().toISOString() },
    //   { url: "/api/admin", updatedAt: new Date().toISOString() },
    //   { url: "/api/users", updatedAt: new Date().toISOString() },
    // ];
    // apiStaticPages.forEach((page) => {
    //   sitemap
    //     .ele("url")
    //     .ele("loc", `${baseUrl}${page.url}`)
    //     .up()
    //     .ele("lastmod", page.updatedAt)
    //     .up()
    //     .ele("changefreq", "weekly")
    //     .up()
    //     .ele("priority", "0.6")
    //     .up();
    // });

    res.header("Content-Type", "application/xml");
    res.send(sitemap.end({ pretty: true }));
  } catch (error) {
    console.error("Error generating sitemap:", error.message);
    res.status(500).send(`Error generating sitemap: ${error.message}`);
  }
});

module.exports = sitemapRouter;
