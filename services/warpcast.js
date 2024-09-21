const { ethers } = require("ethers");
const axios = require("axios");
require("dotenv").config();

const { callOpenAI } = require("./ai");
const { fetchFIDs, fetchMemoraNFTData, triggerNFT } = require("./chain");
const { upsertUser, getUserById } = require("./db");
const { fetchNFTPrompt } = require("./services/chain");

const warpcast_url = "https://api.warpcast.com/v2/ext-send-direct-cast";

const updatePosts = async (handle) => {
  // Fetch all NFT minters
  allMinters = await fetchMemoraNFTData();
  //   dumb: allMinters = [[0, "0xad1aa5d1eea542277cfb451a94843c41d2c25ed8"]];

  // Get the FID from the farcaster registry
  //   allFIDs = await fetchFIDs(allMinters); (no longer needed, we store it)

  // Call Farcaster's public hubble to get user's posts
  allPosts = [];
  for (i in allMinters) {
    fid = allMinters[i][2];
    let fidData =
      fid != 0 ? await fetchCastsByFid(fid) : { posts: [""], timestamp: 0 };
    storedUser = await getUserById(fid);

    // Only call the AI if there are new posts
    if (storedUser == null || storedUser.latestPost < fidData.timestamp) {
      console.log("new posts for user ", fid);
      posts = fidData.posts.join(";");
      nftId = allMinters[i][0];

      nftInfo = await fetchNFTPrompt(nftId);
      prompt = nftInfo.prompt;

      res = await callOpenAI(posts);

      console.log("decision: ", res.toLowerCase());
      if (res == "yes") {
        triggerId = upsertTrigger(nftId, fid);
        triggerNFT(nftId);
        sendDM(fid, triggerId, "minter");
        heirFid = await fetchFIDs([[0, nftInfo.heir]]);
        sendDM(heirFid, triggerId, "heir");
      }

      upsertUser(fid, fidData.timestamp);
    }
  }
};

async function fetchCastsByFid(fid) {
  try {
    const response = await axios.get(
      `https://hoyt.farcaster.xyz:2281/v1/castsByFid?fid=${fid}`
    );
    messages = response.data.messages;
    if (messages.length == 0) {
      return { posts: [""], timestamp: 0 };
    }
    const isSorted = messages.every(
      (message, index, array) =>
        index === 0 || message.data.timestamp >= array[index - 1].data.timestamp
    );
    if (!isSorted) {
      console.log("Messages were not sorted. Sorting now...");
      messages = messages.sort((a, b) => a.data.timestamp - b.data.timestamp);
    }
    timestamp = messages.slice(-1)[0].data.timestamp;
    console.log(messages);
    return {
      posts: messages.map((message) =>
        message.data.castAddBody ? message.data.castAddBody.text : ""
      ),
      timestamp: timestamp,
    };
  } catch (error) {
    throw error;
  }
}

async function sendDM(fid, triggerId, role) {
  if (role == "minter") {
    message =
      "Looks like one of your memora was triggered! Check it out here: https://memora.today/dashboard/";
    triggerId = triggerId + "m";
  } else {
    message =
      "You have inherited a memora! Check it out here: https://memora.today/dashboard/";
    triggerId = triggerId + "h";
  }
  const data = {
    recipientFid: fid,
    message: message,
    idempotencyKey: triggerId,
  };

  let config = {
    method: "put",
    maxBodyLength: Infinity,
    url: "https://api.warpcast.com/v2/ext-send-direct-cast",
    headers: {
      "User-Agent": "-u",
      Authorization: `Bearer ${process.env.WARPCAST_API_KEY}`,
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

// fetchCastsByFid(855266).then((result) => {
//   console.log(result); // Output: Data fetched successfully
// });

// let fidData = (fid != 0 ? fetchCastsByFid(855266) : [""], 0);
// fetchCastsByFid(855266).then((result) => {
//   //   allPosts[i] = result.posts.join(";");
//   console.log(result.timestamp);
//   upsertUser(855266, result.timestamp);
// });

// timestamp =
// listenToPosts({});


module.exports = updatePosts;