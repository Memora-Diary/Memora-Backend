const OpenAI = require("openai");
const pushProtocolService = require('./pushProtocol');

const client = new OpenAI({
  baseURL: "https://llama.us.gaianet.network/v1",
  apiKey: "",
});

const client2 = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
async function analyzeDiaryEntries(entries, userAddress) {
  try {
    console.log("Analyzing diary entries");
    const response = await client.chat.completions.create({
      model: "llama",
      messages: [
        {
          role: "system",
          content: `You are an empathetic and encouraging AI mentor. Your role is to:
            1. Analyze diary entries with deep emotional intelligence
            2. Identify meaningful patterns and progress
            3. Create a warm, personalized message that:
               - Celebrates their progress and effort
               - Acknowledges their challenges with empathy
               - Offers gentle encouragement
               - Uses a warm, friendly tone with appropriate emojis
               - Keeps the message concise but impactful (max 2-3 sentences)
            4. Focus on making the user feel seen, understood, and supported`,
        },
        {
          role: "user",
          content: `Analyze these diary entries and create an uplifting message: ${JSON.stringify(entries)}
            Make it personal, warm, and encouraging. Include relevant emojis.`,
        },
      ],
      temperature: 0.8,
      max_tokens: 5000,
    });

    const insights = response.choices[0].message.content;
    
    // Send Push notification with AI-generated insights
    if (userAddress) {
      await pushProtocolService.sendDiaryInsightNotification(userAddress, insights);
    }

    return insights;
  } catch (error) {
    console.error("Error analyzing diary entries:", error);
    // Provide a warm fallback message
    const fallbackMessage = "✨ Thank you for sharing your journey with us. Your dedication to self-reflection is truly inspiring! 🌟";
    if (userAddress) {
      await pushProtocolService.sendDiaryInsightNotification(userAddress, fallbackMessage);
    }
    return fallbackMessage;
  }
}

// New function to generate personalized achievement messages
async function generateAchievementMessage(prompt, nftId) {
  try {
    const response = await client.chat.completions.create({
      model: "llama",
      messages: [
        {
          role: "system",
          content: `You are an enthusiastic and empathetic AI celebration creator. Create a heartfelt, personalized celebration message for someone who just achieved their goal. The message should:
            - Start with engaging emojis
            - Be warm and personal
            - Acknowledge their specific achievement
            - Include words of encouragement for the future
            - End with uplifting emojis
            - Be concise but impactful (2-3 sentences max)
            - Make them feel proud and accomplished`,
        },
        {
          role: "user",
          content: `Create a celebration message for NFT #${nftId} with condition: "${prompt}"
            Make it uplifting and personal.`,
        },
      ],
      temperature: 0.9,
      max_tokens: 5000,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating achievement message:", error);
    return `🌟 Incredible achievement! Your journey to fulfill "${prompt}" has reached its beautiful conclusion. We're so proud of your dedication! ✨`;
  }
}

// Add this new training data for conditions
const conditionTrainingData = [
    {
        condition: "When I get married",
        keywords: ["married", "wedding", "tie the knot", "marriage"],
    },
    {
        condition: "When I get a promotion",
        keywords: ["promotion", "promoted", "advance", "higher position"],
    },
    {
        condition: "When I have a baby",
        keywords: ["baby", "child", "pregnant", "birth"],
    },
    {
        condition: "When I buy a house",
        keywords: ["house", "home", "property", "mortgage"],
    },
    {
        condition: "When I pass away",
        keywords: ["die", "death", "passed away", "deceased"],
    },
    {
        condition: "When I retire",
        keywords: ["retire", "retirement", "pension", "stop working"],
    }
];

// New function to analyze messages for conditions and intentions
async function analyzeMessageIntentions(messages, customConditions = []) {
    let processedMessages = [];
    
    try {
        console.log('\n📝 Analyzing message intentions...');
        console.log('Input messages:', messages);
        
        // Ensure messages is always in the correct format
        processedMessages = Array.isArray(messages) 
            ? messages.filter(msg => msg) // Filter out null/undefined values
            : typeof messages === 'string' 
                ? [messages] 
                : [];

        if (processedMessages.length === 0) {
            return {
                success: false,
                error: "No valid messages to analyze",
                timestamp: new Date().toISOString(),
                input: messages
            };
        }

        // Combine default conditions with any custom conditions
        const allConditions = [...conditionTrainingData, ...customConditions];
        
        // Format conditions for the prompt
        const conditions = allConditions.map(data => 
            `- "${data.condition}": Triggered by keywords: ${data.keywords.join(', ')}`
        ).join('\n');

        const promptMessages = [
            {
                role: "system",
                content: `You are an AI trained to analyze conversations and identify conditional statements and intentions. 
                
                Look for patterns that match these conditions:
                ${conditions}

                These conditions can be combined using logical operators:
                - AND (&&): Both conditions must be met
                - OR (||): At least one condition must be met
                - Grouping with parentheses () for complex combinations

                For each identified intention, extract:
                1. The condition(s) that trigger it
                2. The action or transfer to be executed
                3. The beneficiary (if applicable)
                4. Any assets or amounts involved
                5. Any temporal information (when/timeframe)

                Format your response as a JSON object with this structure:
                {
                    "intentions": [
                        {
                            "condition": "string",
                            "action": "string",
                            "beneficiary": "string or null",
                            "assets": {
                                "type": "string",
                                "amount": "number or string",
                                "currency": "string"
                            },
                            "timeframe": "string or null",
                            "raw_text": "string"
                        }
                    ],
                    "complex_conditions": [
                        {
                            "type": "AND|OR",
                            "conditions": ["string"],
                            "raw_text": "string"
                        }
                    ]
                }`
            },
            {
                role: "user",
                content: processedMessages.join('\n')
            }
        ];

        console.log('Sending request to AI with messages:', promptMessages);
        const completion = await client2.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: promptMessages,
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 1000
        });

        const analysis = JSON.parse(completion.choices[0].message.content);
        
        console.log('\n🔍 Analysis Results:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(JSON.stringify(analysis, null, 2));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        return {
            success: true,
            analysis: analysis,
            timestamp: new Date().toISOString(),
            processed_messages: processedMessages
        };

    } catch (error) {
        console.error('Error in analyzeMessageIntentions:', error);
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
            input: messages,
            processed_messages: processedMessages
        };
    }
}

// Example usage:
// const messages = [
//     "When I get married, I want to give 1 ETH to my sister",
//     "If I get promoted AND buy a house, transfer $5000 to my parents"
// ];
// const result = await analyzeMessageIntentions(messages);

// Export client so it can be used in chain.js
module.exports = { 
  client,
  callOpenAI, 
  giveNegativeFeedback, 
  generateDiaryQuestions, 
  analyzeDiaryEntries,
  generateAchievementMessage,
  analyzeMessageIntentions 
};
