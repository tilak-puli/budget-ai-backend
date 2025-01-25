const { onRequest } = require("firebase-functions/v2/https");
const { app } = require("./app/main");

exports.backend = onRequest(app);
