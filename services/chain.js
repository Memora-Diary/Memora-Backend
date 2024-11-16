const { ethers } = require("ethers");
const { idRegistryABI, idRegistryAddress } = require("./abis/idRegistry");
const { memoraNFTABI, memoraNFTAddress } = require("./abis/memoraNFT");
const { memoraBTCABI, memoraBTCAddress } = require("./abis/memoraBTC");

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

    await memoryJudgeSigner.declareTrigger(nftId);
  } catch (error) {
    console.log(error);
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
