const express = require("express");
const app = express();
const port = 3003;
const { listenToPosts } = require("./services/warpcast");

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

app.get('/health', (req, res) => {
  console.log('Health check');
  res.send('OK');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.use(express.json());
