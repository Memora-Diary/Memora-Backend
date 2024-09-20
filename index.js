const express = require("express");
const app = express();
const port = 3000;
const listenToPosts = require("./services/warpcast");
const OpenAI = require('openai');

const client = new OpenAI({
  baseURL: 'https://llama.us.gaianet.network/v1',
  apiKey: '' // Leave this empty when using Gaia
});

async function callOpenAI(messagesArray) {
  try {
    const response = await client.chat.completions.create({
      model: "llama",
      messages: [
        { role: "system", content: "You are a judge who is gonna decide if this messages are of a currently married user or not based on the messages which are passed by the user. It should either be a `yes` or `no`. Nothing else should be spoken. Also say in a scale of 1 to 10 how confident are you that they are currently married" },
        { role: "user", content: messagesArray.toString()}
      ],
      temperature: 0.7,
      max_tokens: 5000
    });
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error('Error:', error);
  }
}

app.get("/", async (req, res) => {
  await listenToPosts({});
  res.send("Hello World!");
});

app.post("/listen", async (req, res) => {
  const { handle } = req.body;
  try {
    await listenToPosts(handle);
    res.json({ message: `Listening to posts from @${handle}` });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error listening to tweets", error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.use(express.json());
