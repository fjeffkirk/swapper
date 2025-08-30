// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IUniswapV2Factory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

interface IUniswapV2Pair {
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function token0() external view returns (address);
    function token1() external view returns (address);
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
    function mint(address to) external returns (uint liquidity);
    function transfer(address to, uint value) external returns (bool);
    function balanceOf(address owner) external view returns (uint);
}

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IWETH {
    function deposit() external payable;
    function transfer(address to, uint value) external returns (bool);
    function withdraw(uint) external;
}

contract SecureUniswapV2Router {
    address public immutable factory;
    address public immutable WETH;

    // Known secure pair for validation - hardcoded for security
    address public immutable SECURE_PAIR = 0xC4334574aEc2177Dda5D975B1d1F246a0a6c1Ff7;

    // Supported tokens - hardcoded for security
    address public immutable YTK = 0x00822A3c6CA0E9944B3fc4b79849fa20037fa2C6;

    modifier ensure(uint deadline) {
        require(block.timestamp <= deadline, 'SecureRouter: EXPIRED');
        _;
    }

    constructor(address _factory, address _WETH) {
        factory = _factory;
        WETH = _WETH;
    }

    receive() external payable {}

    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts) {
        require(path.length == 2, 'SecureRouter: ONLY_DIRECT_SWAPS_SUPPORTED');
        require(path[0] == WETH, 'SecureRouter: INVALID_PATH');
        require(path[1] == YTK, 'SecureRouter: ONLY_YTK_SUPPORTED');

        amounts = new uint[](2);
        amounts[0] = amountIn;

        (uint reserveIn, uint reserveOut) = getReserves(path[0], path[1]);
        amounts[1] = getAmountOut(amounts[0], reserveIn, reserveOut);
    }

    function getReserves(address tokenA, address tokenB) internal view returns (uint reserveA, uint reserveB) {
        address pair = IUniswapV2Factory(factory).getPair(tokenA, tokenB);
        require(pair != address(0), 'SecureRouter: PAIR_NOT_FOUND');

        // Security: Only allow our known secure pair
        require(pair == SECURE_PAIR, 'SecureRouter: UNAUTHORIZED_PAIR');

        IUniswapV2Pair pairContract = IUniswapV2Pair(pair);
        (uint reserve0, uint reserve1,) = pairContract.getReserves();
        address token0 = pairContract.token0();

        (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    }

    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) internal pure returns (uint amountOut) {
        require(amountIn > 0, 'SecureRouter: INSUFFICIENT_INPUT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'SecureRouter: INSUFFICIENT_LIQUIDITY');

        uint amountInWithFee = amountIn * 997;
        uint numerator = amountInWithFee * reserveOut;
        uint denominator = (reserveIn * 1000) + amountInWithFee;

        amountOut = numerator / denominator;
    }

    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable ensure(deadline) returns (uint[] memory amounts) {
        require(path.length == 2, 'SecureRouter: ONLY_DIRECT_SWAPS_SUPPORTED');
        require(path[0] == WETH, 'SecureRouter: INVALID_PATH');
        require(path[1] == YTK, 'SecureRouter: ONLY_YTK_SUPPORTED');

        amounts = getAmountsOut(msg.value, path);
        require(amounts[1] >= amountOutMin, 'SecureRouter: INSUFFICIENT_OUTPUT_AMOUNT');

        // Security: Validate pair
        address pair = IUniswapV2Factory(factory).getPair(path[0], path[1]);
        require(pair == SECURE_PAIR, 'SecureRouter: UNAUTHORIZED_PAIR');

        // Wrap ETH to WETH
        IWETH(WETH).deposit{value: msg.value}();

        // Transfer WETH to pair
        IERC20(WETH).transfer(pair, amounts[0]);

        // Execute swap
        IUniswapV2Pair pairContract = IUniswapV2Pair(pair);
        (uint amount0Out, uint amount1Out) = path[0] == pairContract.token0()
            ? (uint(0), amounts[1])
            : (amounts[1], uint(0));

        pairContract.swap(amount0Out, amount1Out, to, new bytes(0));
    }

    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable ensure(deadline) returns (uint amountToken, uint amountETH, uint liquidity) {
        require(token == YTK, 'SecureRouter: ONLY_YTK_SUPPORTED');

        // Security: Validate pair
        address pair = IUniswapV2Factory(factory).getPair(WETH, token);
        require(pair == SECURE_PAIR, 'SecureRouter: UNAUTHORIZED_PAIR');

        // Wrap ETH to WETH
        IWETH(WETH).deposit{value: msg.value}();

        // Transfer WETH to pair
        IERC20(WETH).transfer(pair, msg.value);

        // Transfer tokens to pair (need approval from user first)
        IERC20(token).transferFrom(msg.sender, pair, amountTokenDesired);

        // Mint LP tokens
        IUniswapV2Pair pairContract = IUniswapV2Pair(pair);
        liquidity = pairContract.mint(to);

        // Get actual amounts used
        (uint reserve0, uint reserve1,) = pairContract.getReserves();
        address token0 = pairContract.token0();

        if (token0 == WETH) {
            amountETH = msg.value;
            amountToken = amountTokenDesired;
        } else {
            amountETH = amountTokenDesired;
            amountToken = msg.value;
        }

        // Refund excess tokens if any
        if (amountToken > amountTokenDesired) {
            IERC20(token).transfer(msg.sender, amountToken - amountTokenDesired);
        }
        if (amountETH > msg.value) {
            IWETH(WETH).withdraw(amountETH - msg.value);
            payable(msg.sender).transfer(amountETH - msg.value);
        }
    }

    // Security function to verify pair authenticity
    function verifyPair(address tokenA, address tokenB) external view returns (bool isSecure, address pairAddress) {
        pairAddress = IUniswapV2Factory(factory).getPair(tokenA, tokenB);
        isSecure = (pairAddress == SECURE_PAIR);
    }
}
