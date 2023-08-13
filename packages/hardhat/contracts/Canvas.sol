// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
//import "@openzeppelin/contracts/utils/Base64.sol";
//import "./Colors.sol";

// Splatter Party Canvas v0.1.0 - Superhack 2023

contract Canvas is ERC721, ERC721Holder, Ownable {
	using Counters for Counters.Counter;
	using Strings for uint256;
	using Strings for uint16;

	// canvas dimensions
	uint256 public constant CANVAS_WIDTH = 64;
	uint256 public constant CANVAS_HEIGHT = 64;

	// the minimum amount of time before this canvas can be locked
	// and a new one can be created
	uint256 public constant MINIMUM_UNLOCK_TIME = 8 hours;

	//canvas state
	uint256 public constant NUM_PIXELS = CANVAS_WIDTH * CANVAS_HEIGHT;

	struct State {
		uint256 createdTime;
		string title;
		bool locked;
		uint16[NUM_PIXELS] iColor;
		string svg;
		mapping(address => uint256) contributions;
		address[] contributors;
	}

	//Colors public colorsContract;

	mapping(uint256 => State) public canvasData;

	Counters.Counter private tokenIdCounter;

	string lockedTokenURI = "ipfs://QmdGou6abaRtYAnN2oqoF9K4WurAb8rS7FymwAepFiqch2";

	error InvalidTokenID(uint256 tokenID);
	error CanvasIsLocked(uint256 tokenID);
	error NotReadyToLock(uint256 tokenID);
	error ColorNotOwnedByAddress(uint256 color, address owner);
	error InvalidPixelOffset(uint16 offset);
	error OnlyOneUnlockedCanvas(uint256 tokenID);
	error CantTransferUntilLocked(uint256 tokenID);

	event CanvasUpdated(uint256 tokenID, uint16[] colorIds, uint16[] positions, address sender);
	event CanvasLocked(uint256 tokenID, string title);

	constructor(
		//Colors _colorsContract
		) ERC721("Canvas", "CANVAS") {
		//colorsContract = _colorsContract;
	}

	function totalSupply() public view returns (uint256) {
		return tokenIdCounter.current();
	}

	// anyone can mint a new shared canvas
	// but only if the last canvas has been locked
	function createNewCanvas() public returns (uint256) {
		uint256 tokenId = tokenIdCounter.current();
		//check that the last canvas is locked
		if (tokenId > 0) {
			State storage state = canvasData[tokenId];
			if (!state.locked) revert OnlyOneUnlockedCanvas(tokenId);
		}

		tokenIdCounter.increment();
		_safeMint(address(this), tokenIdCounter.current()); //the contract owns the token until it has been locked

		//update the state
		State storage newState = canvasData[tokenIdCounter.current()];
		newState.createdTime = block.timestamp;

		return tokenIdCounter.current();
	}

	function getPixels(
		uint256 tokenId
	) external view returns (uint16[NUM_PIXELS] memory) {
		//check if it is valid
		if (!_exists(tokenId)) revert InvalidTokenID(tokenId);
		State storage state = canvasData[tokenId];
		return state.iColor;
	}

	function getContributors(
		uint256 tokenId
	) external view returns (address[] memory contributors, uint256[] memory pixelCount) {
		//check if it is valid
		if (!_exists(tokenId)) revert InvalidTokenID(tokenId);
		State storage state = canvasData[tokenId];
		contributors = state.contributors;
		pixelCount = new uint256[](contributors.length);
		for (uint256 i = 0; i < contributors.length; i++) {
			pixelCount[i] = state.contributions[contributors[i]];
		}
	}

	function getLockTime(uint256 tokenId) external view returns (uint256) {
		//check if it is valid
		if (!_exists(tokenId)) revert InvalidTokenID(tokenId);
		State storage state = canvasData[tokenId];
		return state.createdTime + MINIMUM_UNLOCK_TIME;
	}

	function commitPixels(
		uint256 tokenID,
		uint16[] calldata colorIds,
		uint16[] calldata positions
	) external {

		//check that the tokenID is valid
		if (!_exists(tokenID)) revert InvalidTokenID(tokenID);

		State storage state = canvasData[tokenID];

		//check that the canvas is not locked
		if (state.locked) revert CanvasIsLocked(tokenID);

		for (uint256 i = 0; i < colorIds.length; i++) {
			uint16 colorId = colorIds[i];
			uint16 offset = positions[i];

			//check that the pixel is in bounds
			if (offset >= NUM_PIXELS) revert InvalidPixelOffset(offset);

			state.iColor[offset] = colorId;
		}

		//record the contribution
		if (state.contributions[msg.sender] == 0)
			state.contributors.push(msg.sender);
		state.contributions[msg.sender] += colorIds.length;

		//send an event that the canvas has been updated
		emit CanvasUpdated(tokenID, colorIds, positions, msg.sender);
	}

	// lock the canvas so that it can't be updated
	// - whoever locks the canvas will be the new owner and be able to set the title
	// - the canvas can only be locked once
	function lockCanvas(uint256 tokenID, string calldata title) public {
		//check that the tokenID is valid
		if (!_exists(tokenID)) revert InvalidTokenID(tokenID);

		State storage state = canvasData[tokenID];
		//check that the canvas is not already locked
		if (state.locked) revert CanvasIsLocked(tokenID);

		//check that the minimum time has passed
		if (block.timestamp - state.createdTime < MINIMUM_UNLOCK_TIME)
			revert NotReadyToLock(tokenID);

		//lock the canvas
		state.locked = true;

		//set the title
		state.title = title;

		//lock in the pixels // OOOF GAS
		state.svg = generateSVG(tokenID);

		//TODO: look into Base64 png encoding instead

		//TODO: start an auction for the canvas

		//for this version , just transfer the canvas to the sender
		//they paid all that gas, they deserve it
		_transfer(ownerOf(tokenID), msg.sender, tokenID);

		emit CanvasLocked(tokenID, title);
	}

	bytes16 private constant _HEX_SYMBOLS = "0123456789abcdef";

	function uintToHex(uint8 _i) internal pure returns (bytes1) {
		return bytes1(_HEX_SYMBOLS[_i]);
	}

	//colorVal should be in range [0,4096)
	function getColorString(
		uint16 colorVal
	) internal pure returns (bytes3 str) {
		uint8[3] memory rgb = [
			uint8((colorVal >> 8) & 0xf),
			uint8((colorVal >> 4) & 0xf),
			uint8(colorVal & 0xf)
		];

		str = bytes3(
			abi.encodePacked(
				uintToHex(rgb[0]),
				uintToHex(rgb[1]),
				uintToHex(rgb[2])
			)
		);
	}

	//get the metadata for a canvas
	function tokenURI(
		uint256 tokenID
	) public view override returns (string memory) {
		//check that the tokenID is valid
		if (!_exists(tokenID)) revert InvalidTokenID(tokenID);

		//get the canvas state
		State storage state = canvasData[tokenID];

		if (state.locked) {
			//create the metadata string
			string memory metadata = string(
				abi.encodePacked(
					'{"name": ',
					state.title,
					'", "description": "Splatter Party #',
					tokenID,
					', "image": "data:image/svg+xml;utf8,',
					state.svg,
					'" }'
				)
			);

			//return the metadata
			return metadata;
		}
		return lockedTokenURI;
	}
	
	function generateSVG(uint256 tokenID) internal view returns (string memory svg) {
		if (!_exists(tokenID)) revert InvalidTokenID(tokenID);

		//get the canvas state
		State storage state = canvasData[tokenID];

		svg = string(
			abi.encodePacked(
				"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ",
				CANVAS_WIDTH.toString(),
				" ",
				CANVAS_HEIGHT.toString(),
				"'>"
			)
		);

		//loop through the pixels and add them to the metadata
		for (uint256 i = 0; i < NUM_PIXELS; i++) {
			if (state.iColor[i] != 0) {
				string memory xStr = (i % CANVAS_WIDTH).toString();
				string memory yStr = (i / CANVAS_WIDTH).toString();

				string memory colorStr = string(
					abi.encodePacked(
						"<path d='M",
						xStr,
						" ",
						yStr,
						"h1v1H",
						xStr,
						"z' fill='#",
						getColorString(state.iColor[i]),
						"'/>"
					)
				);

				svg = string(abi.encodePacked(svg, colorStr));
			}
		}

		//finish
		svg = string(abi.encodePacked(svg, "</svg>"));
	}


	// override transfer behaviour;
	// canvas can only be transferred if locked
	// TODO: (maybe) royalties are paid to the color owners by their contribution amount
	function _beforeTokenTransfer(
		address from,
		address /*to*/,
		uint256 firstTokenId,
		uint256 batchSize
	) internal virtual override {
		if (from != address(0)) //minting
		{
			//ensure that it is locked
			for (uint256 i = 0; i < batchSize; i++) {
				if (!canvasData[firstTokenId + i].locked)
					revert CantTransferUntilLocked(firstTokenId + i);
			}
		}

		//TODO: split royalties
	}
}
