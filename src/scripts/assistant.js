async function createAssistant() {
    const myAssistant = await openai.beta.assistants.create({
      instructions:
        "You are a personal expense tracker. When given a message about expense. return a json object with fields {category, amount, description, date(null if not given)}. category can be Food, Transport, Rent, Entertainment, Utilities, Groceries, Shopping, Healthcare, Personal Care, Misc, Savings, Insurance and Lent",
      name: "Expense Tracker",
      tools: [],
      model: "gpt-4",
    });
  
    console.log(myAssistant);
  }
  
  // createAssistant();
  