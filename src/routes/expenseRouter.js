const express = require("express");
const router = express.Router();
const controller = require("../controllers/expenseController")

router.get("/expenses", controller.getExpenses)
router.post("/ai/expense", controller.addAiExpenseWithMessage)
router.post("/whatsapp/expense", controller.addAiExpenseFromWhatsapp)
router.get("/whatsapp/expense", controller.whastappVerification)

module.exports = router
