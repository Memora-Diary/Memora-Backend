const OpenAI = require("openai");

const client = new OpenAI({
  baseURL: "https://llama.us.gaianet.network/v1",
  apiKey: "", // Leave this empty when using Gaia
});

async function callOpenAI(prompt, messagesArray) {
  try {
    const response = await client.chat.completions.create({
      model: "llama",
      messages: [
        {
          role: "system",
          content:
            "You are a judge. An adult previously defined a life event and win if the event happened. You will be given the condition as stated by the person and a list of the person's social media posts. Keep in mind that messages might be related to other content. Given the posts, answer yes if the condition has been clearly met, otherwise no. Answer only yes or no.", // If you cannot determine, return no.",
          // Keep in mind that messages might be related to other content.
        },
        {
          role: "user",
          content: `Condition: ${prompt}, All posts:${messagesArray.toString()}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 5000,
    });
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error("Error:", error);
  }
}

async function giveNegativeFeedback(prompt, messagesArray) {
  try {
    const response = await client.chat.completions.create({
      model: "llama",
      messages: [
        {
          role: "system",
          content:
            "You are a judge. An adult previously defined a life event and win if the event happened. You will be given the condition as stated by the person and a list of the person's social media posts. Keep in mind that messages might be related to other content. Given the posts, answer yes if the condition has been clearly met, otherwise no. Answer only yes or no.",
        },
        {
          role: "user",
          content: `Condition: ${prompt}, All posts:${messagesArray.toString()}`,
        },
        { role: "assistant", content: "no", weight: 1 },
      ],
      temperature: 0.7,
      max_tokens: 5000,
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

// callOpenAI("When I get married", [
//   "I love you",
//   "I love you too",
//   "I love you more",
//   "I love you the most",
//   "today I linked my life to the person I love the most for the rest of our life!",
//   //   "I'm heartrbroken",
//   //   "finally got my dream job",
//   "got promoted to my dream job today",
//   "married life it tough",
//   "got divorced today  ",
//   //   "Just got married",
// ]);

module.exports = { callOpenAI };
