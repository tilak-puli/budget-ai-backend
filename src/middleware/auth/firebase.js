const admin = require('firebase-admin');

const serviceAccount = require('./firebaseKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const getUserByPhoneNumber = async (phoneNumber) => {
  try {
    const user = await admin.auth().getUserByPhoneNumber("+" + phoneNumber)
    return {
      firebaseUser: user
    };
  } catch(error) {
    return { errorMessage: "user not found" }
  }
}

module.exports = { admin, getUserByPhoneNumber };