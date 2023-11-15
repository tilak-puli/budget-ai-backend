require('dotenv').config()
const express = require("express");
const expenseRouter = require("./src/routes/expenseRouter")
const morgan = require('morgan')
const app = express();
const PORT = 3000;

app.use(express.json())
app.use(expenseRouter)
app.use(morgan(':method :url :body :status :res'))

app.get("/health", (req, res) => {
  res.send("Working")
})

app.listen(PORT, () => {
  console.log(`Listening at localhost:${PORT}`)
})
