const admin = require('firebase-admin');

const serviceAccount = require('./firebaseKey.json');
const { async } = require('@firebase/util');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const getUserByPhoneNumber = async (phoneNumber) => {
  try {
    return {
      firebaseUser: await firebase.auth().getUserByPhoneNumber(phoneNumber)
    };
  } catch {
    return { errorMessage: "user not found" }
  }
}

module.exports = { admin };