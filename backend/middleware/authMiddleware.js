import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/auth.js";

// Verifies the Bearer JWT and exposes req.user = { user_id, username }.
// Every protected route relies on req.user.user_id to scope its queries.
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { user_id: decoded.user_id, username: decoded.username };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

export default verifyToken;
