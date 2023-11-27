const { getCompletionForExpense } = require("../ai/ai");
const { getDb } = require("../db/conn.js");
const Expense = require("../models/expense");

const save = async (expense) => {
    console.log("adding expense + ", JSON.stringify(expense));

    const db = getDb();
    const collection = await db.collection("expenses");
    await collection.insertOne(expense);
}

const generateExpense = async (message) => {
    const expenseCompletion = await getCompletionForExpense(message);

    try {
        const expenseObj = JSON.parse(expenseCompletion);
        if(!expenseObj.date || expenseObj.date?.match(/Date/)) {
            expenseObj.date = Date.now()
        }
        const expense = new Expense({ ...expenseObj, date: expenseObj.date, createdAt: Date.now() });
        return { expense };
    } catch {
        return { errorMessage: expenseCompletion}
    }
}

const getExpenses = async () => {
    const db = getDb();
    const collection = await db.collection("expenses");
    const expense_rows = await collection.find({}).sort({ "date": -1, "createdAt": 1 }).toArray();

    return expense_rows.map((obj) => new Expense(obj));
}

module.exports = {
    save,
    generateExpense,
    getExpenses
}