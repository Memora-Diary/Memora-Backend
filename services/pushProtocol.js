const { PushAPI, CONSTANTS } = require("@pushprotocol/restapi");
const { ethers } = require("ethers");
require("dotenv").config();

class PushProtocolService {
  constructor() {
    this.signer = new ethers.Wallet(process.env.JUDGE_PRIVATE_KEY);
    this.pushChannelAddress = process.env.PUSH_CHANNEL_ADDRESS;
    this.initializePushSDK();
  }

  async initializePushSDK() {
    try {
      this.userAlice = await PushAPI.initialize(this.signer, {
        env: CONSTANTS.ENV.STAGING // Change to PROD for mainnet
      });
    } catch (error) {
      console.error("Error initializing Push SDK:", error);
    }
  }

  async sendNotification({ recipient, title, body, cta }) {
    try {
      const response = await this.userAlice.channel.send([recipient], {
        notification: {
          title,
          body
        },
        payload: {
          title,
          body,
          cta, // Call to action URL
          category: 'memora',
        },
      });

      console.log("Push notification sent:", response);
      return response;
    } catch (error) {
      console.error("Error sending Push notification:", error);
      throw error;
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

  // Send notification when NFT condition is met
  async sendNFTTriggerNotification(recipientAddress, nftId, prompt) {

    
    const upbeatMessages = [
      `🌟 Amazing achievement! Your NFT #${nftId} condition "${prompt}" has been fulfilled. Your dedication and perseverance have paid off - congratulations on reaching this milestone! Keep shining! ✨`,
      
      `🎉 Wonderful news! You've successfully completed your goal for NFT #${nftId}: "${prompt}". Your journey has been inspiring, and we're thrilled to celebrate this moment with you! 🌈`,
      
      `💫 Congratulations on this incredible accomplishment! Your NFT #${nftId} condition "${prompt}" is now complete. Your commitment to your goals shows remarkable character - we're so proud of you! 🎊`,
      
      `🌺 What a beautiful moment! Your NFT #${nftId} journey of "${prompt}" has reached its fulfilling conclusion. Your persistence and dedication have created something truly special! 🎯`,
      
      `🎈 Time to celebrate YOU! Your NFT #${nftId} condition "${prompt}" is complete, marking another chapter in your success story. Your journey inspires us all! ⭐`
    ];

    // const randomMessage = upbeatMessages[Math.floor(Math.random() * upbeatMessages.length)];
    
    let message = await this.generateAIMessage(prompt, nftId);

    return this.sendNotification({
      recipient: recipientAddress,
      title: "🎉 Memora Milestone Achieved! ����",
      body: message,
      cta: `https://memora.xyz/nft/${nftId}`
    });
  }

  // Send notification for diary insights
  async sendDiaryInsightNotification(recipientAddress, insight) {
    return this.sendNotification({
      recipient: recipientAddress,
      title: "📔 New Diary Insights Available powered by Push Protocol",
      body: `We've analyzed your diary entries: ${insight.substring(0, 100)}...`,
      cta: "https://memora.xyz/diary" // Replace with your frontend URL
    });
  }

  // Send notification for BTC escrow trigger
  async sendBTCTriggerNotification(recipientAddress, escrowId, prompt) {
    return this.sendNotification({
      recipient: recipientAddress,
      title: "💰 Memora BTC Escrow Triggered",
      body: `Your BTC escrow #${escrowId} condition "${prompt}" has been fulfilled.`,
      cta: `https://memora.xyz/btc/${escrowId}` // Replace with your frontend URL
    });
  }

  // Optional: Subscribe user to channel
  async subscribeUserToChannel(userAddress) {
    try {
      const response = await this.userAlice.channel.subscribe(
        `eip155:5:${userAddress}` // Format: chain:chainId:userAddress
      );
      console.log("User subscribed to channel:", response);
      return response;
    } catch (error) {
      console.error("Error subscribing user to channel:", error);
      throw error;
    }
  }

  // Dedicated error notification function
  async sendErrorPush(recipientAddress, errorType, nftId, details = '') {
    try {
      let title, body, cta;

      switch (errorType) {
        case 'TRANSACTION_FAILED':
          title = "🔄 Transaction Failed";
          body = `⚠️ Transaction for NFT #${nftId} failed to process. Our team has been notified. Your assets are safe and secure. ${details}`;
          cta = `https://memora.xyz/transaction/${details}`; // details could be txHash
          break;

        case 'AI_SERVICE_ERROR':
          title = "🤖 AI Service Notice";
          body = `📝 We encountered a brief hiccup in our AI service for NFT #${nftId}. Don't worry - everything is still secure! We're working on it.`;
          cta = "https://memora.xyz/status";
          break;

        case 'SMART_CONTRACT_ERROR':
          title = "📋 Smart Contract Alert";
          body = `⚠️ Smart contract interaction for NFT #${nftId} needs attention. Your assets are safe. Our team is investigating. ${details}`;
          cta = "https://memora.xyz/support";
          break;

        case 'NETWORK_ERROR':
          title = "🌐 Network Notice";
          body = `🔌 Network connectivity issue detected for NFT #${nftId}. This is temporary and your assets are secure. We'll retry automatically.`;
          cta = "https://memora.xyz/status";
          break;

        case 'VALIDATION_ERROR':
          title = "⚠️ Validation Notice";
          body = `📊 Data validation issue detected for NFT #${nftId}. No action needed - our team is reviewing it. Your assets remain secure.`;
          cta = "https://memora.xyz/support";
          break;

        default:
          title = "⚠️ System Notice";
          body = `🛠️ We're looking into a minor issue with NFT #${nftId}. Everything is secure, and we'll handle this promptly! ${details}`;
          cta = "https://memora.xyz/support";
      }

      // Add timestamp to error message
      const timestamp = new Date().toLocaleString();
      body += `\n\nTimestamp: ${timestamp}`;

      return this.sendNotification({
        recipient: recipientAddress,
        title,
        body,
        cta
      });
    } catch (error) {
      console.error("Error sending error push notification:", error);
      // If even error notification fails, log to monitoring service
      this.logErrorToMonitoring(error, recipientAddress, nftId);
    }
  }

  // Helper method to log errors to your monitoring service
  async logErrorToMonitoring(error, recipientAddress, nftId) {
    // Implement your error logging logic here
    console.error("Critical: Failed to send error notification", {
      error,
      recipientAddress,
      nftId,
      timestamp: new Date().toISOString()
    });
  }

  // Send system error notification
  async sendSystemErrorNotification(recipientAddress, errorType, nftId) {
    try {
      const systemErrorMessage = `🛠️ System Notice: We're experiencing a temporary ${errorType} issue with NFT #${nftId}. Our team has been automatically notified and is working on it. Your assets are secure! 🛡️`;
      
      return this.sendNotification({
        recipient: recipientAddress,
        title: "🔧 System Maintenance Notice",
        body: systemErrorMessage,
        cta: `https://memora.xyz/status` // Link to system status page
      });
    } catch (error) {
      console.error("Error sending system error notification:", error);
    }
  }
}

// Create and export singleton instance
const pushProtocolService = new PushProtocolService();
module.exports = pushProtocolService; 