const express = require("express");
const {
    createOrder,
    getOrders,
    updateOrderStatus,
    cancelOrder,
} = require("../controllers/order.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", authMiddleware, createOrder);
router.get("/", authMiddleware, getOrders);
router.put("/:id/status", authMiddleware, updateOrderStatus);
router.put("/:id/cancel", authMiddleware, cancelOrder);

module.exports = router;
