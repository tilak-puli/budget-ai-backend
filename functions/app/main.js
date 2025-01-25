require('dotenv').config()
const morganBody = require('morgan-body');
const express = require('express');
const bodyParser = require('body-parser');
const expenseRouter = require("./src/routes/expenseRouter")
const appInfoRouter = require("./src/routes/appInfoRouter")
var cors = require('cors')
const app = express();

app.use(cors())
app.use(express.json())
app.use(bodyParser.json());
// morganBody(app);

app.use(expenseRouter)
app.use(appInfoRouter)

app.get("/health", (req, res) => {
  res.send("Working")
})

exports.app = app;