require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/user-model");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_CONN);

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log("✅ Admin already exists");
      process.exit(0);
    }

    // Hash admin password from .env
    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD,
      12
    );

    // Create admin
    await User.create({
      name: process.env.ADMIN_NAME,
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      number: "0000000000",
      role: "admin",
    });

    console.log("✅ Admin created successfully");
    process.exit(0);

  } catch (err) {
    console.error("❌ Error creating admin:", err);
    process.exit(1);
  }
})();