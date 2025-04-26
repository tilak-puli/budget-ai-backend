require("dotenv").config();
const morganBody = require("morgan-body");
const express = require("express");
const bodyParser = require("body-parser");
const expenseRouter = require("./src/routes/expenseRouter");
const appInfoRouter = require("./src/routes/appInfoRouter");
const subscriptionRouter = require("./src/routes/subscriptionRouter");
const budgetRouter = require("./src/routes/budgetRouter");
const appRouter = require("./src/routes/appRouter");
var cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
// morganBody(app);

app.get("/health", (req, res) => {
  res.send("Working");
});

app.use(appInfoRouter);
app.use(expenseRouter);
app.use(subscriptionRouter);
app.use(budgetRouter);
app.use(appRouter);

exports.app = app;
