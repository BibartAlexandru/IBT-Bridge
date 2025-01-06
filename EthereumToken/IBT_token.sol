// SPDX-License-Identifier: UNLICENSED 
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract IBTToken is ERC20{

    address deployer_address;

    constructor() public ERC20("IBT Token","IBT"){
        deployer_address = msg.sender;
    }

    function hasTokens(uint256 amount) public view returns (bool){
        return balanceOf(address(msg.sender)) >= amount;
    }

    function hasTokensDeployer(address account, uint256 amount) public view returns (bool){
        if(msg.sender != deployer_address)
            return false;
        return balanceOf(account) >= amount;
    }

    function burnFromPerson(address from, uint256 amount) public{
        if(msg.sender != deployer_address || !hasTokensDeployer(from,amount)){
            return;
        }
        _burn(from,amount);
    }

    function mintToPerson(address to, uint256 amount) public{
        if(msg.sender != deployer_address){
            return;
        }
        _mint(to, amount);
    }
}
