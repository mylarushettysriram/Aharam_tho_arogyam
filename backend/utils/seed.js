// Run with: npm run seed
// Creates a demo farmer, a demo customer, and 6 rice listings using the
// default sample images already sitting in backend/uploads/rice/.
require("dotenv").config();
const bcrypt = require("bcryptjs");
const sequelize = require("../config/database");
const { User, RiceProduct } = require("../models");
require("../models"); // associations

const DEFAULT_RICE = [
  {
    name: "Premium Basmati Rice",
    variety: "Basmati",
    description: "Long-grain aromatic basmati rice, aged for extra fragrance.",
    price_per_bag: 1800,
    bag_weight: "25kg",
    quantity_available: 40,
    image: "rice/basmati-1.jpg",
  },
  {
    name: "Sona Masoori Rice",
    variety: "Sona Masoori",
    description: "Light, aromatic, medium-grain rice - a South Indian household staple.",
    price_per_bag: 1400,
    bag_weight: "25kg",
    quantity_available: 60,
    image: "rice/sona-masoori-1.jpg",
  },
  {
    name: "Organic Brown Rice",
    variety: "Brown Rice",
    description: "Unpolished, fiber-rich brown rice grown without chemical fertilizers.",
    price_per_bag: 2100,
    bag_weight: "25kg",
    quantity_available: 25,
    image: "rice/brown-rice-1.jpg",
  },
  {
    name: "Ponni Rice",
    variety: "Ponni",
    description: "Soft-cooking ponni rice, ideal for daily meals.",
    price_per_bag: 1500,
    bag_weight: "25kg",
    quantity_available: 50,
    image: "rice/ponni-1.jpg",
  },
  {
    name: "Idly Rice",
    variety: "Idly Rice",
    description: "Parboiled rice specially suited for soft idlies and dosas.",
    price_per_bag: 1350,
    bag_weight: "25kg",
    quantity_available: 35,
    image: "rice/idly-rice-1.jpg",
  },
  {
    name: "Black Rice (Forbidden Rice)",
    variety: "Black Rice",
    description: "Antioxidant-rich heirloom black rice with a nutty flavor.",
    price_per_bag: 2600,
    bag_weight: "10kg",
    quantity_available: 2,
    image: "rice/black-rice-1.jpg",
  },
];

async function seed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const hashedPassword = await bcrypt.hash("password123", 10);

    const [farmer] = await User.findOrCreate({
      where: { email: "farmer@demo.com" },
      defaults: {
        name: "Ramesh Kumar",
        email: "farmer@demo.com",
        password: hashedPassword,
        phone: "9876543210",
        role: "farmer",
        address: "Village Road",
        city: "Kukatpally",
        state: "Telangana",
        pincode: "500072",
      },
    });

    const [customer] = await User.findOrCreate({
      where: { email: "customer@demo.com" },
      defaults: {
        name: "Ravi Sharma",
        email: "customer@demo.com",
        password: hashedPassword,
        phone: "9123456780",
        role: "customer",
        address: "MG Road",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500001",
      },
    });

    const existingRiceCount = await RiceProduct.count({ where: { farmer_id: farmer.id } });
    if (existingRiceCount === 0) {
      for (const item of DEFAULT_RICE) {
        await RiceProduct.create({ ...item, farmer_id: farmer.id });
      }
      console.log(`Seeded ${DEFAULT_RICE.length} default rice products for farmer@demo.com`);
    } else {
      console.log("Farmer already has rice products - skipping product seed.");
    }

    console.log("\nDemo accounts (password for both: password123):");
    console.log("  Farmer:   farmer@demo.com");
    console.log("  Customer: customer@demo.com");

    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exit(1);
  }
}

seed();
