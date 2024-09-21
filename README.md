# Memora Backend

This repository contains the backend code for the Memora project, our blockchain-powered platform to help you manage and preserve your online presence for future generations.

## Overview

The backend is built around four main services:

1. AI Service
2. Warpcast Service
3. Chain Service
4. Database Service

It provides endpoints for authentication and fine-tuning, as well as a core cron process for monitoring user activity and interact with the Rootstock blockchain.

## Services

### AI Service

Located in `services/ai.js`, this service interacts with our own Gaia Network AI model (using the OpenAI API) to analyze user posts and determine if specific life events have occurred.

### Warpcast Service

Located in `services/warpcast.js`, this service interacts with the Farcaster social media platform. It fetches user posts and sends direct messages.

### Chain Service

Located in `services/chain.js`, this service interacts with the Rootstock BTC L2 Blockchain to read and interact with the Memora contract.

### Database Service

Located in `services/db.js`, this service manages the local SQLite database, storing user information and triggers.

## API Endpoints

- `POST /finetune-neg`: Endpoint for fine-tuning negative feedback for a user
- `POST /world_coin/verify`: Endpoint for World Coin verification 


## Dependencies

- express
- node-cron
- axios
- ethers
- sqlite3
- openai (custom configuration for Gaia)

## Note

This README provides an overview of the backend structure. For detailed information about other components of Memora, please refer to the main [Github Organization](https://github.com/Memora-eth).
