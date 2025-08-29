/* SPDX-License-Identifier: UNLICENSED */
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {UniswapV2Pair} from "@uniswap/v2-core/contracts/UniswapV2Pair.sol";

/// @notice Prints the creation-code hash for UniswapV2Pair. Copy this into UniswapV2Library.INIT_CODE_HASH
contract PairHash is Script {
    function run() external {
        bytes32 hash = keccak256(type(UniswapV2Pair).creationCode);
        console2.logBytes32(hash);
    }
}


