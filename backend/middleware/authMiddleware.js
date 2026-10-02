const { User } = require("../models");
const { error } = require("../utils/response");

// Simple local-development authentication using the logged-in user's id.
async function protect(req, res, next) {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) return error(res, 401, "Please login first");

    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return error(res, 401, "Not authorized, user no longer exists");
    }

    req.user = user; // downstream code uses req.user.id / req.user.role
    next();
  } catch (err) {
    return error(res, 401, "Please login first");
  }
}

module.exports = { protect };
