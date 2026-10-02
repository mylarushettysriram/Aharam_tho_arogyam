const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { createOrder, getOrderById, cancelOrder } = require("../controllers/orderController");

router.post("/", protect, authorize("customer"), createOrder);
router.get("/:id", protect, getOrderById); // owner check happens inside the controller
router.put("/:id/cancel", protect, authorize("customer"), cancelOrder);

module.exports = router;
