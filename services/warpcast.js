const { ethers } = require("ethers");
const axios = require("axios");

const { callOpenAI } = require("./ai");
const { fetchFIDs, fetchMemoraNFTData, triggerNFT } = require("./chain");

const warpcast_url = "https://api.warpcast.com/v2/ext-send-direct-cast";

const listenToPosts = async (handle) => {
  // Fetch all NFT minters
  allMinters = await fetchMemoraNFTData();
  //   dumb: allMinters = [[0, "0xad1aa5d1eea542277cfb451a94843c41d2c25ed8"]];

  // Get the FID from the addresses
  allFIDs = await fetchFIDs(allMinters);

  // Call Farcaster's public hubble to get user's posts
  allPosts = [];
  for (i in allFIDs) {
    fid = allFIDs[i];
    console.log(fid);
    posts = fid != 0 ? await fetchCastsByFid(fid) : [""];
    allPosts[i] = posts.join(";");
    console.log(posts.slice(-100));
  }

  // Call AI to analyze posts
  // TODO only if new posts
  console.log(allPosts);
  for (i in allPosts) {
    if (allPosts[i] != "") {
      res = await callOpenAI(allPosts[i]);
      console.log(res.toLowerCase());
      if (res == "yes") {
        triggerNFT(allMinters[i][0]);
        sendDM(allFIDs[i]);
      }
    }
  }
};

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

async function sendDM(fid) {
  const data = {
    recipientFid: fid,
    message: "Looks like you just got married! Congratulations!",
    idempotencyKey: "ed3d9b95-5eed-475f-9c7d-58bdc3b9ac00",
  };

  let config = {
    method: "put",
    maxBodyLength: Infinity,
    url: "https://api.warpcast.com/v2/ext-send-direct-cast",
    headers: {
      "User-Agent": "-u",
      Authorization:
        "Bearer wc_secret_391c2f8be3f9bde32a1e36adee63afe84ac3bcf101aeabc9e125cadc_999c9bf2",
    },
    data: data,
  };
  axios
    .request(config)
    .then((response) => {
      console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
    });
}

// TODO with DB:
// store users: FID, Latest post date, Latest AI decision

// fetchCastsByFid(3)
//   .then((result) => {
//     console.log(result.slice(-100)); // Output: Data fetched successfully
//   })
//   .catch((err) => {
//     console.error(err); // Handle any errors
//   });

// listenToPosts()
//   .then((result) => {
//     console.log(result); // Output: Data fetched successfully
//   })
//   .catch((err) => {
//     console.error(err); // Handle any errors
//   });

// sendDM(855266);
