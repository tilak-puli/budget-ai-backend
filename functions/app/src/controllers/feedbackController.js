const { saveReport } = require("../db/reportDb.js");

/**
 * Handles POST /report-ai-expense
 * Expects body: { expense: {...}, message: "..." }
 * Saves the report to the 'reports' collection
 */
const reportAiExpense = async (req, res) => {
  try {
    const { expense, message } = req.body;
    if (!expense || !message) {
      return res.status(400).json({
        success: false,
        error: "Missing expense or message in request body",
      });
    }
    const report = {
      expense,
      message,
    };
    const insertedId = await saveReport(report);
    res.json({ success: true, reportId: insertedId });
  } catch (error) {
    console.error("Error saving AI expense report:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { reportAiExpense };
