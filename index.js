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
const TelegramDiaryBot = require('./services/telegramBot');
const { initializeDatabase } = require('./services/initDb');


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

let telegramBot = null;
let server = null;

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Initialize Telegram bot only once
    if (!telegramBot) {
      telegramBot = new TelegramDiaryBot();
      console.log('Telegram bot initialized successfully');

      // Schedule daily questions
      cron.schedule('* * * * *', async () => {
        console.log('Sending daily diary questions');
        try {
          await telegramBot.sendDailyQuestions();
        } catch (error) {
          console.error('Error sending daily questions:', error);
        }
      });
    }

    // Start the server only if it's not already running
    if (!server) {
      server = app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
      });

      // Handle server errors
      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.log(`Port ${port} is busy, retrying in 5 seconds...`);
          setTimeout(() => {
            server.close();
            server.listen(port);
          }, 5000);
        } else {
          console.error('Server error:', error);
        }
      });
    }
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down gracefully...');
  if (telegramBot) {
    await telegramBot.stop();
  }
  if (server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the server
startServer().catch(error => {
  console.error("Failed to start application:", error);
  process.exit(1);
});

// Remove any duplicate server initialization code

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


// Telegram bot routes
app.get("/telegram/status", async (req, res) => {
  try {
    if (!telegramBot) {
      return res.status(503).json({ status: 'bot not initialized' });
    }
    const status = await telegramBot.getStatus();
    const subscriberCount = await telegramBot.getSubscriberCount();
    res.json({ ...status, subscriberCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/telegram/update-questions", verifyToken, async (req, res) => {
  try {
    const { questions } = req.body;
    if (!telegramBot) {
      return res.status(503).json({ error: 'Bot not initialized' });
    }
    telegramBot.updateDailyQuestions(questions);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Get all active minters
app.get("/telegram/minters", verifyToken, async (req, res) => {
    try {
        const minters = await telegramBot.getActiveMinters();
        res.json({ minters });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Manually add a minter
app.post("/telegram/minters", verifyToken, async (req, res) => {
    try {
        const { minterAddress, nftId } = req.body;
        const user = await telegramBot.addMinterToQuestions(minterAddress, nftId);
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove a minter
app.delete("/telegram/minters/:address", verifyToken, async (req, res) => {
    try {
        const { address } = req.params;
        await telegramBot.removeMinterFromQuestions(address);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add this endpoint to your Express app
app.post("/telegram/link-minter", verifyToken, async (req, res) => {
    try {
        const { minterAddress, telegramChatId } = req.body;
        if (!minterAddress || !telegramChatId) {
            return res.status(400).json({ 
                error: 'Minter address and Telegram chat ID are required' 
            });
        }

        const user = await telegramBot.linkMinterToTelegram(
            minterAddress, 
            telegramChatId
        );
        
        res.json({ 
            success: true, 
            user 
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
});