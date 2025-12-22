

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const adminRoutes = require("./routes/adminRoutes");
const sponsoredAdRoutes = require("./routes/sponsoredAdRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const errorHandler = require("./middleware/errorHandler");
const { setupSocket } = require("./utils/socket");
const userRoutes = require("./routes/user");
const chatRoutes = require("./routes/chatRoutes");
const storyRoutes = require("./routes/storyRoutes");
const sitemapRouter = require("./routes/sitemap");
const shortRoutes = require("./routes/shortRoutes");
const path = require("path");

const app = express();
const server = http.createServer(app);

// Consolidated CORS options
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Socket.io setup
const io = new Server(server, { cors: corsOptions });
app.set("io", io); // Store io in app for access in routes

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Sitemap route (must be before static files to ensure precedence)
app.use("/", sitemapRouter);

// Serve static files from public folder
app.use(express.static(path.join(__dirname, "public")));

// // Route for robots.txt
// app.get("/robots.txt", (req, res) => {
//   console.log("robots.txt requested"); // debug
//   res.sendFile(path.join(__dirname, "public", "robots.txt"));
// });

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then((connection) => {
    console.log("Connected to MongoDB");
    app.locals.db = connection.connection.db;
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Socket.io Setup
setupSocket(io);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api", storyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);
app.use("/api", sponsoredAdRoutes);
app.use("/api/chat", chatRoutes.router);
app.use("/api/shorts", shortRoutes);

// Serve robots.txt explicitly (optional, works even if not in public)
app.get("/robots.txt", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "robots.txt"));
});
// Error Handling
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
