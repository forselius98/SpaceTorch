
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SpaceTorch} from "./SpaceTorch.sol";

import {
    VRFConsumerBaseV2Plus
} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";

import {
    VRFV2PlusClient
} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

contract TorchChallenge is VRFConsumerBaseV2Plus {
    SpaceTorch public immutable token;

    uint256 public immutable subscriptionId;
    bytes32 public immutable keyHash;
    uint16 public immutable requestConfirmations;
    uint32 public immutable callbackGasLimit;

    uint32 public constant NUM_WORDS = 1;

    uint256 public constant PLAY_COST = 10 * 10 ** 18;
    uint256 public constant FUEL_PER_WIN = 10;
    uint256 public constant FUEL_TO_LAUNCH = 100;
    uint256 public constant POINTS_PER_LAUNCH = 100;

    // A pending Coin Flip can be cancelled after 24 hours.
    uint256 public constant FLIP_TIMEOUT = 24 hours;

    mapping(address => uint256) public scores;
    mapping(address => uint256) public fuelBalances;
    mapping(address => uint256) public totalWins;
    mapping(address => uint256) public totalLaunches;

    // Pending Coin Flip information.
    mapping(address => bool) public hasPendingFlip;
    mapping(address => uint256) public pendingSince;
    mapping(address => uint256) public pendingRequestId;

    struct PendingFlip {
        address player;
        bool guessSun;
        bool exists;
    }

    mapping(uint256 => PendingFlip) public pendingRequests;

    event CoinFlipStarted(
        address indexed player,
        uint256 indexed requestId,
        bool guessSun
    );

    event CoinFlipResolved(
        address indexed player,
        uint256 indexed requestId,
        bool guessSun,
        bool resultSun,
        bool won,
        uint256 fuelAwarded
    );

    event ExpiredFlipCancelled(
        address indexed player,
        uint256 indexed requestId
    );

    event RocketLaunched(
        address indexed player,
        uint256 fuelUsed,
        uint256 pointsEarned
    );

    constructor(
        address tokenAddress,
        address coordinatorAddress,
        uint256 subscriptionId_,
        bytes32 keyHash_,
        uint16 requestConfirmations_,
        uint32 callbackGasLimit_
    ) VRFConsumerBaseV2Plus(coordinatorAddress) {
        require(tokenAddress != address(0), "Invalid token address");
        require(subscriptionId_ != 0, "Invalid subscription ID");
        require(keyHash_ != bytes32(0), "Invalid key hash");
        require(requestConfirmations_ > 0, "Invalid confirmations");
        require(callbackGasLimit_ > 0, "Invalid callback gas");

        token = SpaceTorch(tokenAddress);

        subscriptionId = subscriptionId_;
        keyHash = keyHash_;
        requestConfirmations = requestConfirmations_;
        callbackGasLimit = callbackGasLimit_;
    }

    // Start a Coin Flip and burn 10 TORCH.
    // guessSun = true means SUN, false means MOON.
    function startCoinFlip(bool guessSun)
        external
        returns (uint256 requestId)
    {
        require(!hasPendingFlip[msg.sender], "Flip already pending");

        // Mark the player as having a pending flip.
        hasPendingFlip[msg.sender] = true;

        // Burn 10 TORCH tokens.
        token.burnFrom(msg.sender, PLAY_COST);

        // Request a random number from Chainlink VRF.
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: NUM_WORDS,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({
                        nativePayment: true
                    })
                )
            })
        );

        require(
            !pendingRequests[requestId].exists,
            "Request already exists"
        );

        // Store the pending request.
        pendingRequests[requestId] = PendingFlip({
            player: msg.sender,
            guessSun: guessSun,
            exists: true
        });

        // Store when the flip started and its request ID.
        pendingSince[msg.sender] = block.timestamp;
        pendingRequestId[msg.sender] = requestId;

        emit CoinFlipStarted(msg.sender, requestId, guessSun);
    }

    // Called by the Chainlink VRF Coordinator.
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) internal override {
        PendingFlip memory pending = pendingRequests[requestId];

        // Ignore unknown or already cancelled requests.
        if (!pending.exists) {
            return;
        }

        require(randomWords.length > 0, "Missing random word");

        // Clear pending information.
        delete pendingRequests[requestId];
        hasPendingFlip[pending.player] = false;
        delete pendingSince[pending.player];
        delete pendingRequestId[pending.player];

        // Determine the result.
        bool resultSun = randomWords[0] % 2 == 0;
        bool won = pending.guessSun == resultSun;

        uint256 fuelAwarded = 0;

        // Award Rocket Fuel if the player wins.
        if (won) {
            fuelBalances[pending.player] += FUEL_PER_WIN;
            totalWins[pending.player] += 1;
            fuelAwarded = FUEL_PER_WIN;
        }

        emit CoinFlipResolved(
            pending.player,
            requestId,
            pending.guessSun,
            resultSun,
            won,
            fuelAwarded
        );
    }

    // Cancel a Coin Flip that has been pending for at least 24 hours.
    function cancelExpiredFlip() external {
        require(
            hasPendingFlip[msg.sender],
            "No pending flip"
        );

        require(
            block.timestamp >= pendingSince[msg.sender] + FLIP_TIMEOUT,
            "Flip has not expired"
        );

        uint256 requestId = pendingRequestId[msg.sender];

        // Remove the old pending request.
        delete pendingRequests[requestId];
        delete hasPendingFlip[msg.sender];
        delete pendingSince[msg.sender];
        delete pendingRequestId[msg.sender];

        emit ExpiredFlipCancelled(msg.sender, requestId);
    }

    // Spend 100 Rocket Fuel and earn 100 points.
    function launchRocket() external {
        require(
            fuelBalances[msg.sender] >= FUEL_TO_LAUNCH,
            "Not enough Rocket Fuel"
        );

        fuelBalances[msg.sender] -= FUEL_TO_LAUNCH;
        scores[msg.sender] += POINTS_PER_LAUNCH;
        totalLaunches[msg.sender] += 1;

        emit RocketLaunched(
            msg.sender,
            FUEL_TO_LAUNCH,
            POINTS_PER_LAUNCH
        );
    }
}



