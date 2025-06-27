const { Firestore, Timestamp } = require("@google-cloud/firestore");
const UserMessage = require("../models/userMessage.js");

const firestore = new Firestore();
firestore.settings({ ignoreUndefinedProperties: true });

/**
 * Save a user message to the database
 * @param {UserMessage} userMessage - UserMessage instance to save
 * @returns {Promise<string>} - Document ID of the saved message
 */
const saveUserMessage = async (userMessage) => {
  try {
    const userMessagesRef = firestore.collection("userMessages");
    const messageData = userMessage.toObject();

    const docRef = await userMessagesRef.add(messageData);
    console.log("User message saved with ID:", docRef.id);

    return docRef.id;
  } catch (error) {
    console.error("Error saving user message:", error);
    throw error;
  }
};

/**
 * Get user messages for a specific user
 * @param {string} userId - User ID
 * @param {number} limit - Number of messages to retrieve (default: 50)
 * @param {Date} fromDate - Optional start date filter
 * @param {Date} toDate - Optional end date filter
 * @returns {Promise<UserMessage[]>} - Array of UserMessage instances
 */
const getUserMessages = async (
  userId,
  limit = 50,
  fromDate = null,
  toDate = null
) => {
  try {
    const userMessagesRef = firestore.collection("userMessages");

    let query = userMessagesRef
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(limit);

    if (fromDate) {
      query = query.where("createdAt", ">=", fromDate);
    }

    if (toDate) {
      query = query.where("createdAt", "<=", toDate);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => {
      const data = parseUserMessage(doc);
      return new UserMessage({ _id: doc.id, ...data });
    });
  } catch (error) {
    console.error("Error getting user messages:", error);
    throw error;
  }
};

/**
 * Get recent conversation history for a user
 * @param {string} userId - User ID
 * @param {number} limit - Number of recent messages (default: 10)
 * @returns {Promise<UserMessage[]>} - Array of recent UserMessage instances
 */
const getRecentConversation = async (userId, limit = 10) => {
  return getUserMessages(userId, limit);
};

/**
 * Parse user message document from Firestore
 * @param {DocumentSnapshot} doc - Firestore document
 * @returns {Object} - Parsed user message data
 */
const parseUserMessage = (doc) => {
  const data = doc.data();

  // Convert Firestore timestamps to JavaScript dates
  for (const field in data) {
    if (data[field] instanceof Timestamp) {
      data[field] = data[field].toDate();
    }
  }

  return data;
};

/**
 * Delete user messages older than specified days
 * @param {number} daysOld - Number of days (default: 30)
 * @returns {Promise<number>} - Number of deleted messages
 */
const cleanupOldMessages = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const userMessagesRef = firestore.collection("userMessages");
    const query = userMessagesRef.where("createdAt", "<", cutoffDate);

    const snapshot = await query.get();
    const batch = firestore.batch();

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    console.log(`Cleaned up ${snapshot.docs.length} old user messages`);
    return snapshot.docs.length;
  } catch (error) {
    console.error("Error cleaning up old messages:", error);
    throw error;
  }
};

/**
 * Get message statistics for a user
 * @param {string} userId - User ID
 * @param {Date} fromDate - Start date (default: beginning of current month)
 * @param {Date} toDate - End date (default: now)
 * @returns {Promise<Object>} - Message statistics
 */
const getMessageStats = async (userId, fromDate = null, toDate = null) => {
  try {
    if (!fromDate) {
      fromDate = new Date();
      fromDate.setDate(1); // First day of current month
      fromDate.setHours(0, 0, 0, 0);
    }

    if (!toDate) {
      toDate = new Date();
    }

    const userMessagesRef = firestore.collection("userMessages");
    const query = userMessagesRef
      .where("userId", "==", userId)
      .where("createdAt", ">=", fromDate)
      .where("createdAt", "<=", toDate);

    const snapshot = await query.get();

    const stats = {
      totalMessages: snapshot.docs.length,
      expenseMessages: 0,
      questionMessages: 0,
      errorMessages: 0,
      period: {
        from: fromDate,
        to: toDate,
      },
    };

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      switch (data.messageType) {
        case "expense":
          stats.expenseMessages++;
          break;
        case "question":
          stats.questionMessages++;
          break;
        case "error":
          stats.errorMessages++;
          break;
      }
    });

    return stats;
  } catch (error) {
    console.error("Error getting message stats:", error);
    throw error;
  }
};

module.exports = {
  saveUserMessage,
  getUserMessages,
  getRecentConversation,
  cleanupOldMessages,
  getMessageStats,
};
