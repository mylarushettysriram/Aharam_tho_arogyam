const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PasswordResetOtp = sequelize.define(
  "PasswordResetOtp",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    otp: { type: DataTypes.STRING, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    tableName: "password_reset_otps",
    underscored: true,
    timestamps: true,
  }
);

module.exports = PasswordResetOtp;
