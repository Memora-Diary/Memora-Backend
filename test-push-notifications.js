require("dotenv").config();
const { PushAPI, CONSTANTS } = require("@pushprotocol/restapi");
const { ethers } = require("ethers");
const OpenAI = require("openai");

// Initialize OpenAI client
const client = new OpenAI({
  baseURL: "https://llama.us.gaianet.network/v1",
  apiKey: "", // Leave empty for Llama
});

// Sample NFT data for testing
const TEST_DATA = [
  {
    nftId: "1",
    prompt: "Complete a marathon",
    recipientAddress: "0x399F56CD72CA88f3873b3698A395083A44a9A641", // Replace with test wallet address
  },
  {
    nftId: "2",
    prompt: "Graduate from university",
    recipientAddress: "0x399F56CD72CA88f3873b3698A395083A44a9A641", // Replace with test wallet address
  },
  {
    nftId: "3",
    prompt: "Launch a successful startup",
    recipientAddress: "0x399F56CD72CA88f3873b3698A395083A44a9A641", // Replace with test wallet address
  }
];

class PushNotificationTester {
  constructor() {
    this.signer = new ethers.Wallet(process.env.JUDGE_PRIVATE_KEY);
    this.initialize();
  }

  async initialize() {
    try {
      this.pushClient = await PushAPI.initialize(this.signer, {
        env: CONSTANTS.ENV.STAGING
      });
      console.log("Push Protocol initialized successfully!");
    } catch (error) {
      console.error("Failed to initialize Push Protocol:", error);
    }
  }

  async generateAIMessage(prompt, nftId) {
    try {
      const response = await client.chat.completions.create({
        model: "llama",
        messages: [
          {
            role: "system",
            content: `You are an empathetic and joyful AI celebration creator. Create a heartwarming, personalized celebration message that:
              - Starts with celebratory emojis
              - Acknowledges the specific achievement with genuine enthusiasm
              - References the journey and dedication
              - Includes warm words of encouragement
              - Ends with uplifting emojis
              - Is concise but meaningful (2-3 sentences)
              Make it personal and authentic, not generic.`
          },
          {
            role: "user",
            content: `Create an uplifting celebration message for someone who achieved: "${prompt}" (NFT #${nftId})`
          }
        ],
        temperature: 0.9,
        max_tokens: 5000,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error("Error generating AI message:", error);
      return `🌟 Incredible achievement! Your journey to fulfill "${prompt}" has reached its beautiful conclusion. We're so proud of your dedication! ✨`;
    }
  }

  async sendNotification(recipientAddress, message, nftId) {
    try {
      const response = await this.pushClient.channel.send([recipientAddress], {
        notification: {
          title: "🎉 Memora Milestone Achieved! 🌟",
          body: message
        },
        payload: {
          title: "🎉 Memora Milestone Achieved! 🌟",
          body: message,
          cta: `https://memora.xyz/nft/${nftId}`,
          category: 'memora',
        },
      });

      console.log("Notification sent successfully:", response);
      return response;
    } catch (error) {
      console.error("Error sending notification:", error);
      throw error;
    }
  }

  async testNotifications() {
    console.log("Starting notification tests...");

    for (const testCase of TEST_DATA) {
      try {
        console.log(`\nTesting NFT #${testCase.nftId} with prompt: "${testCase.prompt}"`);
        
        // Generate AI message
        console.log("Generating AI message...");
        const message = await this.generateAIMessage(testCase.prompt, testCase.nftId);
        console.log("AI Generated Message:", message);

        // Send notification
        console.log("Sending notification...");
        await this.sendNotification(testCase.recipientAddress, message, testCase.nftId);
        console.log("Test case completed successfully!");

        // Wait a bit between notifications
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error in test case for NFT #${testCase.nftId}:`, error);
      }
    }

    console.log("\nAll tests completed!");
  }
}

// Create .env file with:
// JUDGE_PRIVATE_KEY=your_private_key
// PUSH_CHANNEL_ADDRESS=your_channel_address

async function runTest() {
  try {
    const tester = new PushNotificationTester();
    // Give some time for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    await tester.testNotifications();
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
runTest(); 