const mongoose = require("mongoose");
const dns = require("dns");

dns.setDefaultResultOrder("ipv4first");

const connectDB = async () => {
  console.log("MONGO_URI =", process.env.MONGO_URI);

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;