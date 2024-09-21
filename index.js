const express = require("express");
const app = express();
const port = 3000;
const listenToPosts = require("./services/warpcast");
const cron = require("node-cron");

const { fetchNFTPrompt } = require("./services/chain");
const { giveNegativeFeedback } = require("./services/ai");

app.get("/", async (req, res) => {
  res.send("Hello World!");
});

app.post("/finetune-neg", async (req, res) => {
  const { handle } = req.body;
  try {
    nftId = handle.tokenId;
    fid = handle.fid;

    let fidData =
      fid != 0 ? await fetchCastsByFid(fid) : { posts: [""], timestamp: 0 };

    console.log("new posts for user ", fid);
    posts = fidData.posts.join(";");

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
cron.schedule("*/15 * * * * *", () => {
  console.log("Starting a new update round");
  updatePosts({});
  console.log("Finished round, sleeping...");
});
