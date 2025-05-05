const { getDb } = require("../db/conn.js");
const Expense = require("../models/expense");
const { ObjectId } = require("mongodb");

const save = async (expense) => {
  console.log("adding expense + ", JSON.stringify(expense));
  const collection = await getDBCollection();

  const res = await collection.insertOne(expense);

  return res.insertedId;
};

const getExpenses = async (userId, fromDate, toDate) => {
  const collection = await getDBCollection();
  return await collection
    .find({ date: { $gte: fromDate, $lte: toDate }, userId: { $eq: userId } })
    .sort({ date: -1, createdAt: 1 })
    .toArray();
};

const createExpense = async (
  userId,
  category,
  description,
  amount,
  date,
  createdAt
) => {
  return await save({ userId, category, description, amount, date, createdAt });
};

const updateExpense = async (
  userId,
  id,
  category,
  description,
  amount,
  date,
  updatedAt
) => {
  const collection = await getDBCollection();
  const result = await collection.updateOne(
    { userId, _id: new ObjectId(id) },
    { $set: { description, amount, date, category, updatedAt } }
  );

  if (result.modifiedCount >= 1) {
    const updatedExpense = collection.findOne({ _id: new ObjectId(id) });
    return updatedExpense;
  }

  return null;
};

const deleteExpense = async (userId, id) => {
  const collection = await getDBCollection();
  const result = await collection.deleteOne({ userId, _id: new ObjectId(id) });

  return result.deletedCount;
};

const saveReport = async (report) => {
  const collection = await getReportCollection();
  const res = await collection.insertOne(report);
  return res.insertedId;
};

module.exports = {
  save,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  saveReport,
};

async function getDBCollection() {
  const db = getDb();
  const collection = await db.collection("expenses");
  return collection;
}

async function getReportCollection() {
  const db = getDb();
  const collection = await db.collection("reports");
  return collection;
}
