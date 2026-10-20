# 🚀 SpaceTorch ($TORCH)
A space-themed meme token with an interactive Web3 gaming experience. 

SpaceTorch is a blockchain project built around a space-themed meme token. The project combines an ERC-20 token, a token faucet, and an interactive on-chain game where users spend TORCH tokens to earn points.

Network: Ethereum Sepolia Testnet
Token name: Space Torch
Token symbol: TORCH
Maximum supply: 1,000,000 TORCH

# Getting Started

## Prerequisites

Install the following tools:

Node.js

Foundry

MetaMask

You will also need Sepolia test ETH to pay for transaction gas fees.

1. Run the frontend

Open a terminal and navigate to the frontend directory:

cd spacetorch-app
npm install
npm run dev

Open http://localhost:3000 in your browser.

2. Run the smart contract tests

Open another terminal and navigate to the contracts directory:

cd contracts
forge install
forge build
forge test -vv

These commands install the project's Foundry dependencies, compile the contracts, and run the automated tests.

3. Configure MetaMask

Enable the Sepolia test network in MetaMask.

Select Sepolia as the active network.

Obtain Sepolia ETH from an available testnet faucet.

Open the SpaceTorch frontend and connect your wallet.

Never share your private key, recovery phrase, or deployment keystore password. Do not commit .env files or secrets to GitHub.

# 🧪 Testing

The smart contracts are tested with Foundry.

The token test suite covers functionality such as:

Initial token supply and metadata.

Owner-authorized minting.

Unauthorized minting attempts.

Maximum supply enforcement.

Token transfers.

Token burning.

Faucet claims and cooldown restrictions.

Faucet availability and edge cases.

The game contract should also be tested for successful plays, score updates, token approvals, insufficient balances, and invalid transactions.

Run the tests with:

forge test -vv

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

# ✨ Features

ERC-20 token: A custom token implemented using Solidity and OpenZeppelin.

Fixed maximum supply: The total supply cannot exceed 1,000,000 TORCH.

Owner-only minting: Only the contract owner can mint additional tokens, subject to the maximum supply.

Token burning: Token holders can burn their own tokens.

Token faucet: Users can claim 100 TORCH once every 24 hours per wallet, provided the faucet has sufficient tokens.

Torch Challenge: Spend 10 TORCH to play and earn one point.

Wallet connection: Connect MetaMask or another compatible injected wallet.

On-chain interactions: Token claims, approvals, and game actions interact with deployed smart contracts.

# 🪙 Tokenomics

SpaceTorch ($TORCH) is a space-themed meme token deployed on the Ethereum Sepolia testnet.

| Property | Value |
|---|---|
| Token Name | Space Torch |
| Token Symbol | TORCH |
| Blockchain | Ethereum Sepolia Testnet |
| Token Standard | ERC-20 |
| Decimals | 18 |
| Maximum Supply | 1,000,000 TORCH |
| Initial Total Supply | 900,000 TORCH |
| Owner Allocation | 800,000 TORCH |
| Faucet Allocation | 100,000 TORCH |
| Faucet Claim Amount | 100 TORCH |
| Faucet Cooldown | 24 hours |
| Torch Challenge Cost | 10 TORCH per play |
| Points per Play | 1 point |

### Token Distribution

The initial supply of 900,000 TORCH is distributed as follows:

- **Owner:** 800,000 TORCH
- **Faucet contract:** 100,000 TORCH

The maximum supply is capped at 1,000,000 TORCH. Only the contract owner can mint new tokens, and minting cannot exceed the maximum supply.

### Utility

TORCH is used within the SpaceTorch ecosystem:

- Claim test tokens through the faucet.
- Spend 10 TORCH to participate in the Torch Challenge.
- Earn one point for each successful game transaction.
- Burn tokens using the ERC-20 burn functionality.

**Network:** Ethereum Sepolia testnet. TORCH is a test token intended for educational purposes and has no intended real-world monetary value.

[View the SpaceTorch token on Sepolia Etherscan](https://sepolia.etherscan.io/address/0x5f8c9b79be6ddc16431cf0c90a5c75eb579cc01b)

# 📜 Smart Contracts

The smart contracts are deployed on Ethereum Sepolia.

SpaceTorch Token

- Address: 0x5f8c9b79bE6ddC16431cF0C90A5c75Eb579Cc01b

- View on Sepolia Etherscan

The token contract implements ERC-20 functionality, owner-controlled minting, burning, and the token faucet.

TorchChallenge

- Address: 0x61e0ae97280D77AdDf89a642d1300D4D4f8707A4

- View on Sepolia Etherscan

The game contract allows users to participate in the Torch Challenge. Each successful play costs 10 TORCH and increases the player's on-chain score by one point.

Players must approve the game contract to spend the required tokens before playing.

# 🎮 How to Play

1. Open the SpaceTorch website.

2. Connect MetaMask and select the Sepolia test network.

3. Claim 100 TORCH from the faucet if eligible.

4. Check your TORCH balance.

5. Approve the TorchChallenge contract to spend 10 TORCH.

6. Confirm the game transaction in your wallet.

7. Wait for the transaction to be confirmed.

8. Check your updated score and token balance.

Each successful play consumes 10 TORCH and awards one point. The game uses an on-chain transaction rather than simulating token usage in JavaScript.

## 🚰 How to Claim TORCH

The faucet allows users to obtain test tokens without asking the token owner directly.

1. Connect a wallet on Sepolia.

2. Click Claim Tokens.

3. Confirm the transaction in MetaMask.

4. Wait for the transaction to be confirmed.

5. Check your updated balance.

Each wallet can claim 100 TORCH once every 24 hours, subject to the faucet's available balance.

## 📁 Project Structure

The project contains separate smart contract and frontend applications.

SpaceTorch/
├── contracts/
│   ├── src/
│   ├── test/
│   ├── script/
│   ├── foundry.toml
│   └── README.md
│
└── spacetorch-app/
    ├── app/
    ├── public/
    ├── package.json
    └── ...

# 🎯 Project Goal

SpaceTorch was developed as part of an internship project focused on Solidity, smart contracts, and Web3 development.

The project demonstrates how a custom ERC-20 token can be combined with a frontend and an interactive smart contract to create a simple blockchain-based gaming experience.

The objective is to let users connect their wallets, obtain test tokens, and participate in an on-chain challenge.