// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {SpaceTorch} from "../src/SpaceTorch.sol";
import {TorchChallenge} from "../src/TorchChallenge.sol";

contract TorchChallengeTest is Test {
    SpaceTorch public token;
    TorchChallenge public game;

    address public alice = address(0xA11CE);

    uint256 public constant TOKENS = 100 * 10 ** 18;
    uint256 public constant PLAY_COST = 10 * 10 ** 18;

    function setUp() public {
        token = new SpaceTorch();
        game = new TorchChallenge(address(token));

        // Give Alice 100 TORCH from owner
        token.transfer(alice, TOKENS);
    }

    function test_PlayBurns10TokensAndAddsPoint() public {
        vm.startPrank(alice);

        token.approve(address(game), PLAY_COST);
        game.play();

        vm.stopPrank();

        assertEq(token.balanceOf(alice), 90 * 10 ** 18);
        assertEq(game.scores(alice), 1);
    }

    function test_PlayTwiceAddsTwoPoints() public {
        vm.startPrank(alice);

        token.approve(address(game), 2 * PLAY_COST);
        game.play();
        game.play();

        vm.stopPrank();

        assertEq(token.balanceOf(alice), 80 * 10 ** 18);
        assertEq(game.scores(alice), 2);
    }

    function test_CannotPlayWithoutApproval() public {
        vm.prank(alice);
        vm.expectRevert();
        game.play();

        assertEq(game.scores(alice), 0);
    }

    function test_CannotPlayWithoutEnoughTokens() public {
        vm.startPrank(alice);

        token.approve(address(game), PLAY_COST);
        token.transfer(address(0xB0B), 95 * 10 ** 18);

        vm.expectRevert();
        game.play();

        vm.stopPrank();

        assertEq(game.scores(alice), 0);
    }
}
