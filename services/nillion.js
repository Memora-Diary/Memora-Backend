const API_BASE = 'https://nillion-storage-apis-v0.onrender.com';

class NillionService {
    constructor() {
        if (!process.env.NILLION_APP_ID) {
            throw new Error('NILLION_APP_ID is not set in environment variables');
        }
        this.appId = process.env.NILLION_APP_ID;
        console.log('Nillion Service initialized with APP_ID:', this.appId);
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
            const userSeed = `telegram_${userId}`;
            console.log(`Storing note for user ${userId}, title: ${title}`);
            
            // Analyze content before storing
            try {
                // Make sure content is properly formatted
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
                    console.error('Analysis failed:', errorData);
                    throw new Error(`Analysis failed: ${JSON.stringify(errorData)}`);
                }

                const analysisResult = await analysisResponse.json();
                console.log('Content analysis:', analysisResult);

                // Store note with analysis
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
                            secret_value: JSON.stringify(noteData),
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
                    throw new Error(`API returned ${response.status}: ${JSON.stringify(errorData)}`);
                }

                const result = await response.json();
                console.log('Store result:', result);
                return { result, analysis: analysisResult.analysis };
            } catch (error) {
                console.error('Error analyzing or storing note:', error);
                throw error;
            }
        } catch (error) {
            console.error('Error in storeNote:', error);
            throw error;
        }
    }

    async retrieveNote(userId, storeId, title) {
        try {
            const userSeed = `telegram_${userId}`;
            console.log(`Retrieving note. StoreID: ${storeId}, Title: ${title}`);

            const url = new URL(`${API_BASE}/api/secret/retrieve/${storeId}`);
            url.searchParams.append('retrieve_as_nillion_user_seed', userSeed);
            url.searchParams.append('secret_name', `note_${title}`);

            console.log('Request URL:', url.toString());
            
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API returned ${response.status}: ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            console.log('Retrieved note data:', data);
            return data;
        } catch (error) {
            console.error('Error retrieving note:', error);
            throw error;
        }
    }

    async listNotes(userId) {
        try {
            console.log(`Listing notes for app ID: ${this.appId}`);
            const response = await fetch(`${API_BASE}/api/apps/${this.appId}/store_ids`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API returned ${response.status}: ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            console.log('Store IDs response:', data);

            if (!data.store_ids) {
                console.log('No store IDs found');
                return [];
            }

            // Filter only notes
            const notes = data.store_ids
                .filter(item => item.secret_name.startsWith('note_'))
                .map(item => ({
                    title: item.secret_name.replace('note_', ''),
                    storeId: item.store_id,
                    secretName: item.secret_name
                }));

            console.log('Filtered notes:', notes);
            return notes;
        } catch (error) {
            console.error('Error listing notes:', error);
            throw error;
        }
    }
}

module.exports = new NillionService();
