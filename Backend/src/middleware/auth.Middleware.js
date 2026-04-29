import jwt from "jsonwebtoken";
import { User } from "../models/users/user.Model.js";
import { UserLogin } from "../models/login/userLogin.model.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "defaultsecret");

      // Find user login to verify device and token version
      const userLogin = await UserLogin.findOne({ user: decoded.userId });
      if (!userLogin) {
        return res.status(401).json({ message: "Not authorized" });
      }

      const device = userLogin.loggedInDevices.find(d => d.deviceId === decoded.deviceId);
      if (!device || device.tokenVersion !== decoded.tokenVersion) {
        return res.status(401).json({ message: "Token invalidated" });
      }

      req.user = await User.findById(decoded.userId);
      req.deviceId = decoded.deviceId;
      req.userLogin = userLogin; // Attach userLogin for password status

      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).json({ message: "Not authorized as an admin" });
  }
};