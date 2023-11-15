const save = async (expense) => {
    console.log("adding expense + ", JSON.stringify(expense));

    const db = getDb();
    const collection = await db.collection("expenses");
    await collection.insertOne(expense);
}

const generateExpense = async (message) => {
    const expenseCompletion = await getCompletionForExpense(message);
    const expense = new Expense({ ...expenseCompletion, createdAt: Date.now() });
    return expense;
}

module.exports = {
    save,
    generateExpense
}