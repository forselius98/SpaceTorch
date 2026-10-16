
 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SpaceTorch} from "./SpaceTorch.sol";

contract TorchChallenge {
    SpaceTorch public immutable token;

    uint256 public constant PLAY_COST = 10 * 10 ** 18;

    mapping(address => uint256) public scores;

    event ChallengePlayed(
        address indexed player,
        uint256 points,
        uint256 tokensBurned
    );

    constructor(address tokenAddress) {
        require(tokenAddress != address(0), "Invalid token address");
        token = SpaceTorch(tokenAddress);
    }

    function play() external {
        token.burnFrom(msg.sender, PLAY_COST);

        scores[msg.sender] += 1;

        emit ChallengePlayed(msg.sender, 1, PLAY_COST);
    }
}
