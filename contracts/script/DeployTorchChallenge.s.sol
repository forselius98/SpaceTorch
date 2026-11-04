
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {TorchChallenge} from "../src/TorchChallenge.sol";

contract DeployTorchChallenge is Script {
    function run() external {
        address tokenAddress =
            0x5f8c9b79bE6ddC16431cF0C90A5c75Eb579Cc01b;

        // Sepolia Chainlink VRF v2.5 Coordinator
        address vrfCoordinator =
            0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B;

        // VRF Subscription ID
        uint256 subscriptionId = 92859835232878739568986617284085235009712607320123208216616590778636062812530;

        // Sepolia VRF key hash
        bytes32 keyHash =
            0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;

        uint16 requestConfirmations = 3;
        uint32 callbackGasLimit = 200000;

        vm.startBroadcast();

        TorchChallenge game = new TorchChallenge(
            tokenAddress,
            vrfCoordinator,
            subscriptionId,
            keyHash,
            requestConfirmations,
            callbackGasLimit
        );

        vm.stopBroadcast();

        console2.log("TorchChallenge address:", address(game));
        console2.log("Token address:", address(game.token()));
        console2.log("VRF Coordinator:", vrfCoordinator);
        console2.log("Subscription ID:", subscriptionId);
    }
}

