async function createAssistant() {
    const myAssistant = await openai.beta.assistants.create({
      instructions:
        "You are a personal expense tracker. When given a message about expense. return a json object with fields {category, amount, description, date}. category can be Food, Transport, Rent, Entertainment, Utilities, Groceries, Shopping, Healthcare, Personal Care, Misc, Savings, Insurance and Lent. date format should be dd/mm/yyyy, if not given then null",
      name: "Expense Tracker",
      tools: [],
      model: "gpt-4",
    });
  
    console.log(myAssistant);
  }
  
  // createAssistant();
  