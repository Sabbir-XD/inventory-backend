const Order = require("../models/Order");
const Product = require("../models/Product");

exports.getDashboard = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const ordersToday = await Order.countDocuments({
            createdAt: { $gte: today },
        });

        const pending = await Order.countDocuments({ status: "Pending" });

        const completed = await Order.countDocuments({
            status: "Delivered",
        });

        const lowStock = await Product.countDocuments({
            stock: { $lte: 5 },
        });

        const revenueData = await Order.find({
            createdAt: { $gte: today },
        });

        const revenueToday = revenueData.reduce(
            (sum, order) => sum + order.totalPrice,
            0,
        );

        res.json({
            ordersToday,
            pending,
            completed,
            lowStock,
            revenueToday,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
