const { idRegistryABI, idRegistryAddress } = require("./abis/idRegistry");
const { memoraNFTABI, memoraNFTAddress } = require("./abis/memoraNFT");
const { ethers } = require("ethers");
const axios = require("axios");

const listenToPosts = async (handle) => {
  // Fetch all NFT minters
  allMinters = await fetchMemoraNFTData();
  //   dumb: allMinters = [[0, "0xad1aa5d1eea542277cfb451a94843c41d2c25ed8"]];

  // Get the FID from the addresses
  allFIDs = await fetchFIDs(allMinters);

  // Call Farcaster's public hubble to get user's posts
  for (i in allFIDs) {
    fid = allFIDs[i];
    console.log(fid);
    posts = await fetchCastsByFid(fid);
    allMinters[i].push(posts);
    console.log(posts.slice(-100));
  }

  // Call AI to analyze posts
};

async function fetchFIDs(allMinters) {
  try {
    const optimismProvider = new ethers.JsonRpcProvider(
      "https://mainnet.optimism.io"
    );
    const registry = new ethers.Contract(
      idRegistryAddress,
      idRegistryABI,
      optimismProvider
    );

    FIDs = [];
    for (i in allMinters) {
      minter = allMinters[i][1];
      console.log(allMinters[i][1]);
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
    return messages.map((message) =>
      message.data.castAddBody ? message.data.castAddBody.text : ""
    );
  } catch (error) {
    throw error;
  }
}

// TODO with DB:
// store users: FID, Latest post date, Latest AI decision

const callAI = async (handle, post) => {};

// fetchCastsByFid(3)
//   .then((result) => {
//     console.log(result.slice(-100)); // Output: Data fetched successfully
//   })
//   .catch((err) => {
//     console.error(err); // Handle any errors
//   });

listenToPosts()
  .then((result) => {
    console.log(result); // Output: Data fetched successfully
  })
  .catch((err) => {
    console.error(err); // Handle any errors
  });
