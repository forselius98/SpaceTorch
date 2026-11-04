
import { parseEther } from "viem";

export const SEPOLIA_CHAIN_ID = 11155111;

export const SPACE_TORCH_ADDRESS =
  "0x5f8c9b79bE6ddC16431cF0C90A5c75Eb579Cc01b" as const;

export const TORCH_CHALLENGE_ADDRESS =
  "0x358f90d2B4CFC4f4c389eAeD6050b7abe8154f55" as const;

export const FAUCET_AMOUNT = parseEther("100");
export const PLAY_COST = parseEther("10");

export const spaceTorchAbi = [
  {
    type: "function",
    name: "claimFaucet",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "lastFaucetClaim",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export const torchChallengeAbi = [
  {
    type: "function",
    name: "startCoinFlip",
    stateMutability: "nonpayable",
    inputs: [{ name: "guessSun", type: "bool" }],
    outputs: [{ name: "requestId", type: "uint256" }],
  },
  {
    type: "function",
    name: "launchRocket",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "scores",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "fuelBalances",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalWins",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalLaunches",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "hasPendingFlip",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

