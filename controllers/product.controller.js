const Product = require("../models/Product");

exports.createProduct = async (req, res) => {
  try {
    const { name, category, price, stock, minStock } = req.body;

    // validation
    if (!name || !category || !price || !stock) {
      return res.status(400).json({ message: "All fields required" });
    }

    const status = stock === 0 ? "Out of Stock" : "Active";

    const product = await Product.create({
      name,
      category,
      price,
      stock,
      minStock,
      status,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("category");
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
