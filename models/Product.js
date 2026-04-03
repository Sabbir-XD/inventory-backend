const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  minStock: { type: Number, default: 0 },
  status: { type: String, enum: ["Active", "Out of Stock"], default: "Active" }
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);