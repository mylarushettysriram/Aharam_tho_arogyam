const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { createPaymentOrder, verifyPayment } = require("../controllers/paymentController");

router.post("/order", protect, authorize("customer"), createPaymentOrder);
router.post("/verify", protect, authorize("customer"), verifyPayment);

module.exports = router;