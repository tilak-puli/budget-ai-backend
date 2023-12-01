require('dotenv').config()
const express = require("express");
const expenseRouter = require("./src/routes/expenseRouter")
const morgan = require('morgan')
var cors = require('cors')
const app = express();
const PORT = 3000;


app.use(cors())
app.use(express.json())
app.use(morgan(function (tokens, req, res) {
  try {
    return [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, 'content-length'), '-',
      tokens['response-time'](req, res), 'ms'
    ].join(' ')
  } catch {
    return 'Failed to create log'
  }
}))

app.use(expenseRouter)

app.get("/health", (req, res) => {
  res.send("Working")
})

app.listen(PORT, () => {
  console.log(`Listening at localhost:${PORT}`)
})
