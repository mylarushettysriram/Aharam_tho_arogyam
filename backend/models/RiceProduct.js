const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RiceProduct = sequelize.define(
  "RiceProduct",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    farmer_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    variety: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    price_per_bag: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    bag_weight: { type: DataTypes.STRING, allowNull: false }, // e.g. "25kg"
    quantity_available: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    image: { type: DataTypes.STRING, allowNull: true }, // relative path e.g. "rice/basmati-1.jpg"
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    },
  },
  {
    tableName: "rice_products",
    underscored: true,
    timestamps: true,
  }
);

module.exports = RiceProduct;
