/* SPDX-License-Identifier: MIT */
pragma solidity ^0.8.20;

contract Token {
    string public name = "YourToken";
    string public symbol = "YTK";
    uint8  public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    event Transfer(address indexed from, address indexed to, uint256 v);
    event Approval(address indexed o, address indexed s, uint256 v);

    constructor(uint256 supply) {
        totalSupply = supply;
        balanceOf[msg.sender] = supply;
        emit Transfer(address(0), msg.sender, supply);
    }
    function approve(address s, uint256 v) external returns (bool) {
        allowance[msg.sender][s] = v; emit Approval(msg.sender, s, v); return true;
    }
    function transfer(address to, uint256 v) external returns (bool) {
        return _transfer(msg.sender, to, v);
    }
    function transferFrom(address f, address to, uint256 v) external returns (bool) {
        uint256 a = allowance[f][msg.sender]; require(a >= v, "allow");
        allowance[f][msg.sender] = a - v; return _transfer(f, to, v);
    }
    function _transfer(address f, address to, uint256 v) internal returns (bool) {
        require(balanceOf[f] >= v, "bal");
        unchecked { balanceOf[f] -= v; balanceOf[to] += v; }
        emit Transfer(f, to, v); return true;
    }
}
