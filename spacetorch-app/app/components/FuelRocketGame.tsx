
"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useChainId,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther } from "viem";

import {
  SEPOLIA_CHAIN_ID,
  SPACE_TORCH_ADDRESS,
  TORCH_CHALLENGE_ADDRESS,
  spaceTorchAbi,
  torchChallengeAbi,
} from "../contracts";

const FUEL_TO_LAUNCH = 100;
const POINTS_PER_LEVEL = 100;

type FuelRocketGameProps = {
  challengeScore: number;
};

export default function FuelRocketGame({
  challengeScore,
}: FuelRocketGameProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const onSepolia = chainId === SEPOLIA_CHAIN_ID;

  const enabled = Boolean(address) && onSepolia;

  // Read TORCH balance
  const {
    data: torchBalance,
    refetch: refetchTorchBalance,
  } = useReadContract({
    address: SPACE_TORCH_ADDRESS,
    abi: spaceTorchAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled,
      refetchInterval: 5000,
    },
  });

  // Read Rocket Fuel
  const {
    data: onChainFuel,
    refetch: refetchFuel,
  } = useReadContract({
    address: TORCH_CHALLENGE_ADDRESS,
    abi: torchChallengeAbi,
    functionName: "fuelBalances",
    args: address ? [address] : undefined,
    query: {
      enabled,
      refetchInterval: 5000,
    },
  });

  // Read Coin Flip wins
  const {
    data: onChainWins,
    refetch: refetchWins,
  } = useReadContract({
    address: TORCH_CHALLENGE_ADDRESS,
    abi: torchChallengeAbi,
    functionName: "totalWins",
    args: address ? [address] : undefined,
    query: {
      enabled,
      refetchInterval: 5000,
    },
  });

  // Read Rocket launches
  const {
    data: onChainLaunches,
    refetch: refetchLaunches,
  } = useReadContract({
    address: TORCH_CHALLENGE_ADDRESS,
    abi: torchChallengeAbi,
    functionName: "totalLaunches",
    args: address ? [address] : undefined,
    query: {
      enabled,
      refetchInterval: 5000,
    },
  });

  // Read game score
  const {
    data: onChainScore,
    refetch: refetchScore,
  } = useReadContract({
    address: TORCH_CHALLENGE_ADDRESS,
    abi: torchChallengeAbi,
    functionName: "scores",
    args: address ? [address] : undefined,
    query: {
      enabled,
      refetchInterval: 5000,
    },
  });

  // Check whether a Coin Flip is waiting for Chainlink VRF
  const { data: hasPendingFlip } = useReadContract({
    address: TORCH_CHALLENGE_ADDRESS,
    abi: torchChallengeAbi,
    functionName: "hasPendingFlip",
    args: address ? [address] : undefined,
    query: {
      enabled,
      refetchInterval: 5000,
    },
  });

  // Launch Rocket transaction
  const {
    writeContractAsync,
    data: launchHash,
    isPending: isLaunchPending,
  } = useWriteContract();

  const launchReceipt = useWaitForTransactionReceipt({
    hash: launchHash,
    chainId: SEPOLIA_CHAIN_ID,
  });

  const fuel = Number(onChainFuel ?? 0);
const launches = Number(onChainLaunches ?? 0);
const coinWins = Number(onChainWins ?? 0);

  const displayedChallengeScore =
    onChainScore !== undefined
      ? Number(onChainScore)
      : Math.max(0, challengeScore);

  const totalPoints = displayedChallengeScore;
  const level = Math.floor(totalPoints / POINTS_PER_LEVEL) + 1;
  const pointsIntoLevel = totalPoints % POINTS_PER_LEVEL;

  const fuelProgress = Math.min(
    (fuel / FUEL_TO_LAUNCH) * 100,
    100,
  );

  const [rocketLaunching, setRocketLaunching] = useState(false);
  const [message, setMessage] = useState(
    "Choose Sun or Moon in Coin Flip to collect Rocket Fuel!",
  );

  const busy = isLaunchPending || launchReceipt.isLoading;

  // Refresh contract data after a successful rocket launch
  useEffect(() => {
    if (!launchReceipt.isSuccess) return;

    setRocketLaunching(true);
    setMessage("3... 2... 1... LIFTOFF! 🚀");

    void Promise.all([
      refetchFuel(),
      refetchLaunches(),
      refetchScore(),
      refetchWins(),
      refetchTorchBalance(),
    ]);

    const timer = window.setTimeout(() => {
      setRocketLaunching(false);
      setMessage("Mission complete! Keep exploring the galaxy!");
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [
    launchReceipt.isSuccess,
    refetchFuel,
    refetchLaunches,
    refetchScore,
    refetchWins,
    refetchTorchBalance,
  ]);

  async function launchRocket() {
    if (!address || !onSepolia) {
      setMessage("Connect your wallet and select Sepolia first.");
      return;
    }

    if (fuel < FUEL_TO_LAUNCH) {
      setMessage("You need 100 Rocket Fuel to launch.");
      return;
    }

    if (hasPendingFlip) {
      setMessage("Please wait for your pending Coin Flip result.");
      return;
    }

    if (busy || rocketLaunching) return;

    try {
      setMessage("Confirm the Rocket Launch transaction in your wallet.");

      await writeContractAsync({
        address: TORCH_CHALLENGE_ADDRESS,
        abi: torchChallengeAbi,
        functionName: "launchRocket",
        chainId: SEPOLIA_CHAIN_ID,
      });

      setMessage("Rocket launch submitted. Waiting for confirmation...");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not launch the rocket.",
      );
    }
  }

  return (
    <section
      id="fuel-rocket"
      className="mx-auto w-full max-w-4xl rounded-3xl border border-cyan-300/30 bg-black/75 p-6 text-white shadow-2xl backdrop-blur-sm sm:p-8"
    >
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-300">
          SpaceTorch Mission Control
        </p>

        <h2 className="mt-3 text-3xl font-black sm:text-4xl">
          🚀 Fuel the Rocket
        </h2>

        <p className="mx-auto mt-3 max-w-xl text-slate-300">
          Win Coin Flip rounds, collect Rocket Fuel, launch your rocket,
          and level up with your Torch Challenge score.
        </p>
      </div>

      {/* TORCH balance */}
      <div className="mt-6 rounded-2xl border border-cyan-300/30 bg-slate-900/80 p-4 text-center">
        <p className="text-sm text-slate-300">Your TORCH Balance</p>

        <p className="mt-1 text-2xl font-black text-cyan-300">
          {torchBalance !== undefined
            ? Number(formatEther(torchBalance)).toLocaleString(
                undefined,
                { maximumFractionDigits: 2 },
              )
            : "—"}{" "}
          TORCH
        </p>

        {!isConnected && (
          <p className="mt-2 text-xs text-slate-400">
            Connect your wallet to see your balance.
          </p>
        )}

        {isConnected && !onSepolia && (
          <p className="mt-2 text-xs text-amber-300">
            Please switch your wallet to Sepolia.
          </p>
        )}
      </div>

      {/* Game statistics */}
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Rocket Fuel"
          value={`${fuel}/${FUEL_TO_LAUNCH}`}
        />
        <Stat
          label="Rocket Launches"
          value={String(launches)}
        />
        <Stat
          label="Total Points"
          value={String(totalPoints)}
        />
        <Stat
          label="Pilot Level"
          value={String(level)}
        />
      </div>

      {/* Progress bars */}
      <div className="mt-6 rounded-2xl bg-slate-900 p-4">
        <div className="mb-2 flex justify-between gap-3 text-sm">
          <span className="text-slate-300">Fuel Tank</span>
          <span className="font-bold text-cyan-300">
            {Math.round(fuelProgress)}%
          </span>
        </div>

        <div className="h-4 overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full rounded-full bg-linear-to-r from-cyan-400 to-purple-500 transition-all duration-500"
            style={{ width: `${fuelProgress}%` }}
          />
        </div>

        <div className="mb-2 mt-5 flex justify-between gap-3 text-sm">
          <span className="text-slate-300">
            Progress to Level {level + 1}
          </span>
          <span className="font-bold text-purple-300">
            {pointsIntoLevel}/{POINTS_PER_LEVEL} points
          </span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full rounded-full bg-purple-400 transition-all duration-500"
            style={{ width: `${pointsIntoLevel}%` }}
          />
        </div>
      </div>

      {/* Scores and wins */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-purple-300/20 bg-purple-950/30 p-4">
          <p className="text-sm text-slate-300">
            Torch Challenge Score
          </p>
          <p className="mt-1 text-2xl font-black text-purple-300">
            {displayedChallengeScore}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Read directly from your Sepolia smart contract.
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-950/30 p-4">
          <p className="text-sm text-slate-300">Coin Flip Wins</p>
          <p className="mt-1 text-2xl font-black text-cyan-300">
            {coinWins}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Each win earns 10 Rocket Fuel.
          </p>
        </div>
      </div>

      {/* Rocket animation */}
      <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/80 p-5 text-center">
        <div className="relative mt-4 flex h-64 items-end justify-center overflow-hidden rounded-2xl bg-linear-to-b from-indigo-950 via-slate-950 to-black">
          <span className="absolute left-[15%] top-[20%] animate-pulse text-cyan-200">
            ✦
          </span>
          <span className="absolute left-[75%] top-[30%] animate-pulse text-purple-300">
            ✦
          </span>
          <span className="absolute right-[20%] top-[65%] animate-pulse text-white">
            ✧
          </span>
          <span className="absolute left-[35%] top-[45%] animate-pulse text-blue-300">
            ✧
          </span>

          {rocketLaunching && (
            <>
              <div className="absolute bottom-8 h-24 w-8 animate-pulse rounded-full bg-orange-400 blur-md" />
              <div className="absolute bottom-8 h-20 w-4 rounded-full bg-yellow-200 blur-sm" />
              <span className="absolute bottom-5 left-[42%] animate-ping text-2xl">
                ✨
              </span>
              <span className="absolute bottom-10 right-[40%] animate-ping text-xl">
                ✨
              </span>
            </>
          )}

          <div
            className={`relative z-10 text-7xl ${
              rocketLaunching
                ? "animate-rocket-launch"
                : "translate-y-0"
            }`}
          >
            🚀
          </div>

          {rocketLaunching && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="animate-pulse text-xl font-black tracking-widest text-cyan-200">
                LIFTOFF!
              </span>
            </div>
          )}
        </div>

        <p className="mt-4 font-semibold text-slate-200">
          {hasPendingFlip
            ? "Waiting for Chainlink VRF..."
            : "Choose SUN or MOON in Coin Flip above"}
        </p>

        <p aria-live="polite" className="mt-4 min-h-12 text-sm text-slate-300">
          {message}
        </p>

        <p className="text-xs text-slate-400">
          Each correct Coin Flip earns 10 Fuel. Collect 100 Fuel to launch
          your rocket and earn 100 points.
        </p>

        {fuel >= FUEL_TO_LAUNCH && (
          <div className="mt-5 rounded-2xl border border-cyan-300/30 bg-cyan-400/10 p-5">
            <p className="text-xl font-black text-cyan-300">
              Fuel tank full!
            </p>

            <p className="mt-2 text-sm text-slate-300">
              Your rocket is ready for launch.
            </p>

            <button
              type="button"
              onClick={launchRocket}
              disabled={
                !isConnected ||
                !onSepolia ||
                busy ||
                rocketLaunching ||
                Boolean(hasPendingFlip)
              }
              className="mt-4 w-full rounded-xl bg-linear-to-r from-cyan-500 to-purple-600 px-5 py-3 font-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLaunchPending
                ? "Confirm in wallet..."
                : launchReceipt.isLoading
                  ? "Launching..."
                  : `🚀 LAUNCH ROCKET · +${POINTS_PER_LEVEL} POINTS`}
            </button>
          </div>
        )}
      </div>

      {/* Contract statistics */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          Total coin wins:{" "}
          <span className="font-bold text-cyan-300">
            {coinWins}
          </span>
        </p>

        <p className="text-sm text-slate-400">
          Rocket launches:{" "}
          <span className="font-bold text-cyan-300">
            {launches}
          </span>
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-slate-500">
        Rocket Fuel and rocket points are game resources, not TORCH tokens.
        Your progress is stored on the Sepolia blockchain.
      </p>
    </section>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-4 text-center">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 wrap-break-word text-2xl font-black text-cyan-300">
        {value}
      </p>
    </div>
  );
}

