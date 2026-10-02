const { Op } = require("sequelize");
const { RiceProduct, Order, OrderItem } = require("../models");
const { success } = require("../utils/response");

// GET /api/farmer/stats (farmer only) - powers the dashboard cards
async function getFarmerStats(req, res, next) {
  try {
    const farmerId = req.user.id;

    const totalListings = await RiceProduct.count({ where: { farmer_id: farmerId } });

    const availableBagsResult = await RiceProduct.sum("quantity_available", {
      where: { farmer_id: farmerId, status: "active" },
    });

    const pendingOrders = await Order.count({ where: { farmer_id: farmerId, status: "pending" } });
    const completedOrders = await Order.count({ where: { farmer_id: farmerId, status: "delivered" } });

    const deliveredOrders = await Order.findAll({
      where: { farmer_id: farmerId, status: "delivered" },
      attributes: ["total_amount"],
    });
    const totalSales = deliveredOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

    return success(res, 200, "Farmer statistics fetched successfully", {
      totalListings,
      availableBags: availableBagsResult || 0,
      pendingOrders,
      completedOrders,
      totalSales,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getFarmerStats };
