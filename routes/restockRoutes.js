// restockRoutes.js   ← FIXED: was ES Module (import/export), now CommonJS
const express3 = require("express");
const {
    getQueue,
    restockItem,
    removeFromQueue,
} = require("../controllers/restock.controller");

const restockRouter = express3.Router();

restockRouter.get("/", getQueue);
restockRouter.patch("/:id/restock", restockItem);
restockRouter.delete("/:id", removeFromQueue);

module.exports = restockRouter;