/* SPDX-License-Identifier: UNLICENSED */
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {UniswapV2Factory} from "@uniswap/v2-core/contracts/UniswapV2Factory.sol";
import {UniswapV2Router02} from "@uniswap/v2-periphery/contracts/UniswapV2Router02.sol";
import {Token} from "./Token.sol";
import {WTIA} from "./WNATIVE.sol";

contract DeployV2 is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        vm.startBroadcast(pk);

        // If WTIA_ADDRESS env is set to a non-zero address, use it. Otherwise deploy WTIA for testnet.
        address wtiaAddr = vm.envAddress("WTIA_ADDRESS");
        if (wtiaAddr == address(0)) {
            WTIA wtia = new WTIA();
            wtiaAddr = address(wtia);
        }

        // Factory (feeToSetter = deployer)
        UniswapV2Factory factory = new UniswapV2Factory(deployer);

        // Router with WTIA as the wrapped native
        UniswapV2Router02 router = new UniswapV2Router02(address(factory), wtiaAddr);

        // Demo token for testing. Replace with your real token in production.
        Token ytk = new Token(1_000_000e18);

        vm.stopBroadcast();

        console2.log("WTIA   :", wtiaAddr);
        console2.log("Factory:", address(factory));
        console2.log("Router :", address(router));
        console2.log("YTK    :", address(ytk));
    }
}


