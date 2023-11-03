const { getCompletionForExpense } = require("../ai/ai");

const expenses = [];

const getExpenses = (req, res) => {
    console.log("request to get expenses")
    res.json(expenses);
}

const addAiExpenseWithMessage = async (req, res) => {
    console.log("request to add expense + ", JSON.stringify(req.body))
    const expense = await getCompletionForExpense(req?.body?.userMessage)
    console.log("adding expense + ", JSON.stringify(expense))
    expenses.push(expense)
    res.json(expense); 
}

module.exports = {
    getExpenses,
    addAiExpenseWithMessage
}