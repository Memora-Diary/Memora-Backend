const express = require("express");
const app = express();
const port = 3003;
const updatePosts = require("./services/warpcast");
const cron = require("node-cron");
const cors = require("cors");
const { fetchNFTPrompt } = require("./services/chain");
const { 
  giveNegativeFeedback, 
  analyzeDiaryEntries,  // Import the existing AI functions
  generateDiaryQuestions,
  client: aiClient,
  analyzeMessageIntentions
} = require("./services/ai");
const { createTables, mapAddressToName, getAddressForName, getContactsForUser } = require("./services/db");
const verifyToken = require("./middleware/authMiddleware");
const TelegramDiaryBot = require('./services/telegramBot');
const { initializeDatabase } = require('./services/initDb');
const fs = require('fs').promises;
const path = require('path');


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
  console.error('❌ Server Error:', err);
  console.error('Stack trace:', err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

let telegramBot = null;
let server = null;

// Create logs directory at startup
const initializeLogs = async () => {
  const logsDir = path.join(__dirname, 'logs');
  try {
    await fs.mkdir(logsDir, { recursive: true });
    console.log('Logs directory initialized');
  } catch (error) {
    console.error('Error creating logs directory:', error);
  }
};

// Initialize database and start server
async function startServer() {
  try {
    // Initialize logs directory
    await initializeLogs();
    
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

// Simple webhook endpoint
app.post('/webhook/push', express.json(), (req, res) => {
  try {
    // Log the incoming data
    console.log('Webhook Received:');
    console.log('==================');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Payload:', JSON.stringify(req.body, null, 2));
    console.log('==================\n');

    // Send success response
    res.status(200).json({
      status: 'success',
      message: 'Webhook received and logged',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Webhook Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Test endpoint
app.get('/webhook/push/test', (req, res) => {
  res.status(200).json({
    status: 'active',
    message: 'Webhook endpoint is running',
    timestamp: new Date().toISOString()
  });
});

// AI Analysis Webhook Route
app.post('/webhook/analysis', async (req, res) => {
    console.log('\n🔔 Analysis Webhook received:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 Payload:', JSON.stringify(req.body, null, 2));

    try {
        // Check if we have valid transcript segments
        if (!req.body.transcript_segments || !Array.isArray(req.body.transcript_segments)) {
            console.log('Invalid or missing transcript segments');
            return res.status(400).json({
                error: 'Invalid or missing transcript segments',
                expected_format: {
                    transcript_segments: [{ text: "your message here" }]
                }
            });
        }

        // Extract messages from the nested structure
        const messages = req.body.transcript_segments
            .flatMap(segment => 
                // Check if segment has nested transcript_segments
                segment.transcript_segments 
                    ? segment.transcript_segments
                        .filter(s => s && s.text && s.text.trim()) // Filter out empty texts
                        .map(s => s.text.trim())
                    : segment.text 
                        ? [segment.text.trim()]
                        : []
            )
            .filter(text => text); // Filter out any remaining empty strings

        console.log('Extracted messages:', messages);

        if (messages.length === 0) {
            console.log('No valid messages found in transcript segments');
            return res.status(400).json({
                error: 'No valid messages found in transcript segments',
                received_payload: req.body
            });
        }
            
        // Pass the messages array to the analysis function
        const analysis = await analyzeMessageIntentions(messages);
        
        console.log('\n🤖 AI Analysis Results:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(JSON.stringify(analysis, null, 2));

        res.status(200).json({
            message: 'Analysis completed successfully',
            analysis,
            processed_messages: messages
        });
    } catch (error) {
        console.error('Analysis Error:', error);
        res.status(500).json({
            error: 'Error processing analysis request',
            details: error.message,
            received_payload: req.body
        });
    }
});

// Test endpoint for AI analysis
app.get('/webhook/analysis/test', (req, res) => {
    res.status(200).json({
        status: 'active',
        message: 'AI analysis endpoint is running',
        timestamp: new Date().toISOString(),
        ai_client: !!aiClient
    });
});