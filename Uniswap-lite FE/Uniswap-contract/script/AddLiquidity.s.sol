/* SPDX-License-Identifier: UNLICENSED */
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {IERC20} from "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import {UniswapV2Router02} from "@uniswap/v2-periphery/contracts/UniswapV2Router02.sol";

contract AddLiquidity is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        address routerAddr = vm.envAddress("ROUTER");
        address ytk = vm.envAddress("YTK");

        UniswapV2Router02 router = UniswapV2Router02(payable(routerAddr));

        // Approve YTK once
        IERC20(ytk).approve(routerAddr, type(uint256).max);

        vm.startBroadcast(pk);

        // Add liquidity using native TIA; router wraps to WTIA under the hood.
        router.addLiquidityETH{value: 10 ether}(
            ytk,
            10_000e18,     // amountTokenDesired
            0,             // amountTokenMin
            0,             // amountETHMin
            deployer,
            block.timestamp + 3600
        );

        vm.stopBroadcast();
    }
}


