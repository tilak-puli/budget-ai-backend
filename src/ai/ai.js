const OpenAI = require("openai");
const API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: API_KEY });

const ASSISTANT_ID = "asst_T8A338jyIlGF1BQ5QtX2jMHh";
const SYSTEM_MESSAGE =
  "As a expense tracker. In json, respond with expense {category, amount, description, date}. today date is: ";


async function createAssistant() {
  const myAssistant = await openai.beta.assistants.create({
    instructions:
      "You are a personal expense tracker. When given a message about expense. return a json object with fields {category, amount, description, date}.",
    name: "Expense Tracker",
    tools: [],
    model: "gpt-4",
  });

  console.log(myAssistant);
}

// createAssistant();

const pollForResponse = async (run, res, rej, time = 1) => {
  const runStatus = await openai.beta.threads.runs.retrieve(
    run.thread_id,
    run.id
  );

  console.log(runStatus);

  if (runStatus.status != 'completed') {
    if(time === 3) {
      res("Failed to get response from chatgpt");
      return console.log("timed out")
    } else {
      setTimeout(() => pollForResponse(run, res, rej, time + 1), 500)
    }
  }

  try {
    const threadMessages = await openai.beta.threads.messages.list(
      run.thread_id
    );

    console.log(JSON.stringify(threadMessages.data))
    console.log(threadMessages.data[0].content[0].text.value)
    res(threadMessages.data[0].content[0].text.value)
  } catch (e) {
    rej("error in retreiving message");
    return console.log("error in retreiving message: " + e)
  }
}

async function runAI(message) {
  const runResponse = await openai.beta.threads.createAndRun({
    assistant_id: ASSISTANT_ID,
    thread: {
      messages: [
        { role: "user", content: message },
      ],
    },
  });

  return new Promise((res, rej) => setTimeout(() => pollForResponse(runResponse, res, rej), 2000))
}

const getCompletionForExpense = async (userMessage) => {
  const completion = await getCompletion(
    SYSTEM_MESSAGE + new Date().toLocaleDateString(),
    userMessage
  );

  return JSON.parse(completion.choices[0]?.message?.content);
};

const getCompletion = async (systemMessage, userMessage) => {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: systemMessage,
      },
      { role: "user", content: userMessage },
    ],
  });

  return response;
};

module.exports = {
  getCompletionForExpense: runAI,
};
