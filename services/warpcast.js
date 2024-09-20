const { idRegistryABI, idRegistryAddress } = require("./abis/idRegistry");
const { memoraNFTABI, memoraNFTAddress } = require("./abis/memoraNFT");
const { ethers } = require("ethers");
const axios = require("axios");

const listenToPosts = async (handle) => {
  // Get the address from the handle
  const addresses = ["0x429ccbb1e49aa16a64617b4d9c911d7b00a449f2"];

  // Farcaster Contract
  const optimismProvider = new ethers.JsonRpcProvider(
    "https://mainnet.optimism.io"
  );
  const registry = new ethers.Contract(
    idRegistryAddress,
    idRegistryABI,
    optimismProvider
  );

  // Get the FIDs (from addresses)
  FIDs = [];
  for (i in addresses) {
    address = addresses[i];
    try {
      // Call the view function
      const fid = await registry.idOf(address);
      console.log(fid);
      console.log("FID for address %s: %s", address, fid);
    } catch (error) {
      console.error(
        "Error calling contract for address %s: %s",
        address,
        error
      );
      throw error;
    }
  }

  // Call API to get user's posts

  // Call AI to analyze posts
};

async function fetchMemoraNFTData() {
  try {
    const sepoliaProvider = new ethers.JsonRpcProvider(
      "https://rpc.sepolia.org"
    );
    const memoraNFT = new ethers.Contract(
      memoraNFTAddress,
      memoraNFTABI,
      sepoliaProvider
    );

    const allMinters = await memoraNFT.getAllMinters();
    return allMinters;
  } catch (error) {
    throw error;
  }
}

async function fetchCastsByFid(fid) {
  try {
    const response = await axios.get(
      `https://hoyt.farcaster.xyz:2281/v1/castsByFid?fid=${fid}`
    );
    messages = response.data.messages;
    const isSorted = messages.every(
      (message, index, array) =>
        index === 0 || message.data.timestamp >= array[index - 1].data.timestamp
    );

    if (!isSorted) {
      console.log("Messages were not sorted. Sorting now...");
      messages = messages.sort((a, b) => a.data.timestamp - b.data.timestamp);
    }
    return messages.map((message) => message.data.castAddBody.text);
  } catch (error) {
    throw error;
  }
}

// TODO with DB:
// store users: FID, Latest post date, Latest AI decision

const callAI = async (handle, post) => {};

// listenToPosts()
//   .then((result) => {
//     console.log(result); // Output: Data fetched successfully
//   })
//   .catch((err) => {
//     console.error(err); // Handle any errors
//   });


module.exports = { listenToPosts };
