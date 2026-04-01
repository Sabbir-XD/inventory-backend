const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    message: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);
