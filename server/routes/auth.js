import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/auth.js";
import { forgotPasswordLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.patch("/profile", verifyToken, updateProfile);
router.patch("/password", verifyToken, changePassword);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
