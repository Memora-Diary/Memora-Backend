const express = require("express");
const app = express();
const port = 3003;
const updatePosts = require("./services/warpcast");
const cron = require("node-cron");
const cors = require("cors");
const { fetchNFTPrompt } = require("./services/chain");
const { giveNegativeFeedback } = require("./services/ai");
const { createTables, mapAddressToName, getAddressForName, getContactsForUser } = require("./services/db");
const verifyToken = require("./middleware/authMiddleware");

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Public routes
app.get("/", async (req, res) => {
  res.send("Hello World!");
});

app.get("/getAddressForName/:ownerAddress/:name", verifyToken, async (req, res) => {
  try {
    const { ownerAddress, name } = req.params;
    const address = await getAddressForName(ownerAddress, name);
    if (address) {
      res.json({ ownerAddress, name, address });
    } else {
      res.status(404).json({ message: "Name not found for this owner" });
    }
  } catch (error) {
    console.error("Error in getAddressForName:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/mapNameToAddress", verifyToken, async (req, res) => {
  try {
    const { ownerAddress, name, address } = req.body;
    if (!ownerAddress || !name || !address) {
      return res.status(400).json({ message: "Owner address, name, and address are required" });
    }
    await mapAddressToName(ownerAddress, address, name);
    res.json({ message: "Name mapped to address successfully" });
  } catch (error) {
    console.error("Error in mapNameToAddress:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Protected routes
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Create tables before starting the server
createTables().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });

  // Start the cron job after creating tables
  cron.schedule("*/2 * * * *", async () => {
    console.log("Starting a new update round");

    try {
      await updatePosts({});
      console.log("Finished round, sleeping...");
    } catch (error) {
      console.error("An error occurred during the update:", error);
    }
  });
}).catch(error => {
  console.error("Failed to create tables:", error);
  process.exit(1);
});

app.get("/getContacts/:ownerAddress", verifyToken, async (req, res) => {
  try {
    const { ownerAddress } = req.params;
    const contacts = await getContactsForUser(ownerAddress);
    res.json(contacts);
  } catch (error) {
    console.error("Error in getContacts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
