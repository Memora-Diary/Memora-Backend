const API_BASE = 'https://nillion-storage-apis-v0.onrender.com';

class NillionService {
    constructor() {
        this.appId = null;
        this.initializeApp();
    }

    async initializeApp() {
        try {
            // Try to get app ID from env
            if (process.env.NILLION_APP_ID) {
                this.appId = process.env.NILLION_APP_ID;
                console.log('Using existing Nillion APP_ID:', this.appId);
                return;
            }

            // If no app ID exists, register a new one
            console.log('No APP_ID found, registering new app with Nillion...');
            const response = await fetch(`${API_BASE}/api/apps/register`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error(`Failed to register app: ${response.status}`);
            }

            const data = await response.json();
            this.appId = data.app_id;
            console.log('Successfully registered new Nillion APP_ID:', this.appId);

            // You might want to save this app_id for future use
            // For now, just log it - in production you should save it to env or database
            console.log('Please save this APP_ID in your environment variables as NILLION_APP_ID');
        } catch (error) {
            console.error('Error initializing Nillion app:', error);
            throw error;
        }
    }

    async ensureInitialized() {
        if (!this.appId) {
            await this.initializeApp();
        }
        return this.appId;
    }

    async getUserId(userSeed) {
        try {
            console.log('Getting user ID for seed:', userSeed);
            const response = await fetch(`${API_BASE}/api/user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nillion_seed: userSeed,
                }),
            });

            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }

            const data = await response.json();
            console.log('User ID response:', data);
            return data.nillion_user_id;
        } catch (error) {
            console.error('Error getting user ID:', error);
            throw error;
        }
    }

    async storeNote(userId, title, content) {
        try {
            await this.ensureInitialized();
            const userSeed = `telegram_${userId}`;
            console.log(`Storing note for user ${userId}, title: ${title}`);
            
            // Analyze content before storing
            const analysisResult = await this.analyzeContent(content);
            
            // Store note with analysis and metadata
            const noteData = {
                content,
                timestamp: Date.now(),
                analysis: analysisResult.analysis
            };

            const response = await fetch(`${API_BASE}/api/apps/${this.appId}/secrets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    secret: {
                        nillion_seed: userSeed,
                        secret_value: JSON.stringify(noteData),  // Convert object to string
                        secret_name: `note_${title}`,
                    },
                    permissions: {
                        retrieve: [],
                        update: [],
                        delete: [],
                        compute: {},
                    },
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Nillion API Error:', errorData);
                throw new Error(`API returned ${response.status}: ${JSON.stringify(errorData)}`);
            }

            const result = await response.json();
            console.log('Store result:', result);
            
            return { 
                storeId: result.store_id, 
                analysis: analysisResult.analysis
            };
        } catch (error) {
            console.error('Error in storeNote:', error);
            throw error;
        }
    }

    async retrieveNote(userId, storeId, title) {
        try {
            await this.ensureInitialized();
            const userSeed = `telegram_${userId}`;
            console.log(`Retrieving note. StoreID: ${storeId}, Title: ${title}`);

            // Construct URL with query parameters exactly as shown in reference
            const url = `${API_BASE}/api/secret/retrieve/${storeId}?retrieve_as_nillion_user_seed=${userSeed}&secret_name=note_${title}`;

            const response = await fetch(url);
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Nillion API Error:', errorData);
                throw new Error(`API returned ${response.status}: ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            console.log('Retrieved secret:', data);

            // Parse the secret_value since we stored it as a stringified object
            const parsedData = JSON.parse(data.secret_value);
            
            return {
                content: parsedData.content,
                timestamp: parsedData.timestamp,
                analysis: parsedData.analysis
            };
        } catch (error) {
            console.error('Error retrieving note:', error);
            throw error;
        }
    }

    async listNotes(userId) {
        try {
            await this.ensureInitialized();
            console.log(`Listing notes for app ID: ${this.appId}`);
            
            const response = await fetch(`${API_BASE}/api/apps/${this.appId}/store_ids`);
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Nillion API Error:', errorData);
                throw new Error(`API returned ${response.status}: ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            console.log('Raw store IDs response:', data);
            
            if (!data.store_ids) {
                console.log('No store IDs found');
                return [];
            }

            // Filter notes for this user and format the response
            return data.store_ids
                .filter(item => item.secret_name.startsWith('note_'))
                .map(item => ({
                    title: item.secret_name.replace('note_', ''),
                    storeId: item.store_id,
                    secretName: item.secret_name
                }));

        } catch (error) {
            console.error('Error listing notes:', error);
            throw error;
        }
    }

    // Helper method to analyze content
    async analyzeContent(content) {
        try {
            const analysisResponse = await fetch('http://localhost:3003/webhook/analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcript_segments: [
                        {
                            text: content,
                            timestamp: Date.now()
                        }
                    ]
                })
            });
            
            if (!analysisResponse.ok) {
                const errorData = await analysisResponse.json();
                throw new Error(`Analysis failed: ${JSON.stringify(errorData)}`);
            }

            return await analysisResponse.json();
        } catch (error) {
            console.error('Error analyzing content:', error);
            throw error;
        }
    }
}

module.exports = new NillionService();
