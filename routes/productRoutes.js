const express = require("express");
const { createProduct, getProducts } = require("../controllers/product.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", authMiddleware, createProduct);
router.get("/", getProducts);

module.exports = router;