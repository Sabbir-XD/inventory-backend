const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true }, // ← was missing
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true },             // ← unified name
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"], // ← added shipped & delivered
      default: "confirmed",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);