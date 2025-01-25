const express = require("express");
const router = express.Router();
const controller = require("../controllers/expenseController")
const authMiddleware = require("../middleware/auth")

router.post("/whatsapp/expense", controller.addAiExpenseFromWhatsapp)
router.get("/whatsapp/expense", controller.whastappVerification)

// WITH AUTH
router.use("/", authMiddleware);
router.get("/expenses", controller.getExpenses)
router.patch("/expenses", controller.updateExpense)
router.delete("/expenses", controller.deleteExpense)
router.post("/expenses", controller.createExpense)
router.post("/ai/expense", controller.addAiExpenseWithMessage)

module.exports = router
