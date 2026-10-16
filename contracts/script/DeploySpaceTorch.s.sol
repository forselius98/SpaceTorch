// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {SpaceTorch} from "../src/SpaceTorch.sol";
import {TorchChallenge} from "../src/TorchChallenge.sol";

contract DeploySpaceTorch is Script {
    function run() external {
        vm.startBroadcast();

        SpaceTorch token = new SpaceTorch();

        TorchChallenge game = new TorchChallenge(address(token));

        vm.stopBroadcast();

        console2.log("SpaceTorch address:", address(token));
        console2.log("TorchChallenge address:", address(game));
    }
}
