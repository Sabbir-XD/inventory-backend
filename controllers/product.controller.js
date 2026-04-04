const Product = require("../models/Product");
const Category = require("../models/Category");
const RestockQueue = require("../models/RestockQueue");

// ── Helper: add/update/remove restock queue entry based on current stock ──────
const checkAndEnqueue = async (product) => {
  if (product.stock >= product.minStock) {
    // Stock recovered → remove from queue if present
    await RestockQueue.findOneAndDelete({ product: product._id });
    return;
  }

  const ratio = product.stock / product.minStock;
  const priority = ratio === 0 || ratio <= 0.5 ? "high" : ratio <= 0.75 ? "medium" : "low";

  await RestockQueue.findOneAndUpdate(
    { product: product._id },
    { currentStock: product.stock, minStock: product.minStock, priority },
    { upsert: true, new: true },
  );
};

// ── CREATE PRODUCT ────────────────────────────────────────────────────────────
exports.createProduct = async (req, res) => {
  try {
    const { name, category, price, stock, minStock } = req.body;

    if (!name || !category || price == null || stock == null)
      return res.status(400).json({ message: "All fields required" });

    const cat = await Category.findById(category);
    if (!cat) return res.status(400).json({ message: "Category not found" });

    // ← fixed: use enum values "active" / "out_of_stock"
    const status = stock === 0 ? "out_of_stock" : "active";
    const product = await Product.create({ name, category, price, stock, minStock, status });

    await checkAndEnqueue(product);

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET PRODUCTS ──────────────────────────────────────────────────────────────
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("category").sort({ name: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── DEDUCT STOCK (single product — direct API call) ───────────────────────────
exports.deductStock = async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity <= 0)
    return res.status(400).json({ message: "Invalid quantity" });

  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // ← fixed: check enum value "out_of_stock"
    if (product.stock === 0 || product.status === "out_of_stock")
      return res.status(400).json({ message: "Product is out of stock" });

    if (quantity > product.stock)
      return res.status(400).json({
        message: `Only ${product.stock} item${product.stock !== 1 ? "s" : ""} available in stock`,
      });

    product.stock -= quantity;
    if (product.stock === 0) product.status = "out_of_stock"; // ← fixed enum
    await product.save();
    await checkAndEnqueue(product);

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Export helper so order.controller can import it
module.exports.checkAndEnqueue = checkAndEnqueue;