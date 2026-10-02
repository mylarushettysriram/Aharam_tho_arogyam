const express = require("express");
const router = express.Router();
const {
	register,
	verifyOtp,
	login,
	requestPasswordReset,
	resetPassword,
	getMe,
	logout,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);
router.post("/verify-otp", verifyOtp);

module.exports = router;
