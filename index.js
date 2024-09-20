const express = require("express");
const app = express();
const port = 3000;
const listenToPosts = require("./services/warpcast");
const OpenAI = require('openai');

const client = new OpenAI({
  baseURL: 'https://llama.us.gaianet.network/v1',
  apiKey: '' // Leave this empty when using Gaia
});

async function callOpenAI() {
  try {
    const response = await client.chat.completions.create({
      model: "llama",
      messages: [
        { role: "system", content: "You are a strategic reasoner." },
        { role: "user", content: "What is the purpose of life?" }
      ],
      temperature: 0.7,
      max_tokens: 500
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
