const mongoose = require("mongoose");

const restockQueueSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("RestockQueue", restockQueueSchema);
