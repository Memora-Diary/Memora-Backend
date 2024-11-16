# 🌟 Memora Backend

Memora is a blockchain-powered platform that helps users preserve and manage their digital legacy through smart contracts, AI-driven analysis, and secure data storage.

## 🚀 Core Features

### 1. Smart Contract Integration
- **NFT-Based Triggers**: Create and manage conditional NFT transfers
- **BTC Escrow System**: Secure Bitcoin transactions with conditional releases
- **Multi-Chain Support**: Integration with Rootstock, Optimism, Sepolia, and Polygon Amoy

### 2. AI Services
- **Intelligent Analysis**: AI-powered analysis of user content and conditions
- **Personalized Diary Questions**: Dynamic question generation based on user goals
- **Sentiment Analysis**: Advanced content evaluation for trigger conditions

### 3. Secure Communication
- **Push Protocol Integration**: Real-time notifications for important events
- **Telegram Bot**: Interactive diary entries and user engagement
- **Nillion Network**: Encrypted and secure note storage

### 4. Data Management
- **Database Services**: Robust data persistence with Sequelize
- **User Management**: Comprehensive user tracking and preferences
- **Activity Monitoring**: Automated cron processes for user engagement

## 🛠 Technical Stack

- **Backend**: Node.js with Express
- **Database**: Sequelize ORM
- **Blockchain**: Ethers.js for Web3 integration
- **AI**: OpenAI integration
- **Security**: Nillion Network for encrypted storage
- **Messaging**: Push Protocol & Telegram Bot API

## 📋 Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/your-repo/memora-backend.git
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. Initialize database:
```bash
npx sequelize-cli db:migrate
```

5. Start the server:
```bash
npm start
```

## 🔧 Configuration

### Environment Variables
```env
TELEGRAM_BOT_TOKEN=your_telegram_token
JUDGE_PRIVATE_KEY=your_private_key
OPENAI_API_KEY=your_openai_key
NILLION_APP_ID=your_nillion_id
PUSH_CHANNEL_ADDRESS=your_push_address
```

### Database Configuration
```javascript
// config/config.js
module.exports = {
  development: {
    // Your development database config
  },
  production: {
    // Your production database config
  }
}
```

## 📚 API Documentation

### NFT Management
- `POST /finetune-neg`: Fine-tune negative feedback for NFT conditions
- `GET /getContacts/:ownerAddress`: Retrieve user contacts

### Telegram Bot Endpoints
- `GET /telegram/status`: Check bot status
- `POST /telegram/update-questions`: Update daily questions
- `GET /telegram/minters`: List active minters
- `POST /telegram/minters`: Add new minter
- `DELETE /telegram/minters/:address`: Remove minter

### Push Notifications
- `POST /webhook/push`: Handle push notification events
- `GET /webhook/push/test`: Test push notification endpoint

### AI Analysis
- `POST /webhook/analysis`: Process content analysis
- `GET /webhook/analysis/test`: Test analysis endpoint

## 🔐 Security Features

- Encrypted note storage via Nillion Network
- Secure blockchain transactions
- Protected API endpoints
- Environment-based configurations
- Error handling and monitoring

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.


