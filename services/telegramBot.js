const TelegramBot = require('node-telegram-bot-api');
const { User, DiaryEntry } = require('../models');
const { Op } = require('sequelize');
const { fetchMemoraNFTData, fetchNFTPrompt, triggerNFT, triggerMemoraBTC } = require('./chain');
const { generateDiaryQuestions, callOpenAI, giveNegativeFeedback } = require('./ai');
import('node-fetch').then(fetch => {
  // Your code here
}).catch(err => console.error('Error importing fetch:', err));
const { sendNFTTriggerNotification, sendBTCTriggerNotification, } = require('./pushProtocol');
const nillionService = require('./nillion');

class TelegramDiaryBot {
    constructor() {
        this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
        this.userStates = new Map();
        this.defaultConfig = {
            questions: {
                greeting: "Hi there! Time for your daily diary entry. Ready to begin?",
                farewell: "Thank you for sharing! Your responses have been saved. See you tomorrow! 🌟",
                dailyQuestions: [
                    "How are you feeling today?",
                    "Tell me about the most interesting part of your day.",
                    "What's something you're looking forward to tomorrow?"
                ]
            },
            commands: {
                start: "Welcome to your Daily Diary Bot! You'll receive 3 questions each day to reflect on. Type /subscribe to start receiving daily questions.",
                help: "Available commands:\n/start - Initialize the bot\n/subscribe - Subscribe to daily questions\n/unsubscribe - Stop daily questions\n/status - Check subscription status\n/history - View your past entries\n/save_note - Save a private note (Secured by Nillion)\n/get_note - Retrieve a note (Secured by Nillion)\n/list_notes - List all your secure notes\n\n🔒 All notes are encrypted and stored on the Nillion Network",
            }
        };
        
        this.config = { ...this.defaultConfig };
        this.initializeBot();
        this.lastUpdateId = 0;
    }

    initializeBot() {
        this.bot.onText(/\/start/, this.handleStart.bind(this));
        this.bot.onText(/\/subscribe/, this.handleSubscribe.bind(this));
        this.bot.onText(/\/unsubscribe/, this.handleUnsubscribe.bind(this));
        this.bot.onText(/\/history/, this.handleHistory.bind(this));
        this.bot.onText(/\/help/, (msg) => {
            this.bot.sendMessage(msg.chat.id, this.config.commands.help);
        });

        this.bot.on('message', this.handleMessage.bind(this));
        this.bot.onText(/\/save_note/, this.handleSaveNote.bind(this));
        this.bot.onText(/\/get_note/, this.handleGetNote.bind(this));
        this.bot.onText(/\/list_notes/, this.handleListNotes.bind(this));
    }

    async handleStart(msg) {
        const chatId = msg.chat.id;
        const username = msg.from.username;
        
        try {
            await this.storeChatIdMapping(username, chatId);
            await this.bot.sendMessage(chatId, 
                this.config.commands.start + "\n\n" +
                "🔒 Your notes are secured and encrypted using Nillion Network technology!"
            );
        } catch (error) {
            console.error('Error in handleStart:', error);
            await this.bot.sendMessage(chatId, "An error occurred. Please try again later.");
        }
    }

    async handleSubscribe(msg) {
        const chatId = msg.chat.id;
        try {
            const [user] = await User.findOrCreate({
                where: { telegram_id: chatId.toString() },
                defaults: {
                    username: msg.from.username,
                    is_subscribed: true,
                    last_interaction: new Date()
                }
            });

            await user.update({ 
                is_subscribed: true,
                last_interaction: new Date()
            });

            await this.bot.sendMessage(chatId, "You're now subscribed to daily diary questions! You'll receive your first questions soon.");
        } catch (error) {
            console.error('Subscription error:', error);
            await this.bot.sendMessage(chatId, "There was an error processing your subscription. Please try again later.");
        }
    }

    async handleUnsubscribe(msg) {
        const chatId = msg.chat.id;
        try {
            const user = await User.findOne({ 
                where: { telegram_id: chatId.toString() } 
            });

            if (!user) {
                await this.bot.sendMessage(chatId, "Please start the bot first with /start");
                return;
            }

            await user.update({ 
                is_subscribed: false,
                last_interaction: new Date()
            });

            await this.bot.sendMessage(chatId, "You've been unsubscribed from daily questions. You can resubscribe anytime with /subscribe");
        } catch (error) {
            console.error('Unsubscribe error:', error);
            await this.bot.sendMessage(chatId, "There was an error processing your request. Please try again later.");
        }
    }

    async handleHistory(msg) {
        const chatId = msg.chat.id;
        try {
            const user = await User.findOne({ 
                where: { telegram_id: chatId.toString() } 
            });

            if (!user) {
                await this.bot.sendMessage(chatId, "Please start the bot first with /start");
                return;
            }

            const entries = await DiaryEntry.findAll({
                where: {
                    user_id: user.id,
                    timestamp: {
                        [Op.gte]: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
                    }
                },
                order: [['timestamp', 'DESC']],
                limit: 15
            });

            if (entries.length === 0) {
                await this.bot.sendMessage(chatId, "You don't have any recent diary entries.");
                return;
            }

            const entriesByDay = entries.reduce((acc, entry) => {
                const date = new Date(entry.timestamp).toLocaleDateString();
                if (!acc[date]) acc[date] = [];
                acc[date].push(entry);
                return acc;
            }, {});

            let message = "Your recent diary entries:\n\n";
            for (const [date, dayEntries] of Object.entries(entriesByDay)) {
                message += `📅 ${date}\n`;
                dayEntries.forEach(entry => {
                    message += `Q: ${entry.question}\nA: ${entry.response}\n\n`;
                });
                message += "-------------------\n";
            }

            await this.bot.sendMessage(chatId, message);
        } catch (error) {
            console.error('Error fetching history:', error);
            await this.bot.sendMessage(chatId, "There was an error fetching your history. Please try again later.");
        }
    }

    async handleMessage(msg) {
        const chatId = msg.chat.id;
        const username = msg.from.username;
        
        if (!username) {
            console.log('Message received from user without username');
            return;
        }

        // Store chat ID mapping as soon as we receive any message
        try {
            await this.storeChatIdMapping(username, chatId);
        } catch (error) {
            console.error('Error storing chat ID mapping:', error);
        }
        
        if (msg.text?.startsWith('/')) return;

        try {
            const user = await User.findOne({ 
                where: { telegram_id: chatId.toString() } 
            });

            if (!user) {
                await this.bot.sendMessage(chatId, "Please start the bot first with /start");
                return;
            }

            const userState = this.userStates.get(chatId);
            if (!userState) {
                console.log('No active question session for chat:', chatId);
                return;
            }

            console.log(`Processing response for question ${userState.currentQuestion + 1}/3`);
            console.log('Current question:', userState.questions[userState.currentQuestion]);
            console.log('User response:', msg.text);

            try {
                // Create diary entry for this response
                const diaryEntry = await DiaryEntry.create({
                    user_id: user.id,
                    chat_id: chatId.toString(),
                    question_index: userState.currentQuestion,
                    question: userState.questions[userState.currentQuestion],
                    response: msg.text,
                    timestamp: new Date()
                });

                console.log('Diary entry created:', diaryEntry.id);

                // Store response in user state
                userState.responses.push({
                    question: userState.questions[userState.currentQuestion],
                    response: msg.text,
                    timestamp: new Date()
                });

                // Move to next question
                userState.currentQuestion++;
                this.userStates.set(chatId, userState);

                // If there are more questions, send the next one
                if (userState.currentQuestion < userState.questions.length) {
                    await this.bot.sendMessage(
                        chatId, 
                        userState.questions[userState.currentQuestion]
                    );
                    console.log(`Sent question ${userState.currentQuestion + 1}/3`);
                } else {
                    // All questions answered, evaluate responses
                    console.log('All questions answered, evaluating responses');
                    
                    // Get all diary entries for this user
                    const allEntries = await DiaryEntry.findAll({
                        where: { user_id: user.id },
                        order: [['timestamp', 'DESC']],
                        raw: true
                    });

                    console.log('Total diary entries found:', allEntries.length);

                    const formattedEntries = allEntries.map(entry => 
                        `Q: ${entry.question}\nA: ${entry.response}`
                    ).join('\n');

                    // Get NFT info and evaluate
                    if (userState.nftId) {
                        const nftInfo = await fetchNFTPrompt(userState.nftId);
                        console.log(`Evaluating NFT ${userState.nftId} with prompt: ${nftInfo.prompt}`);
                        
                        const aiDecision = await callOpenAI(
                            nftInfo.prompt,
                            formattedEntries
                        );

                        console.log('AI Decision:', aiDecision);

                        if (aiDecision === 'yes') {
                            await triggerNFT(userState.nftId);
                            await this.bot.sendMessage(
                                chatId,
                                "🎉 Based on your diary entries, your condition has been met! The NFT has been triggered."
                            );
                        }
                    }

                    // Send farewell message and clean up state
                    await this.bot.sendMessage(chatId, this.config.questions.farewell);
                    this.userStates.delete(chatId);
                    await user.update({ last_interaction: new Date() });
                }
            } catch (error) {
                console.error('Error saving diary entry:', error);
                throw error;
            }
        } catch (error) {
            console.error('Error handling message:', error);
            await this.bot.sendMessage(chatId, "There was an error processing your response. Please try again later.");
        }
    }

    async processDiaryEntry(chatId, username) {
        console.log(`Processing diary entry for chatId: ${chatId}`);
        try {
            const user = await User.findOne({ 
                where: { telegram_id: chatId } 
            });

            if (!user) {
                console.log('User not found for chatId:', chatId);
                return;
            }

            // Get all diary entries for this user
            const userState = this.userStates.get(chatId);
            console.log(`User state for chatId ${chatId}:`, userState);

            const allEntries = await DiaryEntry.findAll({
                where: { user_id: user.id },  // Changed from username to user_id
                order: [['timestamp', 'DESC']],
                raw: true
            });

            console.log('Total diary entries found:', allEntries.length);

            const formattedEntries = allEntries.map(entry => 
                `Q: ${entry.question}\nA: ${entry.response}`
            ).join('\n');

            // Get NFT info and evaluate
            if (userState?.nftId) {
                console.log(`Attempting to fetch NFT info for NFT ID: ${userState.nftId}`);
                const nftInfo = await fetchNFTPrompt(userState.nftId);
                console.log(`Evaluating NFT ${userState.nftId} with prompt: ${nftInfo.prompt}`);
                
                const aiDecision = await callOpenAI(
                    nftInfo.prompt,
                    formattedEntries
                );

                console.log('AI Decision:', aiDecision);

                if (aiDecision === 'yes') {
                    console.log(`Triggering NFT ${userState.nftId} based on AI decision.`);
                    await triggerNFT(userState.nftId);
                    await this.bot.sendMessage(
                        chatId,
                        "🎉 Based on your diary entries, your condition has been met! The NFT has been triggered."
                    );                    
                }
            }

            // Send farewell message and clean up state
            console.log(`Sending farewell message to chatId: ${chatId}`);
            await this.bot.sendMessage(chatId, this.config.questions.farewell);
            console.log(`Deleting user state for chatId: ${chatId}`);
            this.userStates.delete(chatId);
            console.log(`Updating last interaction for user`);
            await user.update({ last_interaction: new Date() });
        } catch (error) {
            console.error('Error processing diary entry:', error);
            throw error;
        }
    }

    async sendDailyQuestions() {
        try {
            
            const allMinters = await fetchMemoraNFTData();
            console.log('Fetched minters from blockchain:', allMinters.length);

            for (const [nftId, minterAddress, telegramUsername] of allMinters) {
                try {
                    if (!telegramUsername) {
                        console.log(`No Telegram username for minter ${minterAddress}`);
                        continue;
                    }

                    const nftInfo = await fetchNFTPrompt(nftId);
                    const chatId = await this.getChatIdFromUsername(telegramUsername);
                    
                    if (!chatId) {
                        console.log(`Could not find chat ID for username: ${telegramUsername}`);
                        continue;
                    }

                    const [user] = await User.findOrCreate({
                        where: { telegram_id: chatId.toString() },
                        defaults: {
                            username: telegramUsername,
                            is_subscribed: true,
                            last_interaction: new Date()
                        }
                    });

                    if (user.is_subscribed) {
                        const questions = await generateDiaryQuestions({
                            nftPrompt: nftInfo.prompt,
                            previousResponses: []
                        });

                        console.log(`Generated questions for user ${telegramUsername}:`, questions);

                        // Set initial state
                        this.userStates.set(chatId, {
                            currentQuestion: 0,
                            responses: [],
                            questions: questions,
                            nftId: nftId
                        });

                        // Send intro message
                        await this.bot.sendMessage(
                            chatId,
                            "🌟 Time for your daily reflection! Please answer each question:"
                        );

                        // Send first question
                        const sentQuestion = await this.bot.sendMessage(chatId, questions[0]);
                        console.log(`Sent first question to ${telegramUsername}: ${questions[0]}`);

                        // Wait for reply using getUpdates
                        let waitingForReply = true;
                        let startTime = Date.now();
                        const timeout = 24 * 60 * 60 * 1000; // 24 hours
                        console.log("Waiting for reply...............")
                        this.bot.on('message', (msg) => {
                            console.log({msg})
                            DiaryEntry.create({
                                user_id: user.id,
                                chat_id: chatId.toString(),
                                question_index: 0,
                                question: questions[0],
                                response: msg.text,
                                timestamp: new Date()
                            });
                            this.processDiaryEntry(chatId.toString(), msg?.from?.username)
                        })
                        await new Promise(resolve => setTimeout(resolve, 20000));

                      
                        if (Date.now() - startTime >= timeout) {
                            console.log(`Timeout waiting for response from ${telegramUsername}`);
                            this.userStates.delete(chatId);
                        }
                    }
                } catch (error) {
                    console.error(`Error processing minter ${minterAddress}:`, error);
                    continue;
                }
            }
        } catch (error) {
            console.error('Error in sendDailyQuestions:', error);
            throw error;
        }
    }

    async getChatIdFromUsername(username) {
        try {
            const cleanUsername = username.replace('@', '').replace('telegram:', '');
            
            // First try to get from database
            const user = await User.findOne({
                where: { username: cleanUsername }
            });

            if (user?.telegram_id) {
                console.log(`Found chat ID in database for user ${cleanUsername}`);
                return user.telegram_id;
            }

            // If not in database, try to get from Telegram updates
            console.log(`Attempting to get chat ID from Telegram for user ${cleanUsername}`);
            const response = await fetch(
                `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getUpdates?offset=${this.lastUpdateId}&limit=100`
            );
            
            const data = await response.json();
            
            if (!data.ok) {
                console.error('Telegram API error:', data);
                return null;
            }

            if (data.result?.length > 0) {
                this.lastUpdateId = data.result[data.result.length - 1].update_id + 1;
                
                // Look for any message from this user
                const relevantUpdate = data.result.find(update => 
                    update?.message?.from?.username?.toLowerCase() === cleanUsername.toLowerCase()
                );

                if (relevantUpdate?.message?.chat?.id) {
                    const chatId = relevantUpdate.message.chat.id;
                    console.log(`Found chat ID from Telegram for user ${cleanUsername}: ${chatId}`);
                    
                    // Store in database for future use
                    await this.storeChatIdMapping(cleanUsername, chatId);
                    return chatId;
                }
            }

            console.log(`Could not find chat ID for user ${cleanUsername}`);
            return null;
        } catch (error) {
            console.error('Error getting chat ID from username:', error);
            return null;
        }
    }

    async storeChatIdMapping(username, chatId) {
        try {
            const cleanUsername = username.replace('@', '');
            console.log(`Storing chat ID mapping for ${cleanUsername}: ${chatId}`);
            
            // Try to find existing user first
            const [user, created] = await User.findOrCreate({
                where: { 
                    username: cleanUsername 
                },
                defaults: {
                    telegram_id: chatId.toString(),
                    is_subscribed: true, // Changed to true since they're interacting with the bot
                    last_interaction: new Date()
                }
            });

            if (!created) {
                // Update existing user's telegram_id and last_interaction
                await user.update({ 
                    telegram_id: chatId.toString(),
                    last_interaction: new Date()
                });
                console.log(`Updated existing user ${cleanUsername} with new chat ID`);
            } else {
                console.log(`Created new user mapping for ${cleanUsername}`);
            }

            return user;
        } catch (error) {
            console.error('Error storing chat ID mapping:', error);
            throw error;
        }
    }

    async stop() {
        if (this.bot) {
            await this.bot.stopPolling();
        }
    }

    async handleSaveNote(msg) {
        const chatId = msg.chat.id;
        console.log('\n=== SAVE NOTE OPERATION ===');
        console.log('Chat ID:', chatId);
        console.log('Raw message:', msg.text);
        
        try {
            const text = msg.text.split(' ').slice(1).join(' ');
            console.log('Processed text:', text);
            
            const firstQuoteIndex = text.indexOf('"');
            const lastQuoteIndex = text.lastIndexOf('"');
            console.log('Quote indices:', { first: firstQuoteIndex, last: lastQuoteIndex });
            
            if (firstQuoteIndex === -1 || firstQuoteIndex === lastQuoteIndex) {
                console.log('Invalid format detected');
                return this.bot.sendMessage(chatId, 
                    'Please use the format: /save_note "title" your note content\n' +
                    'Example: /save_note "Shopping List" Buy milk and eggs'
                );
            }

            const title = text.slice(firstQuoteIndex + 1, lastQuoteIndex);
            const content = text.slice(lastQuoteIndex + 1).trim();
            console.log('Parsed note:', { title, content });

            if (!title || !content) {
                console.log('Missing title or content');
                return this.bot.sendMessage(chatId, 
                    'Both title and content are required.\n' +
                    'Format: /save_note "title" your note content'
                );
            }

            console.log('Attempting to store note with Nillion...');
            const { storeId, analysis } = await nillionService.storeNote(chatId, title, content);
            console.log('Nillion store result:', { storeId, analysis });
            
            let message = `✅ Note "${title}" has been securely saved using Nillion! 🔒\n` +
                         `Your note is encrypted and stored on the Nillion Network.\n` +
                         `Use /get_note "${title}" to retrieve it later.`;

            if (analysis) {
                message += `\n\n📊 Analysis:\n${analysis}`;
            }
            
            await this.bot.sendMessage(chatId, message);
            console.log('Save note operation completed successfully');

        } catch (error) {
            console.error('Error in handleSaveNote:', error);
            console.error('Stack trace:', error.stack);
            await this.bot.sendMessage(chatId, 
                '❌ Failed to save note. Please try again later.\n' +
                'Error: ' + error.message
            );
        }
    }

    async handleGetNote(msg) {
        const chatId = msg.chat.id;
        console.log('\n=== GET NOTE OPERATION ===');
        console.log('Chat ID:', chatId);
        console.log('Raw message:', msg.text);
        
        try {
            const text = msg.text.split(' ').slice(1).join(' ').trim();
            console.log('Processed text:', text);
            
            if (!text) {
                console.log('No title provided');
                return this.bot.sendMessage(chatId, 
                    'Please provide the note title.\n' +
                    'Format: /get_note "title"'
                );
            }

            const title = text.replace(/^"(.*)"$/, '$1');
            console.log('Parsed title:', title);

            console.log('Fetching notes list...');
            const notes = await nillionService.listNotes(chatId);
            console.log('All available notes:', notes);

            const noteInfo = notes.find(note => note.title === title);
            console.log('Found note info:', noteInfo);

            if (!noteInfo) {
                console.log('Note not found');
                return this.bot.sendMessage(chatId, 
                    '❌ Note not found. Check the title and try again.\n' +
                    'Use /list_notes to see all your notes.'
                );
            }

            console.log('Retrieving note content...');
            const noteData = await nillionService.retrieveNote(chatId, noteInfo.storeId, title);
            console.log('Retrieved note data:', noteData);

            const formattedDate = new Date(noteData.timestamp).toLocaleString();
            let message = `📝 Note: ${title}\n` +
                         `Securely retrieved from Nillion Network 🔒\n\n` +
                         `${noteData.content}\n\n` +
                         `Created: ${formattedDate}`;

            if (noteData.analysis) {
                message += `\n\n📊 Analysis:\n${noteData.analysis}`;
            }

            await this.bot.sendMessage(chatId, message);
            console.log('Get note operation completed successfully');

        } catch (error) {
            console.error('Error in handleGetNote:', error);
            console.error('Stack trace:', error.stack);
            await this.bot.sendMessage(chatId, 
                '❌ Failed to retrieve note. Please try again later.\n' +
                'Error: ' + error.message
            );
        }
    }

    async handleListNotes(msg) {
        const chatId = msg.chat.id;
        console.log('\n=== LIST NOTES OPERATION ===');
        console.log('Chat ID:', chatId);
        
        try {
            console.log('Fetching notes list...');
            const notes = await nillionService.listNotes(chatId);
            console.log('Retrieved notes:', notes);

            if (!notes.length) {
                console.log('No notes found');
                return this.bot.sendMessage(chatId, 
                    'You have no saved notes yet.\n' +
                    'Use /save_note "title" content to create one!'
                );
            }

            const notesList = notes.map((note, index) => 
                `${index + 1}. "${note.title}"`
            ).join('\n');
            console.log('Formatted notes list:', notesList);

            await this.bot.sendMessage(chatId,
                `📚 Your Secure Notes (Powered by Nillion):\n\n${notesList}\n\n` +
                `All notes are encrypted and stored on the Nillion Network 🔒\n` +
                `Use /get_note "title" to retrieve a specific note.`
            );
            console.log('List notes operation completed successfully');

        } catch (error) {
            console.error('Error in handleListNotes:', error);
            console.error('Stack trace:', error.stack);
            await this.bot.sendMessage(chatId, 
                '❌ Failed to list notes. Please try again later.'
            );
        }
    }
}

module.exports = TelegramDiaryBot;



