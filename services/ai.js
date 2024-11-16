const OpenAI = require("openai");

const client = new OpenAI({
  baseURL: "https://llama.us.gaianet.network/v1",
  apiKey: "",
});

async function callOpenAI(prompt, messagesArray) {
  try {
    console.log("Calling OpenAI with prompt and messagesArray");
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
      ],
      temperature: 0.7,
      max_tokens: 5000,
    });
    console.log("OpenAI response received");
    return response.choices[0].message.content.toLowerCase();
  } catch (error) {
    console.error("Error:", error);
  }
}

async function giveNegativeFeedback(prompt, messagesArray) {
  try {
    console.log("Giving negative feedback to OpenAI");
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
    console.log("Negative feedback given to OpenAI");
  } catch (error) {
    console.error("Error:", error);
  }
}

// New function to generate personalized questions
async function generateDiaryQuestions({ nftPrompt, previousResponses }) {
  try {
    console.log("Generating diary questions");
    const response = await client.chat.completions.create({
      model: "llama",
      messages: [
        {
          role: "system",
          content: `You are an empathetic AI diary assistant. Your role is to generate 3 personalized questions for a user's daily diary entry. 
            The user has set up a condition: "${nftPrompt}".
            Analyze their previous responses to create meaningful, contextual questions that:
            1. Help track progress towards their condition
            2. Encourage self-reflection and emotional awareness
            3. Show understanding of their previous entries
            The questions should be engaging and help assess if the condition might be met. The questions should be short but precise without any formatting`
        },
        {
          role: "user",
          content: `NFT Condition: ${nftPrompt}
            Previous responses: ${JSON.stringify(previousResponses)}
            Generate 3 questions for today's diary entry that help track progress towards the condition while maintaining emotional awareness.
            If there are no previous responses, generate engaging general questions related to the condition.`
        }
      ],
      temperature: 0.8,
      max_tokens: 5000,
    });

    const questions = response.choices[0].message.content
      .split('\n')
      .filter(q => q.trim())
      .slice(0, 4);

    // Fallback questions in case AI doesn't generate exactly 3
    const fallbackQuestions = [
      `How do you feel you're progressing towards "${nftPrompt}"?`,
      "What steps did you take today towards your goal?",
      "What support or resources might help you progress faster?"
    ];

    // Ensure we always return exactly 3 questions
    return questions.length === 3 ? questions : fallbackQuestions;
  } catch (error) {
    console.error("Error generating diary questions:", error);
    // Return default questions if there's an error
    return [
      `How do you feel you're progressing towards "${nftPrompt}"?`,
      "What steps did you take today towards your goal?",
      "What support or resources might help you progress faster?"
    ];
  }
}

// New function to analyze diary entries and provide insights
async function analyzeDiaryEntries(entries) {
  try {
    console.log("Analyzing diary entries");
    const response = await client.chat.completions.create({
      model: "llama",
      messages: [
        {
          role: "system",
          content: `You are an insightful AI diary analyst. Your role is to analyze a user's diary entries and provide meaningful insights about their emotional patterns, recurring themes, and potential areas for personal growth.
            Be empathetic and constructive in your analysis. Focus on patterns and trends that might be helpful for the user to be aware of.`,
        },
        {
          role: "user",
          content: `Analyze these diary entries and provide insights: ${JSON.stringify(entries)}
            Consider emotional patterns, recurring themes, and potential areas for growth.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 5000,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error analyzing diary entries:", error);
    return "Unable to analyze diary entries at this time.";
  }
}

module.exports = { 
  callOpenAI, 
  giveNegativeFeedback, 
  generateDiaryQuestions, 
  analyzeDiaryEntries 
};
