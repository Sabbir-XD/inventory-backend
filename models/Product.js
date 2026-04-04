const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    minStock: { type: Number, required: true, default: 5 },
    status: {
      type: String,
      enum: ["active", "out_of_stock"], // ← snake_case, consistent everywhere
      default: "active",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);