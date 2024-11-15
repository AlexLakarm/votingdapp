# Voting DApp

A complete decentralized voting application with a smart contract backend and a modern web frontend.

## 🏗 Project Structure

### `/backend`
- Smart Contract development with Solidity
- Testing environment with Hardhat
- OpenZeppelin contracts for security
- Deployment scripts for local and Holesky networks

### `/frontend`
- Modern web interface built with Next.js 14
- Real-time blockchain interactions
- Responsive and intuitive UI
- Deployed on Vercel

## 🛠 Tech Stack

### Smart Contract (Backend)
- Solidity ^0.8.28
- Hardhat
- OpenZeppelin Contracts
- TypeScript for testing
- Ethers.js

### Web Interface (Frontend)
- Next.js 14 (App Router)
- TypeScript
- Wagmi/Viem for blockchain interactions
- TailwindCSS
- shadcn/ui components
- RainbowKit for wallet connection

## 🚀 Live Demo

Visit the live application: [Voting DApp on Vercel](https://your-app-url.vercel.app)

Contract deployed on Holesky testnet: `0x...`

## 🏁 Quick Start

1. Clone the repository:
```bash
git clone [REPO_URL]
```

2. Install dependencies and start local development:
```bash
# Backend setup
cd backend
npm install
npx hardhat node
npx hardhat run scripts/deploy.ts --network localhost

# Frontend setup
cd frontend
npm install
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## 📝 Features

- Complete voting workflow management
- Secure voter registration
- Proposal submission system
- Real-time vote tracking
- Automated vote tallying
- Admin dashboard
- Responsive design

## 🔐 Security

- Role-based access control
- OpenZeppelin secure contracts
- Transaction confirmation system
- Error handling and input validation

## 📄 License

This project is licensed under the MIT License. 