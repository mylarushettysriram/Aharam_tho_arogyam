const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { createReview } = require("../controllers/reviewController");

router.post("/", protect, authorize("customer"), createReview);

module.exports = router;
