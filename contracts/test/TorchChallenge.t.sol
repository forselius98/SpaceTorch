// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {SpaceTorch} from "../src/SpaceTorch.sol";
import {TorchChallenge} from "../src/TorchChallenge.sol";
import {MockVRFCoordinatorV2Plus} from "../src/mocks/MockVRFCoordinatorV2Plus.sol";

contract TorchChallengeTest is Test {
    SpaceTorch public token;
    TorchChallenge public game;
    MockVRFCoordinatorV2Plus public mockCoordinator;

    address public alice = address(0xA11CE);
    address public bob = address(0xB0B);

    uint256 public constant TOKENS = 100 * 10 ** 18;
    uint256 public constant PLAY_COST = 10 * 10 ** 18;

    uint256 public constant SUBSCRIPTION_ID = 1;
    bytes32 public constant KEY_HASH = bytes32(uint256(123));

    function setUp() public {
        token = new SpaceTorch();
        mockCoordinator = new MockVRFCoordinatorV2Plus();

        game = new TorchChallenge(
            address(token),
            address(mockCoordinator),
            SUBSCRIPTION_ID,
            KEY_HASH,
            3,
            200000
        );

        token.transfer(alice, TOKENS);
        token.transfer(bob, TOKENS);
    }

    // Starts a flip and asks the mock coordinator to fulfill it.
    // randomWord 0 = SUN, randomWord 1 = MOON.
    function _playFlip(address player, bool guessSun, bool shouldWin) internal {
        vm.startPrank(player);
        token.approve(address(game), PLAY_COST);
        game.startCoinFlip(guessSun);
        vm.stopPrank();
        uint256 requestId = mockCoordinator.lastRequestId();

        uint256 randomWord;

        if (shouldWin) {
            randomWord = guessSun ? 0 : 1;
        } else {
            randomWord = guessSun ? 1 : 0;
        }

        mockCoordinator.fulfillRandomWords(requestId, randomWord);
    }

    function test_StartCoinFlipBurns10Tokens() public {
        vm.startPrank(alice);
        token.approve(address(game), PLAY_COST);
        game.startCoinFlip(true);
        vm.stopPrank();

        assertEq(token.balanceOf(alice), 90 * 10 ** 18);
        assertTrue(game.hasPendingFlip(alice));
    }

    function test_CannotStartWithoutApproval() public {
        vm.prank(alice);
        vm.expectRevert();
        game.startCoinFlip(true);

        assertFalse(game.hasPendingFlip(alice));
        assertEq(token.balanceOf(alice), TOKENS);
    }

    function test_CannotStartTwoFlipsAtOnce() public {
        vm.startPrank(alice);
        token.approve(address(game), 2 * PLAY_COST);

        game.startCoinFlip(true);

        vm.expectRevert("Flip already pending");
        game.startCoinFlip(false);

        vm.stopPrank();
    }

    function test_CannotLaunchWithoutEnoughFuel() public {
        vm.prank(alice);
        vm.expectRevert("Not enough Rocket Fuel");
        game.launchRocket();

        assertEq(game.scores(alice), 0);
    }

    function test_FlipIsPendingUntilVRFFulfillment() public {
        vm.startPrank(alice);
        token.approve(address(game), PLAY_COST);
        game.startCoinFlip(true);
        vm.stopPrank();

        assertTrue(game.hasPendingFlip(alice));

        uint256 requestId = mockCoordinator.lastRequestId();

        mockCoordinator.fulfillRandomWords(requestId, 0);

        assertFalse(game.hasPendingFlip(alice));
    }

    function test_CannotStartNewFlipUntilPreviousIsFulfilled() public {
        vm.startPrank(alice);
        token.approve(address(game), 2 * PLAY_COST);

        game.startCoinFlip(true);

        vm.expectRevert("Flip already pending");
        game.startCoinFlip(false);

        vm.stopPrank();
    }

    function test_CanStartNewFlipAfterFulfillment() public {
        vm.startPrank(alice);
        token.approve(address(game), 2 * PLAY_COST);
        game.startCoinFlip(true);
        vm.stopPrank();

        uint256 firstRequestId = mockCoordinator.lastRequestId();
        mockCoordinator.fulfillRandomWords(firstRequestId, 0);

        vm.prank(alice);
        game.startCoinFlip(false);

        assertTrue(game.hasPendingFlip(alice));
        assertEq(mockCoordinator.lastRequestId(), firstRequestId + 1);
    }

    function test_OnlyCoordinatorCanFulfill() public {
        vm.startPrank(alice);
        token.approve(address(game), PLAY_COST);
        game.startCoinFlip(true);
        vm.stopPrank();

        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = 0;

        vm.prank(alice);

        (bool success, ) = address(game).call(
            abi.encodeWithSignature(
                "rawFulfillRandomWords(uint256,uint256[])",
                mockCoordinator.lastRequestId(),
                randomWords
            )
        );

        assertFalse(success, "Non-coordinator should not fulfill VRF");

        assertTrue(game.hasPendingFlip(alice));
        assertEq(game.fuelBalances(alice), 0);
    }

    function test_CannotFulfillSameRequestTwice() public {
        vm.startPrank(alice);
        token.approve(address(game), PLAY_COST);
        game.startCoinFlip(true);
        vm.stopPrank();

        uint256 requestId = mockCoordinator.lastRequestId();

        mockCoordinator.fulfillRandomWords(requestId, 0);

        vm.expectRevert("Unknown request");
        mockCoordinator.fulfillRandomWords(requestId, 0);
    }

    // Coin Flip rewards.

    function test_CoinFlipWinAwards10FuelForSun() public {
        _playFlip(alice, true, true);

        assertEq(game.fuelBalances(alice), 10);
        assertEq(game.totalWins(alice), 1);
    }

    function test_CoinFlipWinAwards10FuelForMoon() public {
        _playFlip(alice, false, true);

        assertEq(game.fuelBalances(alice), 10);
        assertEq(game.totalWins(alice), 1);
    }

    function test_CoinFlipLossAwardsNoFuel() public {
        _playFlip(alice, true, false);

        assertEq(game.fuelBalances(alice), 0);
        assertEq(game.totalWins(alice), 0);
    }

    function test_CoinFlipLossStillBurnsTokens() public {
        _playFlip(alice, true, false);

        assertEq(token.balanceOf(alice), 90 * 10 ** 18);
        assertEq(game.fuelBalances(alice), 0);
    }

    function test_BobCannotClaimAlicesRewards() public {
        _playFlip(alice, true, true);

        assertEq(game.fuelBalances(alice), 10);
        assertEq(game.fuelBalances(bob), 0);
    }

    // Expired Coin Flip recovery.

    function test_CannotCancelFlipWhenNoFlipIsPending() public {
        vm.prank(alice);
        vm.expectRevert("No pending flip");
        game.cancelExpiredFlip();
    }

    function test_CannotCancelFlipBefore24Hours() public {
        vm.startPrank(alice);
        token.approve(address(game), PLAY_COST);
        game.startCoinFlip(true);

        vm.warp(block.timestamp + 23 hours + 59 minutes);

        vm.expectRevert("Flip has not expired");
        game.cancelExpiredFlip();

        vm.stopPrank();

        assertTrue(game.hasPendingFlip(alice));
    }

    function test_CanCancelFlipAfter24Hours() public {
        vm.startPrank(alice);
        token.approve(address(game), PLAY_COST);
        game.startCoinFlip(true);

        vm.warp(block.timestamp + 24 hours);

        game.cancelExpiredFlip();
        vm.stopPrank();

        assertFalse(game.hasPendingFlip(alice));
        assertEq(game.pendingSince(alice), 0);
        assertEq(game.pendingRequestId(alice), 0);
    }

    function test_LateVRFResponseAfterCancellationAwardsNoFuel() public {
        vm.startPrank(alice);
        token.approve(address(game), PLAY_COST);
        game.startCoinFlip(true);
        vm.stopPrank();

        uint256 requestId = mockCoordinator.lastRequestId();

        vm.warp(block.timestamp + 24 hours);

        vm.prank(alice);
        game.cancelExpiredFlip();

        // Simulate a late successful VRF response.
        mockCoordinator.fulfillRandomWords(requestId, 0);

        assertFalse(game.hasPendingFlip(alice));
        assertEq(game.fuelBalances(alice), 0);
        assertEq(game.totalWins(alice), 0);
    }

    function test_CanStartNewFlipAfterCancellation() public {
        vm.startPrank(alice);
        token.approve(address(game), 2 * PLAY_COST);

        game.startCoinFlip(true);

        uint256 firstRequestId = mockCoordinator.lastRequestId();

        vm.warp(block.timestamp + 24 hours);

        game.cancelExpiredFlip();

        game.startCoinFlip(false);

        vm.stopPrank();

        assertTrue(game.hasPendingFlip(alice));
        assertEq(mockCoordinator.lastRequestId(), firstRequestId + 1);
    }

    // Rocket progression.

    function test_TenWinsAllowRocketLaunch() public {
        for (uint256 i = 0; i < 10; i++) {
            _playFlip(alice, true, true);
        }

        assertEq(game.fuelBalances(alice), 100);
        assertEq(game.totalWins(alice), 10);

        vm.prank(alice);
        game.launchRocket();

        assertEq(game.fuelBalances(alice), 0);
        assertEq(game.scores(alice), 100);
        assertEq(game.totalLaunches(alice), 1);
    }

    function test_RocketLaunchConsumes100FuelAndAwards100Points() public {
        for (uint256 i = 0; i < 10; i++) {
            _playFlip(alice, false, true);
        }

        vm.prank(alice);
        game.launchRocket();

        assertEq(game.fuelBalances(alice), 0);
        assertEq(game.scores(alice), 100);
        assertEq(game.totalLaunches(alice), 1);
    }

    function test_CannotLaunchTwiceWithSameFuel() public {
        for (uint256 i = 0; i < 10; i++) {
            _playFlip(alice, true, true);
        }

        vm.startPrank(alice);
        game.launchRocket();

        vm.expectRevert("Not enough Rocket Fuel");
        game.launchRocket();

        vm.stopPrank();

        assertEq(game.scores(alice), 100);
    }
}
