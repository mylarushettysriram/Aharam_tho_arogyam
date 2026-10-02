require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const sequelize = require("./config/database");
require("./models"); // registers all associations

const authRoutes = require("./routes/authRoutes");
const riceRoutes = require("./routes/riceRoutes");
const farmerRoutes = require("./routes/farmerRoutes");
const customerRoutes = require("./routes/customerRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded rice images statically: e.g. GET /uploads/rice/basmati-1.jpg
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => res.json({ success: true, message: "API is running" }));

app.use("/api/auth", authRoutes);
app.use("/api/rice", riceRoutes);
app.use("/api/farmer", farmerRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log("MySQL connection established successfully.");

    // sync() creates tables that don't exist yet. In production prefer
    // proper migrations instead of sync({ alter: true }).
    await sequelize.sync();
    // Keep existing local databases compatible with the payment field.
    const orderTable = await sequelize.getQueryInterface().describeTable("orders");
    if (!orderTable.payment_method) {
      await sequelize.getQueryInterface().addColumn("orders", "payment_method", {
        type: require("sequelize").STRING(10),
        allowNull: false,
        defaultValue: "cod",
      });
    }
    console.log("Database synced.");

    app.listen(PORT, () => {
      console.log(`Rice Marketplace API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Unable to start server:", err.message);
    process.exit(1);
  }
}

start();
