const express = require("express");
const app = express();
const port = 3003;
const updatePosts = require("./services/warpcast");
const cron = require("node-cron");
const cors = require("cors");
const { fetchNFTPrompt } = require("./services/chain");
const { giveNegativeFeedback } = require("./services/ai");

app.use(cors());

app.get("/", async (req, res) => {
  res.send("Hello World!");
});

app.post("/finetune-neg", async (req, res) => {
  try {
    const { handle } = req.body;

    nftId = Number(handle.tokenId);
    fid = Number(handle.fid);

    let fidData =
      fid != 0 ? await fetchCastsByFid(fid) : { posts: [""], timestamp: 0 };

    console.log("new posts for user ", fid);
    posts = JSON.stringify(fidData["posts"]);

    nftInfo = await fetchNFTPrompt(nftId);
    prompt = nftInfo.prompt;
    await giveNegativeFeedback(prompt, posts);
    res.json({ message: `Fine-tuned the negative feedback for @${handle}` });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error while finetuning", error: error.message });
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

// 15 sec loop
cron.schedule("*/60 * * * * *", async () => {
  console.log("Starting a new update round");

  try {
    // Wait for updatePosts to complete before continuing
    await updatePosts({});
    console.log("Finished round, sleeping...");
  } catch (error) {
    console.error("An error occurred during the update:", error);
  }
});
