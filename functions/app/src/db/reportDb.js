const { Firestore } = require("@google-cloud/firestore");

const firestore = new Firestore();
firestore.settings({ ignoreUndefinedProperties: true });

/**
 * Save a report to the 'reports' collection
 * @param {Object} report - The report object to save
 * @returns {Promise<string>} - The inserted report's ID
 */
const saveReport = async (report) => {
  const reportsRef = firestore.collection("reports");
  const docRef = await reportsRef.add({
    ...report,
    reportedAt: new Date(),
  });
  return docRef.id;
};

module.exports = { saveReport };
