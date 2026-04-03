const Product = require("../models/Product");
const Category = require("../models/Category");

// CREATE PRODUCT
exports.createProduct = async (req, res) => {
  try {
    const { name, category, price, stock, minStock } = req.body;
    if (!name || !category || !price || !stock) return res.status(400).json({ message: "All fields required" });

    // Validate category exists
    const cat = await Category.findById(category);
    if (!cat) return res.status(400).json({ message: "Category not found" });

    const status = stock === 0 ? "Out of Stock" : "Active";

    const product = await Product.create({ name, category, price, stock, minStock, status });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET PRODUCTS
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("category").sort({ name: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};