const { Firestore, Timestamp } = require("@google-cloud/firestore");
const Budget = require("../models/budget");

const firestore = new Firestore();
firestore.settings({ ignoreUndefinedProperties: true });

/**
 * Get budget for a specific user
 * @param {string} userId - User ID
 * @returns {Promise<Budget|null>} - Budget object or null if not found
 */
const getBudget = async (userId) => {
  const budgetsRef = firestore.collection("budgets");
  const query = budgetsRef.where("userId", "==", userId).limit(1);

  const snapshot = await query.get();

  if (snapshot.empty) {
    return null;
  }

  return parseBudget(snapshot.docs[0]);
};

/**
 * Get or create a budget for a specific user
 * @param {string} userId - User ID
 * @returns {Promise<Budget>} - Budget object
 */
const getOrCreateBudget = async (userId) => {
  const existingBudget = await getBudget(userId);

  if (existingBudget) {
    return existingBudget;
  }

  // Create new budget
  const newBudget = new Budget({
    userId,
    totalBudget: 0,
    categoryBudgets: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const budgetsRef = firestore.collection("budgets");
  const docRef = await budgetsRef.add({
    userId: newBudget.userId,
    totalBudget: newBudget.totalBudget,
    categoryBudgets: newBudget.categoryBudgets,
    createdAt: newBudget.createdAt,
    updatedAt: newBudget.updatedAt,
  });

  newBudget._id = docRef.id;
  return newBudget;
};

/**
 * Update total budget for a user
 * @param {string} userId - User ID
 * @param {number} totalBudget - Total budget amount
 * @returns {Promise<Budget>} - Updated Budget object
 */
const updateTotalBudget = async (userId, totalBudget) => {
  const budget = await getOrCreateBudget(userId);
  const budgetsRef = firestore.collection("budgets");

  await budgetsRef.doc(budget._id).update({
    totalBudget: parseFloat(totalBudget) || 0,
    updatedAt: new Date(),
  });

  budget.totalBudget = parseFloat(totalBudget) || 0;
  budget.updatedAt = new Date();

  return budget;
};

/**
 * Update category budget for a user
 * @param {string} userId - User ID
 * @param {string} category - Category name
 * @param {number} amount - Budget amount for the category
 * @returns {Promise<Budget>} - Updated Budget object
 */
const updateCategoryBudget = async (userId, category, amount) => {
  const budget = await getOrCreateBudget(userId);
  const budgetsRef = firestore.collection("budgets");

  await budgetsRef.doc(budget._id).update({
    [`categoryBudgets.${category}`]: parseFloat(amount) || 0,
    updatedAt: new Date(),
  });

  budget.categoryBudgets[category] = parseFloat(amount) || 0;
  budget.updatedAt = new Date();

  return budget;
};

/**
 * Delete a budget for a user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success status
 */
const deleteBudget = async (userId) => {
  const budgetsRef = firestore.collection("budgets");
  const query = budgetsRef.where("userId", "==", userId);

  const snapshot = await query.get();

  if (snapshot.empty) {
    return false;
  }

  let deletedCount = 0;
  for (const doc of snapshot.docs) {
    await doc.ref.delete();
    deletedCount++;
  }

  return deletedCount > 0;
};

/**
 * Helper function to parse budget document from Firestore
 * @private
 */
const parseBudget = (doc) => {
  const data = doc.data();

  // Convert all Timestamp objects to Date objects
  for (const field in data) {
    if (data[field] instanceof Timestamp) {
      data[field] = data[field].toDate();
    }
  }

  return new Budget({
    _id: doc.id,
    ...data,
  });
};

module.exports = {
  getBudget,
  getOrCreateBudget,
  updateTotalBudget,
  updateCategoryBudget,
  deleteBudget,
};
