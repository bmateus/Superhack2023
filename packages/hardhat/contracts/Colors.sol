// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// Useful for debugging. Remove when deploying to a live network.
import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Colors is ERC721, ERC721Enumerable, Ownable {
	//Max colors is 4096 (16x16x16)
	uint256 public constant MAX_COLORS = 4096;

	address public deployer;

	struct State {
		uint256 lastUsed;
		uint256 revenueShare;
	}

	mapping(uint256 => State) public colorData;

	//the max time a color can be unused before it can be "stolen"
	uint256 public constant MAX_UNUSED_TIME = 7 days;

	//the cost to purchase a color
	uint256 public constant PURCHASE_COST = 0.0005 ether;

	constructor() ERC721("Colors", "RGB") {
		//valid colors start at id 1 (actual color value is id-1 though)
		deployer = msg.sender;
		console.log("Created Colors");
	}

	function batchMint(uint256 amount) public {
		//only deployer
		if (msg.sender != deployer) revert("Only deployer can mint");

		uint256 startId = 1;

		uint256 totalSupply = totalSupply();

		//check that the amount is valid
		if (startId + totalSupply + amount > MAX_COLORS + 1)
			revert("Invalid amount");

		for (uint256 i = 0; i < amount; i++) {
			console.log("Minting: %d", startId + totalSupply + i);
			_safeMint(deployer, startId + totalSupply + i);
		}
	}

	function randomColorsAvailable() public view returns (uint256) {
		//returns how many colors are owned by the deployer
		return balanceOf(deployer);
	}

	//purchase a random color
	function purchaseRandomColor() public payable {
		//get all colors owned by deployer
		uint16[] memory colors = colorsOfOwner(deployer);

		if (colors.length == 0) revert("No colors left to purchase");

		//check that the sender has sent enough ether
		if (msg.value < PURCHASE_COST) revert("Insufficient funds");

		//choose a random color
		uint16 color = colors[
			uint256(
				keccak256(
					//abi.encodePacked(block.timestamp, block.prevrandao, colors.length)
					abi.encodePacked(block.timestamp, colors.length)
				)
			) % colors.length
		];

		// transfer that color to the sender
		transferFrom(deployer, msg.sender, color);
	}

	// purchase a specific color
	// can only be called if color is not owned by the deployer
	// and if the color has not been used within the time limit
	function purchaseColor(uint256 tokenId) public payable {
		//check that the color is valid
		if (tokenId < 1 || tokenId > MAX_COLORS) revert("Invalid color");

		//check that the sender has sent enough ether
		if (msg.value < PURCHASE_COST) revert("Insufficient funds");

		//check that the color is not owned by the deployer
		if (ownerOf(tokenId) == deployer) revert("Color owned by deployer"); //use purchaseRandomColor instead

		//check that the color has not been used within the time limit
		if (colorData[tokenId].lastUsed + MAX_UNUSED_TIME > block.timestamp)
			revert("Color recently used");

		//transfer the color to the sender
		transferFrom(deployer, msg.sender, tokenId);
	}

	function colorsOfOwner(
		address _owner
	) public view returns (uint16[] memory) {
		uint256 tokenCount = balanceOf(_owner);

		if (tokenCount == 0) {
			// Return an empty array
			return new uint16[](0);
		} else {
			uint16[] memory result = new uint16[](tokenCount);
			uint256 index;
			for (index = 0; index < tokenCount; index++) {
				result[index] = uint16(tokenOfOwnerByIndex(_owner, index));
			}
			return result;
		}
	}

	// The following functions are overrides required by Solidity.

	function _beforeTokenTransfer(
		address from,
		address to,
		uint256 tokenId,
		uint256 batchSize
	) internal override(ERC721, ERC721Enumerable) {
		super._beforeTokenTransfer(from, to, tokenId, batchSize);

		//send the pending revenue share to the current owner's address
	}

	function supportsInterface(
		bytes4 interfaceId
	) public view override(ERC721, ERC721Enumerable) returns (bool) {
		return super.supportsInterface(interfaceId);
	}
}
