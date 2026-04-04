const Order = require("../models/Order");
const Product = require("../models/Product");
const { checkAndEnqueue } = require("./product.controller");

// ── CREATE ORDER ──────────────────────────────────────────────────────────────
exports.createOrder = async (req, res) => {
  try {
    const { customerName, items } = req.body;

    if (!customerName || !items || items.length === 0)
      return res.status(400).json({ message: "Invalid order data" });

    // ← Conflict detection: prevent duplicate products in same order
    const productIds = items.map((i) => String(i.product));
    const hasDuplicates = productIds.length !== new Set(productIds).size;
    if (hasDuplicates)
      return res.status(400).json({ message: "This product is already added to the order." });

    let totalAmount = 0; // ← renamed from totalPrice to match model

    // ── Step 1: Validate all items (fetch once, store results) ────────────────
    const resolvedItems = [];
    for (let item of items) {
      const product = await Product.findById(item.product);
      if (!product)
        return res.status(404).json({ message: "Product not found" });

      // ← fixed: check enum value "out_of_stock"
      if (product.status === "out_of_stock")
        return res.status(400).json({ message: `${product.name} is out of stock` });

      // ← Conflict: inactive product guard
      if (product.status !== "active")
        return res.status(400).json({ message: `${product.name} is currently unavailable.` });

      if (product.stock < item.quantity)
        return res.status(400).json({
          message: `Only ${product.stock} item${product.stock !== 1 ? "s" : ""} available in stock for "${product.name}"`,
        });

      totalAmount += product.price * item.quantity;
      resolvedItems.push({ product, quantity: item.quantity, price: product.price });
    }

    // ── Step 2: Deduct stock using already-fetched products (no re-fetch) ─────
    for (let { product, quantity } of resolvedItems) {
      product.stock -= quantity;
      if (product.stock === 0) product.status = "out_of_stock"; // ← fixed enum
      await product.save();
      await checkAndEnqueue(product);
    }

    // ── Step 3: Create the order ──────────────────────────────────────────────
    const orderItems = resolvedItems.map(({ product, quantity, price }) => ({
      product: product._id,
      quantity,
      price,
    }));

    // ← fixed: use customerName + totalAmount to match the model
    const order = await Order.create({ customerName, items: orderItems, totalAmount });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── UPDATE ORDER STATUS ───────────────────────────────────────────────────────
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
    if (!allowed.includes(status))
      return res.status(400).json({ message: "Invalid status value" });

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── CANCEL ORDER ──────────────────────────────────────────────────────────────
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status === "cancelled")           // ← fixed: lowercase to match enum
      return res.status(400).json({ message: "Order is already cancelled" });

    // ── Restore stock for each item ───────────────────────────────────────────
    for (let item of order.items) {
      const product = await Product.findById(item.product);
      if (!product) continue; // product may have been deleted; skip gracefully

      product.stock += item.quantity;
      if (product.stock > 0) product.status = "active"; // ← fixed enum
      await product.save();
      await checkAndEnqueue(product); // re-evaluate queue after stock restored
    }

    order.status = "cancelled"; // ← fixed: lowercase to match enum
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET ORDERS ────────────────────────────────────────────────────────────────
exports.getOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate("items.product")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};