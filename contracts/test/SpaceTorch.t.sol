// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {SpaceTorch} from "../src/SpaceTorch.sol";

contract SpaceTorchTest is Test {
    SpaceTorch public token;

    address public owner;
    address public alice = address(0xA11CE);
    address public bob = address(0xB0B);

    uint256 public constant INITIAL_SUPPLY = 900_000 * 10 ** 18;
    uint256 public constant MAX_SUPPLY = 1_000_000 * 10 ** 18;

    function setUp() public {
        token = new SpaceTorch();
        owner = address(this);
    }

    function test_InitialSupply() public view {
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
        assertEq(token.balanceOf(owner), 800_000 * 10 ** 18);
        assertEq(token.balanceOf(address(token)), 100_000 * 10 ** 18);
        assertEq(token.name(), "Space Torch");
        assertEq(token.symbol(), "TORCH");
    }

    function test_OwnerCanMint() public {
        token.mint(alice, 100 * 10 ** 18);
        assertEq(token.balanceOf(alice), 100 * 10 ** 18);
        assertEq(token.totalSupply(), INITIAL_SUPPLY + 100 * 10 ** 18);
    }

    function test_NonOwnerCannotMint() public {
        vm.prank(alice);
        vm.expectRevert();
        token.mint(bob, 100 * 10 ** 18);
    }

    function test_CannotExceedMaxSupply() public {
        token.mint(alice, MAX_SUPPLY - INITIAL_SUPPLY);

        vm.expectRevert(bytes("SpaceTorch: Max supply exceeded"));
        token.mint(alice, 1);
    }

    function test_BurnTokens() public {
        token.transfer(alice, 100 * 10 ** 18);

        vm.prank(alice);
        token.burn(40 * 10 ** 18);

        assertEq(token.balanceOf(alice), 60 * 10 ** 18);
        assertEq(token.totalSupply(), INITIAL_SUPPLY - 40 * 10 ** 18);
    }

    function test_TransferTokens() public {
        token.transfer(alice, 50 * 10 ** 18);
        assertEq(token.balanceOf(alice), 50 * 10 ** 18);
    }

    function test_ClaimFaucet() public {
        vm.warp(2 days);

        vm.prank(alice);
        token.claimFaucet();

        assertEq(token.balanceOf(alice), 100 * 10 ** 18);
        assertEq(token.balanceOf(address(token)), 99_900 * 10 ** 18);
    }

    function test_CannotClaimFaucetTwice() public {
        vm.warp(2 days);

        vm.prank(alice);
        token.claimFaucet();

        vm.prank(alice);
        vm.expectRevert(bytes("SpaceTorch: Wait 24 hours"));
        token.claimFaucet();
    }

    function test_CanClaimFaucetAfter24Hours() public {
        vm.warp(2 days);

        vm.prank(alice);
        token.claimFaucet();

        vm.warp(3 days + 1);

        vm.prank(alice);
        token.claimFaucet();

        assertEq(token.balanceOf(alice), 200 * 10 ** 18);
    }

   
function test_CannotClaimWhenFaucetIsEmpty() public {
    vm.warp(2 days);

    deal(
        address(token),
        address(token),
        0,
        true
    );

    vm.prank(alice);
    vm.expectRevert(bytes("SpaceTorch: Faucet empty"));
    token.claimFaucet();
}

}
