const { getCompletionForExpense } = require("../ai/ai");
const { getDb } = require("../db/conn.js");
const Expense = require("../models/expense");
const { getNowInIndiaTimezone } = require("../utils/date.js");
const { ObjectId } = require("mongodb");

const save = async (expense) => {
    console.log("adding expense + ", JSON.stringify(expense));

    const db = getDb();
    const collection = await db.collection("expenses");
    await collection.insertOne(expense).insertedId;
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
    const expense_rows = await collection.find({ "date": { $gte: fromDate, $lte: toDate } }).sort({ "date": -1, "createdAt": 1 }).toArray();

    return expense_rows.map((obj) => new Expense(obj));
}

const createExpense = async (category, description, amount, date) => {
    const db = getDb();
    const collection = await db.collection("expenses");
    const expense = await collection.insertOne({ category, description, amount, date, createdAt: new Date() });

    return new Expense(expense);
}

const updateExpense = async (id, category, description, amount, date) => {
    const db = getDb();
    const collection = await db.collection("expenses");
    const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: { description, amount, date, category, updatedAt: new Date() } });

    if (result.modifiedCount >= 1) {
        const updatedExpense = collection.findOne({ _id: new ObjectId(id) });
        return new Expense(updatedExpense);
    }

    return null;
}

const deleteExpense = async (id) => {
    const db = getDb();
    const collection = await db.collection("expenses");
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 1) {
        console.log("Successfully deleted one expense.");
        return true;
    }

    console.log(`No documents matched the query. Deleted ${result.deleteExpense} expense.`);
    return false;
}

module.exports = {
    save,
    generateExpense,
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense
}