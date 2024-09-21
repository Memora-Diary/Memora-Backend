const express = require("express");
const app = express();
const port = 3000;
const listenToPosts = require("./services/warpcast");
const cron = require("node-cron");

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

app.post("/world_coin/verify", async (req, res) => {
  const { handle } = req.body;
  console.log(handle);
  res.json({ verified: true });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.use(express.static("public"));

app.use(express.json());

// Schedule a task to run every 2 minutes
cron.schedule("*/2 * * * *", () => {
  console.log("Starting a new update round");
  updatePosts({});
});
