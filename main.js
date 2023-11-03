const express = require("express");
const expenseRouter = require("./src/routes/expenseRouter")
const app = express();
const PORT = 3000;

app.use(express.json())
app.use(expenseRouter)

app.get("/health", (req, res) => {
  res.send("Working")
})

app.listen(PORT, () => {
  console.log(`Listening at localhost:${PORT}`)
})
