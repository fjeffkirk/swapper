/* SPDX-License-Identifier: UNLICENSED */
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {IERC20} from "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import {UniswapV2Router02} from "@uniswap/v2-periphery/contracts/UniswapV2Router02.sol";

contract SwapOneHop is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address trader = vm.addr(pk);

        address routerAddr = vm.envAddress("ROUTER");
        address ytk = vm.envAddress("YTK");

        UniswapV2Router02 router = UniswapV2Router02(payable(routerAddr));

        vm.startBroadcast(pk);

        // TIA -> YTK
        address[] memory path1 = new address[](2);
        path1[0] = router.WETH(); // WTIA
        path1[1] = ytk;
        router.swapExactETHForTokens{value: 1 ether}(
            0, path1, trader, block.timestamp + 3600
        );

        // YTK -> TIA (approve then swap back)
        IERC20(ytk).approve(routerAddr, 1_000e18);
        address[] memory path2 = new address[](2);
        path2[0] = ytk;
        path2[1] = router.WETH(); // WTIA
        router.swapExactTokensForETH(
            100e18, 0, path2, trader, block.timestamp + 3600
        );

        vm.stopBroadcast();
    }
}


