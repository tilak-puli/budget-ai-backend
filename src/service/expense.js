const { getCompletionForExpense } = require("../utils/ai.js");
const { getDb } = require("../db/conn.js");
const Expense = require("../models/expense");
const { getNowInIndiaTimezone } = require("../utils/date.js");
const { ObjectId } = require("mongodb");

const save = async (expense) => {
    console.log("adding expense + ", JSON.stringify(expense));
    const collection = await getDBCollection();

    const res = await collection.insertOne(expense);

    return res.insertedId;
}

const generateExpense = async (userId, message) => {
    const expenseCompletion = await getCompletionForExpense(message);
    const now = getNowInIndiaTimezone()

    try {
        const expenseObj = JSON.parse(expenseCompletion);
        // Fix this by validating date instead
        // if (!expenseObj.date || expenseObj.date === "null") {
        // Todo: find a way to get proper date from chatgpt
        expenseObj.date = now
        // }

        const expense = new Expense({ ...expenseObj, date: expenseObj.date, createdAt: now, prompt: message, userId });
        return { expense };
    } catch {
        return { errorMessage: expenseCompletion }
    }
}

const getExpenses = async (userId, fromDate, toDate) => {
    const collection = await getDBCollection();
    const expense_rows = await collection.find({ "date": { $gte: fromDate, $lte: toDate }, "userId" : { $eq: userId } }).sort({ "date": -1, "createdAt": 1 }).toArray();

    return expense_rows.map((obj) => new Expense(obj));
}

const createExpense = async (userId, category, description, amount, date) => {
    const _id = save({ userId, category, description, amount, date, createdAt: getNowInIndiaTimezone() });

    return new Expense({_id, userId, category, description, amount, date});
}

const updateExpense = async (userId, id, category, description, amount, date) => {
    const collection = await getDBCollection();
    const result = await collection.updateOne({ userId, _id: new ObjectId(id) }, { $set: { description, amount, date, category, updatedAt: getNowInIndiaTimezone() } });

    if (result.modifiedCount >= 1) {
        const updatedExpense = collection.findOne({ _id: new ObjectId(id) });
        return new Expense(updatedExpense);
    }

    return null;
}

const deleteExpense = async (userId, id) => {
    const collection = await getDBCollection();
    const result = await collection.deleteOne({ userId, _id: new ObjectId(id) });

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

async function getDBCollection() {
    const db = getDb();
    const collection = await db.collection("expenses");
    return collection;
}
