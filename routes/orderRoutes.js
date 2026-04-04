// orderRoutes.js
const express = require("express");
const {
    createOrder,
    getOrders,
    updateOrderStatus,
    cancelOrder,
} = require("../controllers/order.controller");
const authMiddleware = require("../middleware/auth.middleware");

const orderRouter = express.Router();

orderRouter.post("/", authMiddleware, createOrder);
orderRouter.get("/", authMiddleware, getOrders);
orderRouter.put("/:id/status", authMiddleware, updateOrderStatus);
orderRouter.put("/:id/cancel", authMiddleware, cancelOrder);

module.exports = orderRouter;