// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {TorchChallenge} from "../src/TorchChallenge.sol";

contract DeployTorchChallenge is Script {
    function run() external {
        address tokenAddress =
            0x5f8c9b79bE6ddC16431cF0C90A5c75Eb579Cc01b;

        vm.startBroadcast();
        TorchChallenge game = new TorchChallenge(tokenAddress);
        vm.stopBroadcast();

        console2.log("TorchChallenge address:", address(game));
        console2.log("Token address:", address(game.token()));
    }
}
