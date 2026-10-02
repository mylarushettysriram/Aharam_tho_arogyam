const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { getMyRice } = require("../controllers/riceController");
const { getFarmerOrders, acceptOrder, rejectOrder, updateOrderStatus } = require("../controllers/orderController");
const { getFarmerStats } = require("../controllers/farmerController");

router.use(protect, authorize("farmer"));

router.get("/rice", getMyRice);
router.get("/orders", getFarmerOrders);
router.put("/orders/:id/accept", acceptOrder);
router.put("/orders/:id/reject", rejectOrder);
router.put("/orders/:id/status", updateOrderStatus);
router.get("/stats", getFarmerStats);

module.exports = router;
