const Order = require("../models/Order");
const Product = require("../models/Product");

// CREATE ORDER
exports.createOrder = async (req, res) => {
  try {
    const { customerName, items } = req.body;
    if (!customerName || !items || items.length === 0) return res.status(400).json({ message: "Invalid order data" });

    let totalPrice = 0;

    for (let item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(400).json({ message: "Product not found" });
      if (product.status === "Out of Stock") return res.status(400).json({ message: `${product.name} out of stock` });
      if (product.stock < item.quantity) return res.status(400).json({ message: `Only ${product.stock} items available for ${product.name}` });

      totalPrice += product.price * item.quantity;
    }

    // Deduct stock
    for (let item of items) {
      const product = await Product.findById(item.product);
      product.stock -= item.quantity;
      if (product.stock === 0) product.status = "Out of Stock";
      await product.save();
    }

    const order = await Order.create({ customerName, items, totalPrice });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE ORDER STATUS
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CANCEL ORDER
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status === "Cancelled") return res.status(400).json({ message: "Already cancelled" });

    // Restore stock
    for (let item of order.items) {
      const product = await Product.findById(item.product);
      product.stock += item.quantity;
      if (product.stock > 0) product.status = "Active";
      await product.save();
    }

    order.status = "Cancelled";
    await order.save();

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ORDERS (filter by status or date)
exports.getOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const orders = await Order.find(filter).populate("items.product").sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};