# Voting DApp

A decentralized voting application built with Next.js, Wagmi, and Solidity. Deployed on Vercel and Holesky network.

## 🌟 Features

- Complete and transparent voting system
- Modern and responsive user interface
- Admin-controlled voting workflows
- MetaMask and other Ethereum wallets support
- Real-time updates for votes and proposals
- Deployed on Vercel for optimal accessibility

## 🛠 Tech Stack

- **Frontend**:
  - Next.js 14 (App Router)
  - Wagmi/Viem for blockchain interactions
  - TailwindCSS & shadcn/ui for design
  - RainbowKit for wallet management

- **Backend**:
  - Solidity 0.8.28
  - Hardhat
  - OpenZeppelin Contracts

## 🚀 Deployment

- Frontend: [Vercel](https://your-app-url.vercel.app)
- Smart Contract: Holesky Network
  - Contract Address: `0x9c8ebb31d1E095Bb0d95B6c3f6E930E4AE115Db9`

## 🏁 Getting Started

1. Clone the repository:
```bash
git clone [REPO_URL]
```

2. Install dependencies:
```bash
# Frontend
cd frontend
npm install

# Backend
cd backend
npm install
```

3. Set up environment variables:
```bash
# Frontend
cp .env.example .env.local

# Backend
cp .env.example .env
```

4. Run the project locally:
```bash
# Frontend
npm run dev

# Backend (in another terminal)
npx hardhat node
npx hardhat run scripts/deploy.ts --network localhost
```

## 📝 Voting Workflow

1. Admin registers voters
2. Voters submit proposals
3. Voting session opens
4. Voting ends and tallying begins
5. Results are published

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License.
