const { Firestore, Timestamp } = require("@google-cloud/firestore");

const firestore = new Firestore();

firestore.settings({ ignoreUndefinedProperties: true });

const saveSubscription = async (subscription) => {
  console.log("Adding subscription: ", JSON.stringify(subscription));
  const subscriptionsRef = firestore.collection("subscriptions");
  const subscriptionDocRef = await subscriptionsRef.add({
    ...subscription,
    createdAt: new Date(),
  });
  return subscriptionDocRef.id;
};

const getSubscriptionByUserId = async (userId) => {
  const subscriptionsRef = firestore.collection("subscriptions");
  const query = subscriptionsRef.where("userId", "==", userId).limit(1);
  const snapshot = await query.get();

  if (snapshot.empty) {
    return null;
  }

  return parseSubscription(snapshot.docs[0]);
};

const updateSubscription = async (userId, subscriptionData) => {
  const subscriptionsRef = firestore.collection("subscriptions");

  // Find the subscription first
  const query = subscriptionsRef.where("userId", "==", userId).limit(1);
  const snapshot = await query.get();

  if (snapshot.empty) {
    // Create new subscription if it doesn't exist
    const newSubscription = {
      userId,
      ...subscriptionData,
      lastVerifiedDate: new Date(),
    };
    const docRef = await subscriptionsRef.add(newSubscription);

    // Get the newly created subscription
    const newDoc = await docRef.get();
    return parseSubscription(newDoc);
  }

  // Update existing subscription
  const docId = snapshot.docs[0].id;
  const docRef = subscriptionsRef.doc(docId);
  await docRef.update({
    ...subscriptionData,
    lastVerifiedDate: new Date(),
  });

  // Get the updated subscription
  const updatedDoc = await docRef.get();
  return parseSubscription(updatedDoc);
};

const deleteSubscription = async (userId) => {
  const subscriptionsRef = firestore.collection("subscriptions");
  const query = subscriptionsRef.where("userId", "==", userId);
  const snapshot = await query.get();

  if (snapshot.empty) {
    return 0;
  }

  // Delete the document(s)
  let deletedCount = 0;
  for (const doc of snapshot.docs) {
    await doc.ref.delete();
    deletedCount++;
  }

  return deletedCount;
};

const getAllActiveSubscriptions = async () => {
  const subscriptionsRef = firestore.collection("subscriptions");
  const now = new Date();

  const query = subscriptionsRef
    .where("status", "==", "active")
    .where("expiryDate", ">", now);

  const snapshot = await query.get();
  return snapshot.docs.map(parseSubscription);
};

const parseSubscription = (doc) => {
  const data = doc.data();

  // Convert all Timestamp objects to Date objects
  for (const field in data) {
    if (data[field] instanceof Timestamp) {
      data[field] = data[field].toDate();
    }
  }

  return {
    _id: doc.id,
    ...data,
  };
};

module.exports = {
  saveSubscription,
  getSubscriptionByUserId,
  updateSubscription,
  deleteSubscription,
  getAllActiveSubscriptions,
};
