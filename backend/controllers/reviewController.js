const { Review, Order, OrderItem, RiceProduct } = require("../models");
const { success, error } = require("../utils/response");
const { isPositiveInteger, isNonEmptyString } = require("../utils/validators");

// POST /api/reviews (customer only)
// A customer can only review a rice product from an order that:
//  - belongs to them
//  - is in 'delivered' status
//  - actually contains that rice product
//  - hasn't already been reviewed
async function createReview(req, res, next) {
  try {
    const { order_id, rice_product_id, rating, comment } = req.body;

    if (!isPositiveInteger(order_id) || !isPositiveInteger(rice_product_id)) {
      return error(res, 400, "order_id and rice_product_id are required");
    }
    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return error(res, 400, "Rating must be an integer between 1 and 5");
    }

    const order = await Order.findByPk(order_id, { include: [{ model: OrderItem, as: "items" }] });
    if (!order) return error(res, 404, "Order not found");
    if (order.customer_id !== req.user.id) return error(res, 403, "You do not have access to this order");
    if (order.status !== "delivered") {
      return error(res, 400, "You can only review products from delivered orders");
    }

    const itemInOrder = order.items.find((i) => i.rice_product_id === Number(rice_product_id));
    if (!itemInOrder) return error(res, 400, "This rice product was not part of that order");

    const existingReview = await Review.findOne({
      where: { order_id, rice_product_id, customer_id: req.user.id },
    });
    if (existingReview) return error(res, 400, "You have already reviewed this product for this order");

    const review = await Review.create({
      customer_id: req.user.id,
      farmer_id: order.farmer_id,
      rice_product_id,
      order_id,
      rating: numericRating,
      comment: isNonEmptyString(comment) ? comment : null,
    });

    return success(res, 201, "Review submitted successfully", review);
  } catch (err) {
    next(err);
  }
}

// GET /api/rice/:id/reviews (public)
async function getRiceReviews(req, res, next) {
  try {
    const reviews = await Review.findAll({
      where: { rice_product_id: req.params.id },
      order: [["created_at", "DESC"]],
    });
    return success(res, 200, "Reviews fetched successfully", reviews);
  } catch (err) {
    next(err);
  }
}

module.exports = { createReview, getRiceReviews };
