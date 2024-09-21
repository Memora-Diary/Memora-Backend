const { ethers } = require("ethers");
const axios = require("axios");
require("dotenv").config();

const { callOpenAI } = require("./ai");
const { fetchFIDs, fetchMemoraNFTData, triggerNFT } = require("./chain");
const { upsertUser, getUserById } = require("./db");

const warpcast_url = "https://api.warpcast.com/v2/ext-send-direct-cast";

const listenToPosts = async (handle) => {
  // Fetch all NFT minters
  allMinters = await fetchMemoraNFTData();
  //   dumb: allMinters = [[0, "0xad1aa5d1eea542277cfb451a94843c41d2c25ed8"]];

  // Get the FID from the addresses
  allFIDs = await fetchFIDs(allMinters);

  // TODO retrieve users / latest post timestamps from DB

  // Call Farcaster's public hubble to get user's posts
  allPosts = [];
  for (i in allFIDs) {
    fid = allFIDs[i];
    console.log("updating posts for user", fid);
    let fidData =
      fid != 0 ? await fetchCastsByFid(fid) : { posts: [""], timestamp: 0 };
    storedUser = await getUserById(fid);
    console.log("ts", fidData.timestamp);
    console.log("stored", storedUser);

    // Only call the AI if there are new posts
    if (storedUser && storedUser.latestPost < fidData.timestamp) {
      posts = fidData.posts.join(";");
      tokenId = allMinters[i][0];
      prompt = await fetchNFTPrompt(tokenId);
      res = await callOpenAI(allPosts[i]);
      console.log(res.toLowerCase());
      if (res == "yes") {
        triggerId = upsertTrigger(tokenId, fid);
        triggerNFT(tokenId);
        sendDM(allFIDs[i], triggerId);
      }

      upsertUser(fid, fidData.timestamp);
    }
    // timestamp =

    // console.log(posts.slice(-100));
  }

  // Call AI to analyze posts
  // TODO only if new posts
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

async function sendDM(fid, triggerId) {
  const data = {
    recipientFid: fid,
    message: "Looks like you just got married! Congratulations!",
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
listenToPosts({});
