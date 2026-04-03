const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: { type: Number, required: true }
    }
  ],
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"], default: "Pending" }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);