import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshToken,
  changePassword,
  getUserProfile,
  updateUserProfile,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/user.Controller.js";
import { protect, admin } from "../middleware/auth.Middleware.js";

const router = express.Router();

router.route("/").post(registerUser).get(protect, admin, getUsers);
router.post("/login", loginUser);
router.post("/logout", protect, logoutUser);
router.post("/refresh", refreshToken);
router.put("/change-password", protect, changePassword);
router
  .route("/profile")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);
router
  .route("/:id")
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

export default router;