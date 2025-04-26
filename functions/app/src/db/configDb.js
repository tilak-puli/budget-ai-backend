const { Firestore } = require("@google-cloud/firestore");

const firestore = new Firestore();
firestore.settings({ ignoreUndefinedProperties: true });

/**
 * Get all configuration settings from the app_config document
 * @returns {Promise<Object>} - Object containing all configuration settings
 */
const getAllConfig = async () => {
  const configRef = firestore.collection("config").doc("app_config");
  const doc = await configRef.get();

  if (!doc.exists) {
    return {};
  }

  return doc.data() || {};
};

module.exports = {
  getAllConfig,
};
