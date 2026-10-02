const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Order = sequelize.define(
  "Order",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    customer_id: { type: DataTypes.INTEGER, allowNull: false },
    farmer_id: { type: DataTypes.INTEGER, allowNull: false },
    total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    payment_method: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "cod",
      validate: { isIn: [["cod", "upi"]] },
    },
    delivery_name: { type: DataTypes.STRING, allowNull: false },
    delivery_phone: { type: DataTypes.STRING, allowNull: false },
    alternate_phone: { type: DataTypes.STRING, allowNull: true },
    delivery_address: { type: DataTypes.STRING, allowNull: false },
    delivery_city: { type: DataTypes.STRING, allowNull: false },
    delivery_state: { type: DataTypes.STRING, allowNull: false },
    delivery_pincode: { type: DataTypes.STRING, allowNull: false },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "accepted",
        "rejected",
        "processing",
        "out_for_delivery",
        "delivered",
        "cancelled"
      ),
      allowNull: false,
      defaultValue: "pending",
    },
  },
  {
    tableName: "orders",
    underscored: true,
    timestamps: true,
  }
);

module.exports = Order;
