// productRoutes.js
const express2 = require("express");
const {
  createProduct,
  getProducts,
  deductStock,            // ← was missing from routes entirely
} = require("../controllers/product.controller");
const authMiddleware2 = require("../middleware/auth.middleware");

const productRouter = express2.Router();

productRouter.post("/", authMiddleware2, createProduct);
productRouter.get("/", getProducts);
productRouter.patch("/:id/deduct-stock", authMiddleware2, deductStock); // ← added

module.exports = productRouter;