const jwt = require("jsonwebtoken");

exports.auth = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token)
    return res.status(401).json({ message: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

exports.admin = async (req, res, next) => {
  try {
    const user = await require("../models/User").findById(req.user);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (err) {
    next(err);
  }
};

//////////////////////////////////////////////////////////// chat ki sambandinchina code
// const jwt = require("jsonwebtoken");
// const User = require("../models/User");

// exports.auth = (req, res, next) => {
//   const token = req.header("Authorization")?.replace("Bearer ", "");
//   console.log("Authorization Header:", req.header("Authorization"));
//   console.log("Token:", token);
//   if (!token) {
//     return res.status(401).json({ message: "No token, authorization denied" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     console.log("Decoded Token:", decoded);
//     req.user = { userId: decoded.userId }; // Set req.user as an object
//     next();
//   } catch (err) {
//     console.error("JWT Error:", err.message);
//     res.status(401).json({ message: "Token is not valid" });
//   }
// };

// exports.admin = async (req, res, next) => {
//   try {
//     const user = await User.findById(req.user.userId);
//     if (!user || !user.isAdmin) {
//       return res.status(403).json({ message: "Admin access required" });
//     }
//     next();
//   } catch (err) {
//     next(err);
//   }
// };
