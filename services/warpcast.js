const { idRegistryABI, idRegistryAddress } = require("./abis/idRegistry");
const { ethers } = require("ethers");

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

  // Get the FIDs
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

  // Convert address to FID using ID Registry

  // Call API to get user's posts

  // Call AI to analyze posts
};

// TODO with DB:
// store users: FID, Latest post date, Latest AI decision

const callAI = async (handle, post) => {};

listenToPosts()
  .then((result) => {
    console.log(result); // Output: Data fetched successfully
  })
  .catch((err) => {
    console.error(err); // Handle any errors
  });
