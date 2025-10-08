// require("dotenv").config();
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const http = require("http");
// const { Server } = require("socket.io");
// const authRoutes = require("./routes/authRoutes");
// const postRoutes = require("./routes/postRoutes");
// const adminRoutes = require("./routes/adminRoutes");
// const sponsoredAdRoutes = require("./routes/sponsoredAdRoutes");

// const notificationRoutes = require("./routes/notificationRoutes");
// const errorHandler = require("./middleware/errorHandler");
// const { setupSocket } = require("./utils/socket");
// const userRoutes = require("./routes/user");

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: { origin: "*" },
// });

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Serve uploaded files (for multer)
// app.use("/uploads", express.static("uploads"));

// // MongoDB Connection
// mongoose
//   .connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log("Connected to MongoDB"))
//   .catch((err) => console.error("MongoDB connection error:", err));

// // Socket.io Setup
// setupSocket(io);

// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/posts", postRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/notifications", notificationRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api", sponsoredAdRoutes);

// // Error Handling
// app.use(errorHandler);

// // Start Server
// const PORT = process.env.PORT || 8080;
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// require("dotenv").config();
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const http = require("http");
// const { Server } = require("socket.io");
// const authRoutes = require("./routes/authRoutes");
// const postRoutes = require("./routes/postRoutes");
// const adminRoutes = require("./routes/adminRoutes");
// const sponsoredAdRoutes = require("./routes/sponsoredAdRoutes");
// const notificationRoutes = require("./routes/notificationRoutes");
// const errorHandler = require("./middleware/errorHandler");
// const { setupSocket } = require("./utils/socket");
// const userRoutes = require("./routes/user");
// const cloudinary = require("cloudinary").v2;
// const sitemapRouter = require("./routes/sitemap");

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: { origin: "*" },
// });

// // Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // Middleware
// app.use(cors());
// app.use(express.json());

// // MongoDB Connection
// mongoose
//   .connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log("Connected to MongoDB"))
//   .catch((err) => console.error("MongoDB connection error:", err));

// // Socket.io Setup
// setupSocket(io);

// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/posts", postRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/notifications", notificationRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api", sponsoredAdRoutes);
// app.use("/", sitemapRouter);

// // Error Handling
// app.use(errorHandler);

// // Start Server
// const PORT = process.env.PORT || 8080;
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// require("dotenv").config();
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const http = require("http");
// const { Server } = require("socket.io");
// const authRoutes = require("./routes/authRoutes");
// const postRoutes = require("./routes/postRoutes");
// const adminRoutes = require("./routes/adminRoutes");
// const sponsoredAdRoutes = require("./routes/sponsoredAdRoutes");
// const notificationRoutes = require("./routes/notificationRoutes");
// const errorHandler = require("./middleware/errorHandler");
// const { setupSocket } = require("./utils/socket");
// const userRoutes = require("./routes/user");
// const cloudinary = require("cloudinary").v2;
// const sitemapRouter = require("./routes/sitemap");

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: { origin: "*" },
// });

// // Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // Middleware
// app.use(cors());
// app.use(express.json());

// // MongoDB Connection
// let dbConnection;
// mongoose
//   .connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then((connection) => {
//     console.log("Connected to MongoDB");
//     dbConnection = connection.connection.db; // Store the raw MongoDB database
//     app.locals.db = dbConnection; // Make it available to routes
//   })
//   .catch((err) => console.error("MongoDB connection error:", err));

// // Socket.io Setup
// setupSocket(io);

// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/posts", postRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/notifications", notificationRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api", sponsoredAdRoutes);
// app.use("/", sitemapRouter);

// // Error Handling
// app.use(errorHandler);

// // Start Server
// const PORT = process.env.PORT || 8080;
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// require("dotenv").config();
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const http = require("http");
// const { Server } = require("socket.io");
// const authRoutes = require("./routes/authRoutes");
// const postRoutes = require("./routes/postRoutes");
// const adminRoutes = require("./routes/adminRoutes");
// const sponsoredAdRoutes = require("./routes/sponsoredAdRoutes");
// const notificationRoutes = require("./routes/notificationRoutes");
// const errorHandler = require("./middleware/errorHandler");
// const { setupSocket } = require("./utils/socket");
// const userRoutes = require("./routes/user");
// const cloudinary = require("cloudinary").v2;
// const sitemapRouter = require("./routes/sitemap");

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: ["https://gossiphub.in", "http://localhost:5173"], // Allow only this origin
//     methods: ["GET", "POST", "PATCH"], // Allow specific methods
//     credentials: true, // Allow cookies/auth credentials if needed
//   },
// });

// // Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // Middleware
// const corsOptions = {
//   origin: ["https://gossiphub.in", "http://localhost:5173"], // Match the frontend origin
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"], // Common HTTP methods
//   credentials: true, // Enable CORS for cookies/sessions
//   allowedHeaders: ["Content-Type", "Authorization"], // Allow these headers
// };
// app.use(cors(corsOptions));
// app.use(express.json());

// // MongoDB Connection
// let dbConnection;
// mongoose
//   .connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then((connection) => {
//     console.log("Connected to MongoDB");
//     dbConnection = connection.connection.db;
//     app.locals.db = dbConnection;
//   })
//   .catch((err) => console.error("MongoDB connection error:", err));

// // Socket.io Setup
// setupSocket(io);

// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/posts", postRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/notifications", notificationRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api", sponsoredAdRoutes);
// app.use("/", sitemapRouter);

// // Error Handling
// app.use(errorHandler);

// // Start Server
// const PORT = process.env.PORT || 8080;
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////vps lo deploy cheyalsina code:
// require("dotenv").config();
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const http = require("http");
// const { Server } = require("socket.io");
// const authRoutes = require("./routes/authRoutes");
// const postRoutes = require("./routes/postRoutes");
// const adminRoutes = require("./routes/adminRoutes");
// const sponsoredAdRoutes = require("./routes/sponsoredAdRoutes");
// const notificationRoutes = require("./routes/notificationRoutes");
// const errorHandler = require("./middleware/errorHandler");
// const { setupSocket } = require("./utils/socket");
// const userRoutes = require("./routes/user");
// const chatRoutes = require("./routes/chatRoutes"); // New import
// const sitemapRouter = require("./routes/sitemap");

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: ["https://gossiphub.in", "http://localhost:5173"],
//     methods: ["GET", "POST", "PATCH"],
//     credentials: true,
//   },
// });

// // Middleware
// const corsOptions = {
//   origin: ["https://gossiphub.in", "http://localhost:5173"],
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
//   credentials: true,
//   allowedHeaders: ["Content-Type", "Authorization"],
// };
// app.use(cors(corsOptions));
// app.use(express.json());

// // MongoDB Connection
// let dbConnection;
// mongoose
//   .connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then((connection) => {
//     console.log("Connected to MongoDB");
//     dbConnection = connection.connection.db;
//     app.locals.db = dbConnection;
//   })
//   .catch((err) => console.error("MongoDB connection error:", err));

// // Socket.io Setup
// setupSocket(io);

// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/posts", postRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/notifications", notificationRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api", sponsoredAdRoutes);
// app.use("/api/chats", chatRoutes); // New chat route
// app.use("/", sitemapRouter);

// // Error Handling
// app.use(errorHandler);

// // Start Server
// const PORT = process.env.PORT || 8080;
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

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
app.use("/", sitemapRouter);
app.use("/api/shorts", shortRoutes);

// Error Handling
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
