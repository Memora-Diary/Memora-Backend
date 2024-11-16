const { ethers } = require("ethers");
const { idRegistryABI, idRegistryAddress } = require("./abis/idRegistry");
const { memoraNFTABI, memoraNFTAddress } = require("./abis/memoraNFT");
const { memoraBTCABI, memoraBTCAddress } = require("./abis/memoraBTC");
const pushProtocolService = require('./pushProtocol');
const { client } = require('./ai');

require("dotenv").config();

const rootStockProvider = new ethers.JsonRpcProvider(
  "https://mycrypto.testnet.rsk.co"
);
const optimismProvider = new ethers.JsonRpcProvider(
  "https://mainnet.optimism.io"
);
const sepoliaProvider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
const polygonAmoyProvider = new ethers.JsonRpcProvider("https://rpc-amoy.polygon.technology/");
const memoraProvider = polygonAmoyProvider;

async function fetchFIDs(allMinters) {
  try {
    const registry = new ethers.Contract(
      idRegistryAddress,
      idRegistryABI,
      optimismProvider
    );

    FIDs = [];
    for (i in allMinters) {
      minter = allMinters[i][1];
      //   console.log(allMinters[i][1]);
      try {
        const fid = await registry.idOf(minter);
        FIDs.push(fid);
      } catch (error) {
        console.error(
          "Error calling contract for address %s: %s",
          minter,
          error
        );
        throw error;
      }
      2;
    }
    return FIDs;
  } catch (error) {
    throw error;
  }
}

async function fetchMemoraNFTData() {
  try {
    const memoraNFT = new ethers.Contract(
      memoraNFTAddress,
      memoraNFTABI,
      memoraProvider
    );

    const allMinters = await memoraNFT.getUnclaimedNFTs();
    console.log({allMinters})
    return allMinters;
  } catch (error) {
    throw error;
  }
}

async function fetchMemoraBTCData() {
  try {
    const memoraNFT = new ethers.Contract(
      memoraBTCAddress,
      memoraBTCABI,
      memoraProvider
    );

    const allMinters = await memoraNFT.getUnclaimedEscrows();
    return allMinters;
  } catch (error) {
    throw error;
  }
}

async function triggerNFT(nftId) {
  try {
    const memoraNFT = new ethers.Contract(
      memoraNFTAddress.toLowerCase(),
      memoraNFTABI,
      memoraProvider
    );
    const signer = new ethers.Wallet(
      process.env.JUDGE_PRIVATE_KEY,
      memoraProvider
    );

    const memoryJudgeSigner = memoraNFT.connect(signer);

    // Fetch NFT info first in case it fails
    const { heir, prompt, minter } = await fetchNFTPrompt(nftId);

    try {
      const tx = await memoryJudgeSigner.declareTrigger(nftId);
      await tx.wait(); // Wait for transaction confirmation
    } catch (txError) {
      console.error("Transaction error:", txError);
      // Send transaction error notification to both heir and minter
      await pushProtocolService.sendTransactionErrorNotification(heir, txError.hash || 'unknown', nftId);
      await pushProtocolService.sendTransactionErrorNotification(minter, txError.hash || 'unknown', nftId);
      throw txError;
    }
    
    // Generate AI personalized celebration message
    try {
      const response = await client.chat.completions.create({
        model: "llama",
        messages: [
          {
            role: "system",
            content: `You are an empathetic and joyful AI celebration creator. Your task is to create a heartwarming, personalized celebration message for someone who just achieved their goal.
              The message should:
              - Start with celebratory emojis
              - Acknowledge their specific achievement with genuine enthusiasm
              - Reference their journey and dedication
              - Include warm words of encouragement
              - End with uplifting emojis
              - Be concise but deeply meaningful (2-3 sentences)
              - Make them feel proud, accomplished, and appreciated
              - Use a mix of professional and friendly tone
              The message should feel personal and authentic, not generic.`
          },
          {
            role: "user",
            content: `Create an uplifting celebration message for someone who just achieved this goal: "${prompt}".
              This was their NFT #${nftId}.
              Make it warm, personal, and memorable.`
          }
        ],
        temperature: 0.9,
        max_tokens: 5000,
      });
      const celebrationMessage = response.choices[0].message.content;
      
      // Send success notifications
      await pushProtocolService.sendNFTTriggerNotification(heir, nftId, prompt);
      await pushProtocolService.sendNFTTriggerNotification(minter, nftId, prompt);
    } catch (aiError) {
      console.error("AI Error:", aiError);
      // Send system error notification if AI fails
      await pushProtocolService.sendSystemErrorNotification(heir, 'AI service', nftId);
      await pushProtocolService.sendSystemErrorNotification(minter, 'AI service', nftId);
      
      // Use fallback message
      const fallbackMessage = `🌟 Incredible achievement! Your NFT #${nftId} condition "${prompt}" has been fulfilled. Your dedication has paid off, and we're thrilled to celebrate this moment with you! ✨`;
      await pushProtocolService.sendNFTTriggerNotification(heir, nftId, prompt);
      await pushProtocolService.sendNFTTriggerNotification(minter, nftId, prompt);
    }
  } catch (error) {
    console.error("General error:", error);
    // Send general error notification
    const { heir, minter } = await fetchNFTPrompt(nftId).catch(() => ({ heir: null, minter: null }));
    
    if (heir) {
      await pushProtocolService.sendErrorNotification(heir, error, nftId);
    }
    if (minter) {
      await pushProtocolService.sendErrorNotification(minter, error, nftId);
    }
  }
}

async function triggerMemoraBTC(nftId) {
  try {
    const memoraNFT = new ethers.Contract(
      memoraBTCAddress,
      memoraBTCABI,
      memoraProvider
    );
    const signer = new ethers.Wallet(
      process.env.JUDGE_PRIVATE_KEY,
      memoraProvider
    );

    const memoryJudgeSigner = memoraNFT.connect(signer);

    await memoryJudgeSigner.declareTrigger(nftId);
    
    // Fetch escrow info to get recipient and prompt
    const { heir, prompt } = await fetchMemoraBTCPrompt(nftId);
    // Send Push notification
    await pushProtocolService.sendBTCTriggerNotification(heir, nftId, prompt);
  } catch (error) {
    console.log(error);
  }
}


async function fetchNFTPrompt(nftId) {
  try {
    const memoraNFT = new ethers.Contract(
      memoraNFTAddress,
      memoraNFTABI,
      memoraProvider
    );

    const tokenInfo = await memoraNFT.tokenInfo(nftId);
    console.log("prompt: ", tokenInfo[5]);
    return {
      prompt: tokenInfo[5],
      heir: tokenInfo[1],
      minter: tokenInfo[4]
    };
  } catch (error) {
    throw error;
  }
}

async function fetchMemoraBTCPrompt(nftId) {
  try {
    const memoraNFT = new ethers.Contract(
      memoraBTCAddress,
      memoraBTCABI,
      memoraProvider
    );

    const tokenInfo = await memoraNFT.escrowInfo(nftId);
    return {
      prompt: tokenInfo[6],
      heir: tokenInfo[1],
    };
  } catch (error) {
    throw error;
  }
}

module.exports = { fetchFIDs, fetchMemoraNFTData, triggerNFT, fetchNFTPrompt , fetchMemoraBTCData, triggerMemoraBTC, fetchMemoraBTCPrompt};
