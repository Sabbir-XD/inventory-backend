const Order = require("../models/Order");
const Product = require("../models/Product");

// CREATE ORDER
exports.createOrder = async (req, res) => {
  try {
    const { customerName, items } = req.body;

    if (!customerName || !items || items.length === 0) {
      return res.status(400).json({ message: "Invalid order data" });
    }

    let totalPrice = 0;

    // 🔹 Validate products & stock
    for (let item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(400).json({
          message: "Product not found",
        });
      }

      if (product.status === "Out of Stock") {
        return res.status(400).json({
          message: `${product.name} is out of stock`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Only ${product.stock} items available for ${product.name}`,
        });
      }

      // 🔹 Calculate price
      totalPrice += product.price * item.quantity;
    }

    // 🔹 Deduct stock
    for (let item of items) {
      const product = await Product.findById(item.product);

      product.stock -= item.quantity;

      // Update status if stock = 0
      if (product.stock === 0) {
        product.status = "Out of Stock";
      }

      await product.save();
    }

    // 🔹 Create order
    const order = await Order.create({
      customerName,
      items,
      totalPrice,
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ORDERS (filter)
exports.getOrders = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate("items.product")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE ORDER STATUS
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CANCEL ORDER
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "Cancelled") {
      return res.status(400).json({ message: "Already cancelled" });
    }

    // 🔹 Restore stock
    for (let item of order.items) {
      const product = await Product.findById(item.product);
      product.stock += item.quantity;

      if (product.stock > 0) {
        product.status = "Active";
      }

      await product.save();
    }

    order.status = "Cancelled";
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
