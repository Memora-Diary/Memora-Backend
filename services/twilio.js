const VoiceResponse = require('twilio').twiml.VoiceResponse;
const { CallService } = require('../services/calls');
const { WorkflowStatus, CallStatus } = require('../models/enums');
const db = require('../config/database');

// Define workflow states for diary entries
const DiaryWorkflowStatus = {
    GREETING: 'GREETING',
    QUESTION_1: 'QUESTION_1',
    QUESTION_2: 'QUESTION_2',
    QUESTION_3: 'QUESTION_3',
    FAREWELL: 'FAREWELL'
};

class TwilioIVRService {
    static defaultConfig = {
        language: 'en-US',
        voice: 'Polly.Joanna-Neural', // Using Amazon Polly Neural voice for more natural speech
        speechTimeout: 'auto',         // Auto-detect when user stops speaking
        questions: {
            greeting: "Hi there! Time for your daily diary entry.",
            farewell: "Thank you for sharing. Your responses have been saved. Have a great rest of your day!",
            // These will be dynamically updated by AI
            dailyQuestions: [
                "How are you feeling today?",
                "Tell me about the most interesting part of your day.",
                "What's something you're looking forward to tomorrow?"
            ]
        }
    };

    static config = { ...this.defaultConfig };

    // Update questions dynamically (to be called with AI-generated questions)
    static updateDailyQuestions(newQuestions) {
        if (Array.isArray(newQuestions) && newQuestions.length === 3) {
            this.config.questions.dailyQuestions = newQuestions;
        } else {
            throw new Error('Must provide exactly 3 questions');
        }
    }

    // Handle the different states of the conversation
    static getIvrWorkflowMapper() {
        return {
            [DiaryWorkflowStatus.GREETING]: [
                this.enterGreeting,
                DiaryWorkflowStatus.QUESTION_1
            ],
            [DiaryWorkflowStatus.QUESTION_1]: [
                this.enterQuestion.bind(this, 0),
                DiaryWorkflowStatus.QUESTION_2
            ],
            [DiaryWorkflowStatus.QUESTION_2]: [
                this.enterQuestion.bind(this, 1),
                DiaryWorkflowStatus.QUESTION_3
            ],
            [DiaryWorkflowStatus.QUESTION_3]: [
                this.enterQuestion.bind(this, 2),
                DiaryWorkflowStatus.FAREWELL
            ],
            [DiaryWorkflowStatus.FAREWELL]: [
                this.enterFarewell,
                null
            ]
        };
    }

    // Entry handlers for each state
    static enterGreeting() {
        const response = new VoiceResponse();
        response.say({
            voice: this.config.voice,
            language: this.config.language
        }, this.config.questions.greeting);
        
        return response;
    }

    static enterQuestion(questionIndex) {
        const response = new VoiceResponse();
        const gather = response.gather({
            input: 'speech',
            timeout: 5,
            speechTimeout: this.config.speechTimeout,
            language: this.config.language
        });

        gather.say({
            voice: this.config.voice,
            language: this.config.language
        }, this.config.questions.dailyQuestions[questionIndex]);

        return response;
    }

    static enterFarewell() {
        const response = new VoiceResponse();
        response.say({
            voice: this.config.voice,
            language: this.config.language
        }, this.config.questions.farewell);
        
        return response;
    }

    // Handle responses
    static async handleResponse(callSid, questionIndex, speechResult) {
        try {
            const call = await CallService.get(callSid);
            
            // Save the response to database
            await db.diaryEntries.create({
                callSid,
                userId: call.userId,
                questionIndex,
                question: this.config.questions.dailyQuestions[questionIndex],
                response: speechResult,
                timestamp: new Date()
            });

            return true;
        } catch (error) {
            console.error('Error saving diary entry:', error);
            return false;
        }
    }

    // Initialize a new daily call
    static async initiateDailyCall(userId, phoneNumber) {
        try {
            const call = await CallService.create({
                userId,
                toNumber: phoneNumber,
                status: CallStatus.SCHEDULED,
                workflowStatus: DiaryWorkflowStatus.GREETING
            });

            return this.enterState(call, DiaryWorkflowStatus.GREETING);
        } catch (error) {
            console.error('Error initiating daily call:', error);
            throw error;
        }
    }

    // State management
    static async enterState(call, state) {
        console.log(`Entering state: ${state}`);
        const response = new VoiceResponse();

        // Update call status
        call.workflowStatus = state;
        await db.save(call);

        const [enterHandler, nextState] = this.getIvrWorkflowMapper()[state];

        const actions = enterHandler();
        if (Array.isArray(actions)) {
            actions.forEach(action => response.append(action));
        } else {
            response.append(actions);
        }

        if (nextState) {
            // Add a brief pause between questions
            response.pause({ length: 1 });
        }

        return response;
    }

    // Handle state transitions
    static async handleStateTransition(call, speechResult) {
        const currentState = call.workflowStatus;
        
        // Save the response if it's a question state
        if (currentState.includes('QUESTION_')) {
            const questionIndex = parseInt(currentState.split('_')[1]) - 1;
            await this.handleResponse(call.callSid, questionIndex, speechResult);
        }

        // Get next state
        const [_, nextState] = this.getIvrWorkflowMapper()[currentState];
        
        if (nextState) {
            return this.enterState(call, nextState);
        }

        // Call is complete
        await CallService.update(call.callSid, { status: CallStatus.COMPLETED });
        return null;
    }
}

// Example usage:
/*
// Update questions with AI-generated ones
const aiGeneratedQuestions = [
    "How has your emotional state been throughout the day?",
    "Share a moment that made you smile or laugh today.",
    "What's one thing you learned or realized today?"
];

TwilioIVRService.updateDailyQuestions(aiGeneratedQuestions);

// Initiate a daily call
await TwilioIVRService.initiateDailyCall(userId, phoneNumber);
*/

module.exports = TwilioIVRService;
