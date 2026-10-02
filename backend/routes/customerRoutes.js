const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { getCustomerOrders } = require("../controllers/orderController");

router.use(protect, authorize("customer"));

router.get("/orders", getCustomerOrders);

module.exports = router;
