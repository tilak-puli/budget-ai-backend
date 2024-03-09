const {Firestore, Timestamp} = require('@google-cloud/firestore');

const firestore = new Firestore();

firestore.settings({ ignoreUndefinedProperties: true });

const save = async (expense) => {
    const expenseDoc = {...expense};
    const expensesRef = firestore.collection('expenses');
  
    const expenseDocRef = await expensesRef.add(expenseDoc);

    return expenseDocRef.id;
}

const getExpenses = async (userId, fromDate, toDate) => {
    const expensesRef = firestore.collection('expenses');

    const query = expensesRef
      .where('userId', '==', userId)
      .where('date', '>=', fromDate)
      .where('date', '<=', toDate)
      .orderBy('date', 'desc')
      .orderBy('createdAt', 'asc');  
  
    const snapshot = await query.get();
    
    return snapshot.docs.map(parseExpense);
}

const parseExpense = doc => {
  const data = doc.data(); 

  for (const field in data) {
    if (data[field] instanceof Timestamp) {
      data[field] = data[field].toDate(); // Convert timestamp to date
    }
  }

  return {
    _id: doc.id,
    ...data
  };
}

const createExpense = async (userId, category, description, amount, date, createdAt) => {
    const expensesRef = firestore.collection('expenses');
  
    const newExpense = {
      userId,
      category,
      description,
      amount,
      date,
      createdAt,
    };
  
    const expenseDocRef = await expensesRef.add(newExpense);
  
    return expenseDocRef.id;
}

const updateExpense = async (userId, id, category, description, amount, date, updatedAt) => {
    const expenseRef = firestore.collection('expenses').doc(id);

    const docSnap = await expenseRef.get();
    if (!docSnap.exists) {
      console.warn(`Expense document with ID ${id} not found.`);
      return null;
    }
  
    const updateData = {
      category,
      description,
      amount,
      date,
      updatedAt,
    };
  
    await expenseRef.update(updateData);
  
    // Optional: Fetch and return the updated expense (consider caching)
    const updatedExpenseDoc = await expenseRef.get();
    return updatedExpenseDoc.exists ? parseExpense(updatedExpenseDoc) : null;
}

const deleteExpense = async (userId, id) => {
  const expenseRef = firestore.collection('expenses').doc(id);

  await expenseRef.delete();

  return 1; 
}

module.exports = {
    save,
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense
}