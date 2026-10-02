const { Op } = require("sequelize");
const { RiceProduct, User, Review } = require("../models");
const { success, error } = require("../utils/response");
const {
  isNonEmptyString,
  isPositiveNumber,
  isPositiveInteger,
} = require("../utils/validators");

// GET /api/rice  (public, supports ?search=&variety=&minPrice=&maxPrice=)
async function getAllRice(req, res, next) {
  try {
    const { search, variety, minPrice, maxPrice } = req.query;
    const where = { status: "active" };

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { variety: { [Op.like]: `%${search}%` } },
      ];
    }
    if (variety) where.variety = variety;
    if (minPrice || maxPrice) {
      where.price_per_bag = {};
      if (minPrice) where.price_per_bag[Op.gte] = Number(minPrice);
      if (maxPrice) where.price_per_bag[Op.lte] = Number(maxPrice);
    }

    const rice = await RiceProduct.findAll({
      where,
      include: [{ model: User, as: "farmer", attributes: ["id", "name", "city", "state", "phone"] }],
      order: [["created_at", "DESC"]],
    });

    return success(res, 200, "Rice products fetched successfully", rice);
  } catch (err) {
    next(err);
  }
}

// GET /api/rice/:id (public)
async function getRiceById(req, res, next) {
  try {
    const rice = await RiceProduct.findByPk(req.params.id, {
      include: [
        { model: User, as: "farmer", attributes: ["id", "name", "city", "state", "phone"] },
        { model: Review, as: "reviews", include: [{ model: User, as: "customer", attributes: ["id", "name"] }] },
      ],
    });

    if (!rice) return error(res, 404, "Rice product not found");

    const reviews = rice.reviews || [];
    const avgRating =
      reviews.length > 0
        ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
        : null;

    return success(res, 200, "Rice product fetched successfully", {
      ...rice.toJSON(),
      averageRating: avgRating,
      reviewCount: reviews.length,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/rice (farmer only)
async function createRice(req, res, next) {
  try {
    const { name, variety, description, price_per_bag, bag_weight, quantity_available } = req.body;

    if (!isNonEmptyString(name)) return error(res, 400, "Rice name is required");
    if (!isNonEmptyString(variety)) return error(res, 400, "Variety is required");
    if (!isPositiveNumber(price_per_bag)) return error(res, 400, "Price per bag must be a positive number");
    if (!isNonEmptyString(bag_weight)) return error(res, 400, "Bag weight is required");
    if (!isPositiveInteger(quantity_available) && Number(quantity_available) !== 0)
      return error(res, 400, "Quantity available must be a non-negative integer");

    const image = req.file ? `rice/${req.file.filename}` : null;

    const rice = await RiceProduct.create({
      farmer_id: req.user.id, // NEVER trust a farmer_id from the request body
      name,
      variety,
      description: description || null,
      price_per_bag,
      bag_weight,
      quantity_available: Number(quantity_available),
      image,
    });

    return success(res, 201, "Rice product created successfully", rice);
  } catch (err) {
    next(err);
  }
}

// PUT /api/rice/:id (farmer only, must own the product)
async function updateRice(req, res, next) {
  try {
    const rice = await RiceProduct.findByPk(req.params.id);
    if (!rice) return error(res, 404, "Rice product not found");
    if (rice.farmer_id !== req.user.id) return error(res, 403, "You do not own this rice product");

    const { name, variety, description, price_per_bag, bag_weight, quantity_available, status } = req.body;

    if (name !== undefined) rice.name = name;
    if (variety !== undefined) rice.variety = variety;
    if (description !== undefined) rice.description = description;
    if (price_per_bag !== undefined) {
      if (!isPositiveNumber(price_per_bag)) return error(res, 400, "Price per bag must be a positive number");
      rice.price_per_bag = price_per_bag;
    }
    if (bag_weight !== undefined) rice.bag_weight = bag_weight;
    if (quantity_available !== undefined) {
      if (Number(quantity_available) < 0) return error(res, 400, "Quantity cannot be negative");
      rice.quantity_available = Number(quantity_available);
    }
    if (status !== undefined) rice.status = status;
    if (req.file) rice.image = `rice/${req.file.filename}`;

    await rice.save();

    return success(res, 200, "Rice product updated successfully", rice);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/rice/:id (farmer only, must own the product)
async function deleteRice(req, res, next) {
  try {
    const rice = await RiceProduct.findByPk(req.params.id);
    if (!rice) return error(res, 404, "Rice product not found");
    if (rice.farmer_id !== req.user.id) return error(res, 403, "You do not own this rice product");

    await rice.destroy();

    return success(res, 200, "Rice product deleted successfully", null);
  } catch (err) {
    next(err);
  }
}

// GET /api/farmer/rice (farmer only - their own listings, any status)
async function getMyRice(req, res, next) {
  try {
    const rice = await RiceProduct.findAll({
      where: { farmer_id: req.user.id },
      order: [["created_at", "DESC"]],
    });
    return success(res, 200, "Your rice products fetched successfully", rice);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllRice, getRiceById, createRice, updateRice, deleteRice, getMyRice };
