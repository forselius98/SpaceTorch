// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

contract SpaceTorch is ERC20, ERC20Burnable, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000 * 10 ** 18;

    uint256 public constant FAUCET_AMOUNT = 100 * 10 ** 18;
    uint256 public constant FAUCET_INTERVAL = 24 hours;

    mapping(address => uint256) public lastFaucetClaim;

    event FaucetClaimed(address indexed user, uint256 amount);

    constructor() ERC20("Space Torch", "TORCH") Ownable(msg.sender) {
        // 800,000 TORCH to owner
        _mint(msg.sender, 800_000 * 10 ** 18);

        // 100,000 TORCH reserveras för faucet
        _mint(address(this), 100_000 * 10 ** 18);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(
            totalSupply() + amount <= MAX_SUPPLY,
            "SpaceTorch: Max supply exceeded"
        );

        _mint(to, amount);
    }

    function claimFaucet() external {
        require(
            lastFaucetClaim[msg.sender] == 0 ||
                block.timestamp >=
                lastFaucetClaim[msg.sender] + FAUCET_INTERVAL,
            "SpaceTorch: Wait 24 hours"
        );

        require(
            balanceOf(address(this)) >= FAUCET_AMOUNT,
            "SpaceTorch: Faucet empty"
        );

        lastFaucetClaim[msg.sender] = block.timestamp;

        _transfer(address(this), msg.sender, FAUCET_AMOUNT);

        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
    }
}
