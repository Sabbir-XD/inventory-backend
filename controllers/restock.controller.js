const RestockQueue = require("../models/RestockQueue");
const Product = require("../models/Product");

// ── Helper (mirrors product.controller — kept here for standalone use) ─────────
// NOTE: order.controller & product.controller import from product.controller.js.
//       This copy is used only internally by restock.controller routes.
const checkAndEnqueue = async (product) => {
    if (product.stock >= product.minStock) {
        // Stock recovered → remove from queue
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

// ── GET QUEUE ─────────────────────────────────────────────────────────────────
const getQueue = async (req, res) => {
    try {
        const queue = await RestockQueue.find()
            .populate("product", "name category price stock status")
            .sort({ currentStock: 1 }); // lowest stock first
        res.json(queue);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── RESTOCK ITEM ──────────────────────────────────────────────────────────────
const restockItem = async (req, res) => {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0)
        return res.status(400).json({ message: "Invalid quantity" });

    try {
        const queueItem = await RestockQueue.findById(req.params.id).populate("product");
        if (!queueItem) return res.status(404).json({ message: "Queue item not found" });

        const product = queueItem.product;
        product.stock += quantity;

        // ← fixed: use correct enum value "active" (was "Active" before)
        if (product.stock > 0) product.status = "active";

        await product.save();

        if (product.stock >= product.minStock) {
            // Fully restocked → remove from queue
            await RestockQueue.findByIdAndDelete(req.params.id);
            return res.json({ message: "Restocked and removed from queue", product });
        }

        // Still below minStock → update queue entry
        const ratio = product.stock / product.minStock;
        queueItem.currentStock = product.stock;
        queueItem.priority = ratio <= 0.5 ? "high" : ratio <= 0.75 ? "medium" : "low";
        await queueItem.save();

        res.json({ message: "Stock updated", queueItem, product });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── REMOVE FROM QUEUE (manual override) ──────────────────────────────────────
const removeFromQueue = async (req, res) => {
    try {
        const deleted = await RestockQueue.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Queue item not found" });
        res.json({ message: "Removed from restock queue" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ← fixed: CommonJS exports (was ES Module export syntax before — would crash)
module.exports = { checkAndEnqueue, getQueue, restockItem, removeFromQueue };