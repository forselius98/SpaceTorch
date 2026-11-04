
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {
    VRFV2PlusClient
} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

interface IVRFMockConsumer {
    function rawFulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) external;
}

contract MockVRFCoordinatorV2Plus {
    uint256 public lastRequestId;

    mapping(uint256 => address) public consumers;

    event RandomWordsRequested(
        uint256 indexed requestId,
        address indexed consumer
    );

    function requestRandomWords(
        VRFV2PlusClient.RandomWordsRequest calldata
    ) external returns (uint256 requestId) {
        lastRequestId++;

        requestId = lastRequestId;
        consumers[requestId] = msg.sender;

        emit RandomWordsRequested(requestId, msg.sender);
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256 randomWord
    ) external {
        address consumer = consumers[requestId];

        require(consumer != address(0), "Unknown request");

        delete consumers[requestId];

        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = randomWord;

        IVRFMockConsumer(consumer).rawFulfillRandomWords(
            requestId,
            randomWords
        );
    }
}
