const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: { type: DataTypes.STRING, allowNull: false }, // bcrypt hash, never plain text
    phone: { type: DataTypes.STRING, allowNull: false },
    role: {
      type: DataTypes.ENUM("farmer", "customer"),
      allowNull: false,
    },
    address: { type: DataTypes.STRING, allowNull: true },
    city: { type: DataTypes.STRING, allowNull: true },
    state: { type: DataTypes.STRING, allowNull: true },
    pincode: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: "users",
    underscored: true, // created_at / updated_at columns
    timestamps: true,
  }
);

module.exports = User;
