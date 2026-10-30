"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useChainId,
  useReadContract,
  usePublicClient,
} from "wagmi";

import {
  SEPOLIA_CHAIN_ID,
  SPACE_TORCH_ADDRESS,
  TORCH_CHALLENGE_ADDRESS,
  PLAY_COST,
  spaceTorchAbi,
  torchChallengeAbi,
} from "../contracts";

const FUEL_TO_LAUNCH = 100;
const FUEL_PER_WIN = 10;
const STREAK_BONUS = 10;
const BONUS_EVERY_STREAK = 3;
const POINTS_PER_WIN = 10;
const POINTS_PER_LAUNCH = 100;
const POINTS_PER_LEVEL = 100;

type FuelRocketGameProps = {
  challengeScore: number;
};

export default function FuelRocketGame({
  challengeScore,
}: FuelRocketGameProps) {
   const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const onSepolia = chainId === SEPOLIA_CHAIN_ID;
const { data: onChainScore } = useReadContract({
  address: TORCH_CHALLENGE_ADDRESS,
  abi: torchChallengeAbi,
  functionName: "scores",
  args: address ? [address] : undefined,
  query: {
    enabled: Boolean(address) && onSepolia,
  },
});
  const { data: torchBalance } = useReadContract({
  address: SPACE_TORCH_ADDRESS,
  abi: spaceTorchAbi,
  functionName: "balanceOf",
  args: address ? [address] : undefined,
  query: {
    enabled: Boolean(address) && onSepolia,
  },
});

  const [fuel, setFuel] = useState(0);
  const [streak, setStreak] = useState(0);
  const [launches, setLaunches] = useState(0);
  const [coinWins, setCoinWins] = useState(0);
  const [, setChoice] = useState<"SUN" | "MOON" | null>(null);
  const [result, setResult] = useState<"SUN" | "MOON" | null>(null);
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [message, setMessage] = useState(
    "Choose Sun or Moon to collect Rocket Fuel!",
  );
  const [rocketLaunching, setRocketLaunching] = useState(false);

  function getSavedNumber(key: string): number {
    if (typeof window === "undefined") return 0;

    const value = Number(localStorage.getItem(key) ?? 0);
    return Number.isFinite(value) && value >= 0 ? value : 0;
  }

  // Load saved mini-game progress after the first render. Scheduling the
  // updates avoids setting state synchronously inside the effect and keeps
  // the server and initial client render consistent in Next.js.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setFuel(getSavedNumber("st-fuel"));
      setStreak(getSavedNumber("st-streak"));
      setLaunches(getSavedNumber("st-launches"));
      setCoinWins(getSavedNumber("st-coin-wins"));
      setHydrated(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  // Save progress only after the saved values have been loaded, so the
  // initial zero values do not overwrite the user's existing progress.
  useEffect(() => {
    if (!hydrated) return;

    localStorage.setItem("st-fuel", String(fuel));
    localStorage.setItem("st-streak", String(streak));
    localStorage.setItem("st-launches", String(launches));
    localStorage.setItem("st-coin-wins", String(coinWins));
  }, [fuel, streak, launches, coinWins, hydrated]);

  // Challenge points come from the existing Sepolia contract.
  // Rocket points and wins are local frontend progress.
  const displayedChallengeScore =
  onChainScore !== undefined
    ? Number(onChainScore)
    : Math.max(0, challengeScore);

const totalPoints =
  displayedChallengeScore +
  launches * POINTS_PER_LAUNCH +
  coinWins * POINTS_PER_WIN;

  const level = Math.floor(totalPoints / POINTS_PER_LEVEL) + 1;
  const pointsIntoLevel = totalPoints % POINTS_PER_LEVEL;
  const fuelProgress = Math.min((fuel / FUEL_TO_LAUNCH) * 100, 100);

  function flipCoin(guess: "SUN" | "MOON") {
    if (busy || fuel >= FUEL_TO_LAUNCH) return;

    setBusy(true);
    setChoice(guess);
    setResult(null);
    setMessage("Flipping the cosmic coin...");

    window.setTimeout(() => {
      const coinResult = Math.random() < 0.5 ? "SUN" : "MOON";
      const won = guess === coinResult;

      setResult(coinResult);

      if (won) {
        const newStreak = streak + 1;
        const bonus = newStreak % BONUS_EVERY_STREAK === 0 ? STREAK_BONUS : 0;
        const earnedFuel = FUEL_PER_WIN + bonus;

        setFuel((current) => Math.min(FUEL_TO_LAUNCH, current + earnedFuel));
        setStreak(newStreak);
        setCoinWins((current) => current + 1);

        setMessage(
          `Correct! +${earnedFuel} Rocket Fuel and +${POINTS_PER_WIN} points!${
            bonus > 0 ? " Streak bonus unlocked!" : ""
          }`,
        );
      } else {
        setStreak(0);
        setMessage("Not this time, space pilot! Try again.");
      }

      setBusy(false);
    }, 600);
  }

  function launchRocket() {
    if (fuel < FUEL_TO_LAUNCH || busy || rocketLaunching) return;

    setRocketLaunching(true);
    setFuel(0);
    setStreak(0);
    setLaunches((current) => current + 1);
    setChoice(null);
    setResult(null);
    setMessage("3... 2... 1... LIFTOFF! 🚀");

    window.setTimeout(() => {
      setRocketLaunching(false);
      setMessage(
        `Mission complete! +${POINTS_PER_LAUNCH} points. Keep exploring the galaxy!`,
      );
    }, 1800);
  }

  function resetRocketProgress() {
    if (busy) return;

    setFuel(0);
    setStreak(0);
    setLaunches(0);
    setCoinWins(0);
    setChoice(null);
    setResult(null);
    setMessage(
      "Rocket progress reset. Your TORCH balance and contract score are unchanged.",
    );

    // Clear only this mini-game's saved progress.
    localStorage.removeItem("st-fuel");
    localStorage.removeItem("st-streak");
    localStorage.removeItem("st-launches");
    localStorage.removeItem("st-coin-wins");
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
          Win Coin Flip rounds, collect fuel, launch your rocket, and level up
          with your Torch Challenge score.
        </p>
      
      </div>

      {/* TORCH balance from Sepolia */}
      <div className="mt-6 rounded-2xl border border-cyan-300/30 bg-slate-900/80 p-4 text-center">
        <p className="text-sm text-slate-300">
          Your TORCH Balance
        </p>

        <p className="mt-1 text-2xl font-black text-cyan-300">
          {torchBalance !== undefined
            ? (Number(torchBalance) / 1e18).toLocaleString()
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

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">

        <Stat label="Rocket Fuel" value={`${fuel}/${FUEL_TO_LAUNCH}`} />
        <Stat label="Rocket Launches" value={String(launches)} />
        <Stat label="Total Points" value={String(totalPoints)} />
        <Stat label="Pilot Level" value={String(level)} />
      </div>

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

        <div className="mt-5 mb-2 flex justify-between gap-3 text-sm">
          <span className="text-slate-300">Progress to Level {level + 1}</span>
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

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-purple-300/20 bg-purple-950/30 p-4">
          <p className="text-sm text-slate-300">Torch Challenge Score</p>
          <p className="mt-1 text-2xl font-black text-purple-300">
            {displayedChallengeScore}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Read from your existing game contract on Sepolia.
          </p>
        </div>
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-950/30 p-4">
          <p className="text-sm text-slate-300">Coin Flip Win Streak</p>
          <p className="mt-1 text-2xl font-black text-cyan-300">{streak}</p>
          <p className="mt-1 text-xs text-slate-400">
            Every 3 consecutive wins earns bonus fuel.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/80 p-5 text-center">
        <div className="relative mt-4 flex h-64 items-end justify-center overflow-hidden rounded-2xl bg-linear-to-b from-indigo-950 via-slate-950 to-black">
          {/* Stjärnor */}
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

          {/* Eld under raketen */}
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

          {/* Raketenanimation */}
          <div
            className={`relative z-10 text-7xl ${
              rocketLaunching ? "animate-rocket-launch" : "translate-y-0"
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
        <p className="font-semibold text-slate-200">
          {busy ? "Flipping the cosmic coin..." : "Choose your side"}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => flipCoin("SUN")}
            disabled={busy || fuel >= FUEL_TO_LAUNCH}
            className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-5 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="block text-4xl">☀️</span>
            <span className="mt-2 block font-black tracking-widest">SUN</span>
          </button>

          <button
            type="button"
            onClick={() => flipCoin("MOON")}
            disabled={busy || fuel >= FUEL_TO_LAUNCH}
            className="rounded-2xl border border-indigo-400/40 bg-indigo-500/10 p-5 transition hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="block text-4xl">🌙</span>
            <span className="mt-2 block font-black tracking-widest">MOON</span>
          </button>
        </div>

        {result && (
          <p className="mt-5 text-lg font-bold">
            The coin landed on <span className="text-cyan-300">{result}!</span>
          </p>
        )}

        <p aria-live="polite" className="mt-4 min-h-12 text-sm text-slate-300">
          {message}
        </p>

        <p className="text-xs text-slate-400">
          Correct guess: +{FUEL_PER_WIN} Fuel and +{POINTS_PER_WIN} points.
          Every {BONUS_EVERY_STREAK} consecutive wins: +{STREAK_BONUS} bonus
          Fuel.
        </p>

        {fuel >= FUEL_TO_LAUNCH && (
          <div className="mt-5 rounded-2xl border border-cyan-300/30 bg-cyan-400/10 p-5">
            <p className="text-xl font-black text-cyan-300">Fuel tank full!</p>
            <p className="mt-2 text-sm text-slate-300">
              Your rocket is ready for launch.
            </p>
            <button
              type="button"
              onClick={launchRocket}
              className="mt-4 w-full rounded-xl bg-linear-to-r from-cyan-500 to-purple-600 px-5 py-3 font-black transition hover:brightness-110"
            >
              🚀 LAUNCH ROCKET · +{POINTS_PER_LAUNCH} POINTS
            </button>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          Total coin wins:{" "}
          <span className="font-bold text-cyan-300">{coinWins}</span>
        </p>
        <button
          type="button"
          onClick={resetRocketProgress}
          disabled={busy}
          className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-40"
        >
          Reset Rocket Progress
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-slate-500">
        Rocket Fuel and rocket points are game-only resources. They are not
        $TORCH tokens. Resetting rocket progress does not reset your contract
        score.
      </p>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-4 text-center">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 wrap-break-word text-2xl font-black text-cyan-300">
        {value}
      </p>
    </div>
  );
}
