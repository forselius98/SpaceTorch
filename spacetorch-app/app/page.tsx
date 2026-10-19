"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useChainId,
  useSwitchChain,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther } from "viem";
import {
  SEPOLIA_CHAIN_ID,
  SPACE_TORCH_ADDRESS,
  TORCH_CHALLENGE_ADDRESS,
  PLAY_COST,
  spaceTorchAbi,
  torchChallengeAbi,
} from "./contracts";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const [message, setMessage] = useState("");

  const onSepolia = chainId === SEPOLIA_CHAIN_ID;

  // Read the user's TORCH balance.
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: SPACE_TORCH_ADDRESS,
    abi: spaceTorchAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) && onSepolia },
  });

  // Read the player's score.
  const { data: score, refetch: refetchScore } = useReadContract({
    address: TORCH_CHALLENGE_ADDRESS,
    abi: torchChallengeAbi,
    functionName: "scores",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) && onSepolia },
  });

  // Check whether the game contract is approved to spend TORCH.
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: SPACE_TORCH_ADDRESS,
    abi: spaceTorchAbi,
    functionName: "allowance",
    args: address ? [address, TORCH_CHALLENGE_ADDRESS] : undefined,
    query: { enabled: Boolean(address) && onSepolia },
  });

  const {
    data: claimHash,
    writeContractAsync: sendClaim,
    isPending: isClaimPending,
  } = useWriteContract();

  const {
    data: approvalHash,
    writeContractAsync: sendApproval,
    isPending: isApprovalPending,
  } = useWriteContract();

  const {
    data: playHash,
    writeContractAsync: sendPlay,
    isPending: isPlayPending,
  } = useWriteContract();

  const claimReceipt = useWaitForTransactionReceipt({
    hash: claimHash,
    chainId: SEPOLIA_CHAIN_ID,
  });

  const approvalReceipt = useWaitForTransactionReceipt({
    hash: approvalHash,
    chainId: SEPOLIA_CHAIN_ID,
  });

  const playReceipt = useWaitForTransactionReceipt({
    hash: playHash,
    chainId: SEPOLIA_CHAIN_ID,
  });

  
  useEffect(() => {
    if (claimReceipt.isSuccess || playReceipt.isSuccess) {
      void refetchBalance();
    }

    if (approvalReceipt.isSuccess || playReceipt.isSuccess) {
      void refetchAllowance();
    }

    if (playReceipt.isSuccess) {
      void refetchScore();
    }
  }, [
    claimReceipt.isSuccess,
    approvalReceipt.isSuccess,
    playReceipt.isSuccess,
    refetchBalance,
    refetchAllowance,
    refetchScore,
  ]);

  async function claimFaucet() {
    if (!isConnected || !address) {
      setMessage("Connect our wallet first.");
      return;
    }

    if (!onSepolia) {
      setMessage("Change to Sepolia before collecting TORCH.");
      return;
    }

    try {
      setMessage("Confirm faucet-transaction in your wallet.");
      await sendClaim({
        address: SPACE_TORCH_ADDRESS,
        abi: spaceTorchAbi,
        functionName: "claimFaucet",
        chainId: SEPOLIA_CHAIN_ID,
      });
      setMessage("Transaction send. Wait for confrimation.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not get faucet-transaction.",
      );
    }
  }

  async function approveTokens() {
    if (!isConnected || !address || !onSepolia) {
      setMessage("Connect your wallet and choose Sepolia first.");
      return;
    }

    try {
      setMessage("Approve the use of 10 TORCH tokens in your wallet.");
      await sendApproval({
        address: SPACE_TORCH_ADDRESS,
        abi: spaceTorchAbi,
        functionName: "approve",
        args: [TORCH_CHALLENGE_ADDRESS, PLAY_COST],
        chainId: SEPOLIA_CHAIN_ID,
      });
      setMessage("Approval submitted. Waiting for confirmation...");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not approve TORCH.",
      );
    }
  }

  async function playChallenge() {
    if (!isConnected || !address || !onSepolia) {
      setMessage("Connect your wallet and select Sepolia first.");
      return;
    }

    if (balance === undefined || balance < PLAY_COST) {
      setMessage("You need at least 10 TORCH to play.");
      return;
    }

    if (allowance === undefined || allowance < PLAY_COST) {
      setMessage("Please approve the game to use 10 TORCH first.CH.");
      return;
    }

    try {
      setMessage("Confirm the game transaction in your wallet.");
      await sendPlay({
        address: TORCH_CHALLENGE_ADDRESS,
        abi: torchChallengeAbi,
        functionName: "play",
        chainId: SEPOLIA_CHAIN_ID,
      });
      setMessage("Game transaction submitted. Waiting for confirmation...");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not start the challenge.",
      );
    }
  }

  const busy =
  isClaimPending ||
  isApprovalPending ||
  isPlayPending ||
  claimReceipt.isLoading ||
  approvalReceipt.isLoading ||
  playReceipt.isLoading;

  return (
    <main
      className="min-h-screen overflow-hidden bg-cover bg-center bg-fixed text-white"
      style={{
        backgroundImage: "url('/Space.png')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
      }}
    >
      <nav className="flex items-center justify-between border-b border-white/10 bg-black/20 px-6 py-5 md:px-12">
        <a href="#" className="text-xl font-black tracking-wider text-cyan-300">
          🚀 SPACETORCH
        </a>

        {isConnected ? (
          <button
            onClick={() => disconnect()}
            className="rounded-full border border-cyan-300/50 px-5 py-2 text-sm hover:bg-cyan-300/10"
          >
            {address?.slice(0, 6)}...{address?.slice(-4)} · Disconnect
          </button>
        ) : (
          <button
            onClick={() => {
              const connector = connectors[0];
              if (connector) connect({ connector });
            }}
            disabled={isConnecting || connectors.length === 0}
            className="rounded-full bg-cyan-300 px-5 py-2 font-bold text-[#080b22] hover:bg-cyan-200 disabled:opacity-50"
          >
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </nav>

      <section className="relative mx-auto flex min-h-[75vh] max-w-6xl flex-col items-center justify-center px-6 py-20 text-center">
        <div className="pointer-events-none absolute left-[10%] top-20 h-40 w-40 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-16 right-[10%] h-52 w-52 rounded-full bg-cyan-500/20 blur-3xl" />

        <p className="mb-5 rounded-full border border-cyan-300/30 bg-black/40 px-4 py-2 text-sm tracking-widest text-cyan-200">
          YOUR JOURNEY STARTS HERE
        </p>
        <div className="mb-6 flex justify-center">
          <Image
          src="/Spacegirl.png"
          alt="SpaceTorch mascot holding a torch"
          width={320}
          height={320}
          priority
          className="h-auto w-48 drop-shadow-[0_0_30px_rgba(34,211,238,0.45)] md:w-64"
          />
        </div>

        <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">
          EXPLORE THE
          <span className="block text-cyan-300">SPACETORCH</span>
          UNIVERSE
        </h1>

        <p className="mt-6 max-w-xl rounded-xl bg-black/30 p-3 text-lg leading-8 text-slate-200">
          Claim your TORCH tokens, take on cosmic challenges, and begin your
          journey through the universe.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <a
            href="#faucet"
            className="rounded-full bg-cyan-300 px-7 py-3 font-bold text-[#080b22] transition hover:scale-105 hover:bg-cyan-200"
          >
            🔥 Get TORCH
          </a>
          <a
            href="#game"
            className="rounded-full border border-white/30 bg-black/20 px-7 py-3 font-bold transition hover:bg-white/10"
          >
            Play Challenge ↗
          </a>
        </div>

        <p className="mt-8 rounded-lg bg-black/40 px-4 py-2 text-sm text-slate-200">
          {!isConnected
            ? "Connect your wallet to get started."
            : !onSepolia
              ? "Wrong network. Switch to Sepolia to use SpaceTorch."
              : "Connected to Sepolia testnet"}
        </p>

        {isConnected && !onSepolia && (
          <button
            onClick={() => switchChain({ chainId: SEPOLIA_CHAIN_ID })}
            disabled={isSwitching}
            className="mt-3 rounded-full bg-cyan-300 px-5 py-2 font-bold text-[#080b22] disabled:opacity-50"
          >
            {isSwitching ? "Switching..." : "Switch to Sepolia"}
          </button>
        )}
      </section>

      <section id="faucet" className="mx-auto max-w-3xl px-6 py-12 text-center">
        <div className="rounded-3xl border border-cyan-300/30 bg-black/65 p-8 shadow-2xl backdrop-blur-sm">
          <h2 className="text-3xl font-bold">🔥 TORCH Faucet</h2>
          <p className="mt-4 text-slate-200">
            Claim 100 TORCH test tokens every 24 hours.
          </p>

          <p className="mt-5 text-lg">
            Your balance:{" "}
            <strong className="text-cyan-300">
              {balance !== undefined ? formatEther(balance) : "—"} TORCH
            </strong>
          </p>

          <button
            onClick={claimFaucet}
            disabled={!isConnected || !onSepolia || busy}
            className="mt-6 rounded-full bg-cyan-300 px-7 py-3 font-bold text-[#080b22] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isClaimPending || claimReceipt.isLoading
              ? "Claiming..."
              : "Claim 100 TORCH"}
          </button>
        </div>
      </section>

      <section id="game" className="mx-auto max-w-3xl px-6 py-12 text-center">
        <div className="rounded-3xl border border-purple-300/30 bg-black/65 p-8 shadow-2xl backdrop-blur-sm">
          <h2 className="text-3xl font-bold">🕹️ Torch Challenge</h2>
          <p className="mt-4 text-slate-200">
            Each round costs 10 TORCH, which the game contract burns.
          </p>

          <p className="mt-5 text-lg">
            Your score:{" "}
            <strong className="text-cyan-300">
              {score !== undefined ? score.toString() : "—"}
            </strong>
          </p>

          <p className="mt-2 text-sm text-slate-300">
            Approved for game:{" "}
            {allowance !== undefined ? `${formatEther(allowance)} TORCH` : "—"}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={approveTokens}
              disabled={
                !isConnected ||
                !onSepolia ||
                busy ||
                (allowance !== undefined && allowance >= PLAY_COST)
              }
              className="rounded-full border border-cyan-300/60 px-6 py-3 font-bold hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isApprovalPending || approvalReceipt.isLoading
                ? "Approving..."
                : "Approve 10 TORCH"}
            </button>

            <button
              onClick={playChallenge}
              disabled={
                !isConnected ||
                !onSepolia ||
                busy ||
                balance === undefined ||
                balance < PLAY_COST ||
                allowance === undefined ||
                allowance < PLAY_COST
              }
              className="rounded-full bg-purple-400 px-7 py-3 font-bold text-[#160a2c] hover:bg-purple-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPlayPending || playReceipt.isLoading
                ? "Playing..."
                : "Play Challenge · 10 TORCH"}
            </button>
          </div>
        </div>
      </section>

      {message && (
        <div
          role="status"
          aria-live="polite"
          className="mx-auto mb-8 max-w-2xl wrap-break-word rounded-xl border border-white/20 bg-black/80 px-5 py-4 text-center text-sm text-white"
        >
          {message}
        </div>
      )}

      <footer className="border-t border-white/10 bg-black/30 px-6 py-6 text-center text-sm text-slate-300">
        SpaceTorch · TORCH · Built for the stars ✨
      </footer>
    </main>
  );
}
