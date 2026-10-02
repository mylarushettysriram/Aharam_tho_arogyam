const sequelize = require("../config/database");
const User = require("./User");
const Otp = require("./Otp");
const PasswordResetOtp = require("./PasswordResetOtp");
const RiceProduct = require("./RiceProduct");
const Order = require("./Order");
const OrderItem = require("./OrderItem");
const Review = require("./Review");

// ---- Associations ----

// A farmer (User) has many RiceProducts
User.hasMany(RiceProduct, { foreignKey: "farmer_id", as: "riceProducts" });
RiceProduct.belongsTo(User, { foreignKey: "farmer_id", as: "farmer" });

// A customer (User) has many Orders as buyer, a farmer has many Orders as seller
User.hasMany(Order, { foreignKey: "customer_id", as: "customerOrders" });
Order.belongsTo(User, { foreignKey: "customer_id", as: "customer" });

User.hasMany(Order, { foreignKey: "farmer_id", as: "farmerOrders" });
Order.belongsTo(User, { foreignKey: "farmer_id", as: "farmer" });

// An Order has many OrderItems
Order.hasMany(OrderItem, { foreignKey: "order_id", as: "items" });
OrderItem.belongsTo(Order, { foreignKey: "order_id", as: "order" });

// A RiceProduct can appear in many OrderItems
RiceProduct.hasMany(OrderItem, { foreignKey: "rice_product_id", as: "orderItems" });
OrderItem.belongsTo(RiceProduct, { foreignKey: "rice_product_id", as: "riceProduct" });

// Reviews
User.hasMany(Review, { foreignKey: "customer_id", as: "reviews" });
Review.belongsTo(User, { foreignKey: "customer_id", as: "customer" });

RiceProduct.hasMany(Review, { foreignKey: "rice_product_id", as: "reviews" });
Review.belongsTo(RiceProduct, { foreignKey: "rice_product_id", as: "riceProduct" });

Order.hasOne(Review, { foreignKey: "order_id", as: "review" });
Review.belongsTo(Order, { foreignKey: "order_id", as: "order" });

module.exports = {
  sequelize,
  User,
  Otp,
  PasswordResetOtp,
  RiceProduct,
  Order,
  OrderItem,
  Review,
};
