// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {SpaceTorch} from "../src/SpaceTorch.sol";
import {TorchChallenge} from "../src/TorchChallenge.sol";

contract DeploySpaceTorch is Script {
    function run() external {
        // Existing SpaceTorch token on Sepolia.
        address tokenAddress = 0x5f8c9b79bE6ddC16431cF0C90A5c75Eb579Cc01b;

        // Chainlink VRF v2.5 Coordinator on Sepolia.
        address coordinatorAddress = 0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B;

        // Existing Chainlink VRF subscription.
        uint256 subscriptionId = 92859835232878739568986617284085235009712607320123208216616590778636062812530;

        // Existing VRF configuration.
        bytes32 keyHash = 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;

        uint16 requestConfirmations = 3;
        uint32 callbackGasLimit = 200000;

        vm.startBroadcast();

        // Connect to the existing token.
        SpaceTorch token = SpaceTorch(tokenAddress);

        // Deploy the new TorchChallenge contract.
        TorchChallenge challenge = new TorchChallenge(
            tokenAddress,
            coordinatorAddress,
            subscriptionId,
            keyHash,
            requestConfirmations,
            callbackGasLimit
        );

        vm.stopBroadcast();

        console2.log("Existing SpaceTorch address:", address(token));
        console2.log("Token name:", token.name());
        console2.log("Token symbol:", token.symbol());

        console2.log("New TorchChallenge address:", address(challenge));

        console2.log("Chainlink Subscription ID:", subscriptionId);
    }
}
