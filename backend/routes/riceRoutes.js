const express = require("express");
const router = express.Router();
const { getAllRice, getRiceById, createRice, updateRice, deleteRice } = require("../controllers/riceController");
const { getRiceReviews } = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Public
router.get("/", getAllRice);
router.get("/:id", getRiceById);
router.get("/:id/reviews", getRiceReviews);

// Farmer only
router.post("/", protect, authorize("farmer"), upload.single("image"), createRice);
router.put("/:id", protect, authorize("farmer"), upload.single("image"), updateRice);
router.delete("/:id", protect, authorize("farmer"), deleteRice);

module.exports = router;
