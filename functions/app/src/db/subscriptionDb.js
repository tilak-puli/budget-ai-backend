const { getDb } = require("./conn.js");
const Subscription = require("../models/subscription");
const { ObjectId } = require("mongodb");

const saveSubscription = async (subscription) => {
  console.log("Adding subscription: ", JSON.stringify(subscription));
  const collection = await getDBCollection();
  const res = await collection.insertOne(subscription);
  return res.insertedId;
};

const getSubscriptionByUserId = async (userId) => {
  const collection = await getDBCollection();
  return await collection.findOne({ userId: userId });
};

const updateSubscription = async (userId, subscriptionData) => {
  const collection = await getDBCollection();
  const result = await collection.updateOne(
    { userId },
    { $set: { ...subscriptionData, lastVerifiedDate: new Date() } },
    { upsert: true }
  );

  if (result.modifiedCount >= 1 || result.upsertedCount >= 1) {
    const updatedSubscription = await collection.findOne({ userId });
    return updatedSubscription;
  }

  return null;
};

const deleteSubscription = async (userId) => {
  const collection = await getDBCollection();
  const result = await collection.deleteOne({ userId });
  return result.deletedCount;
};

const getAllActiveSubscriptions = async () => {
  const collection = await getDBCollection();
  return await collection
    .find({
      status: "active",
      expiryDate: { $gt: new Date() },
    })
    .toArray();
};

module.exports = {
  saveSubscription,
  getSubscriptionByUserId,
  updateSubscription,
  deleteSubscription,
  getAllActiveSubscriptions,
};

async function getDBCollection() {
  const db = getDb();
  const collection = await db.collection("subscriptions");
  return collection;
}
