const express = require("express");
const {
  createCategory,
  getCategories,
} = require("../controllers/category.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", authMiddleware, createCategory);
router.get("/", authMiddleware, getCategories);

module.exports = router;
