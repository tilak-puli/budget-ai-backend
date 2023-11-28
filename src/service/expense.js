const { getCompletionForExpense } = require("../ai/ai");
const { getDb } = require("../db/conn.js");
const Expense = require("../models/expense");
const { getNowInIndiaTimezone } = require("../utils/date.js");

const save = async (expense) => {
    console.log("adding expense + ", JSON.stringify(expense));

    const db = getDb();
    const collection = await db.collection("expenses");
    await collection.insertOne(expense);
}

const generateExpense = async (message) => {
    const expenseCompletion = await getCompletionForExpense(message);
    const now = getNowInIndiaTimezone()

    try {
        const expenseObj = JSON.parse(expenseCompletion);
        // Fix this by validating date instead
        // if (!expenseObj.date || expenseObj.date === "null") {
        // Todo: find a way to get proper date from chatgpt
        expenseObj.date = now
        // }

        const expense = new Expense({ ...expenseObj, date: expenseObj.date, createdAt: now, prompt: message });
        return { expense };
    } catch {
        return { errorMessage: expenseCompletion }
    }
}

const getExpenses = async (fromDate, toDate) => {
    const db = getDb();
    const collection = await db.collection("expenses");
    const expense_rows = await collection.find({"date": { $gte: fromDate, $lte: toDate }}).sort({ "date": -1, "createdAt": 1 }).toArray();

    return expense_rows.map((obj) => new Expense(obj));
}

module.exports = {
    save,
    generateExpense,
    getExpenses
}