const { Sequelize } = require("sequelize");
require("dotenv").config();

const useSqlite =
  process.env.DB_DIALECT === "sqlite" ||
  !process.env.DB_HOST ||
  process.env.DB_PASSWORD === "your_mysql_password";

// Use a local SQLite file when MySQL is not configured; DB_HOST keeps MySQL support.
const sequelize = useSqlite
  ? new Sequelize({
      dialect: "sqlite",
      storage: process.env.SQLITE_STORAGE || "rice-marketplace.sqlite",
      logging: false,
    })
  : new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      dialect: "mysql",
      logging: false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    });

module.exports = sequelize;
