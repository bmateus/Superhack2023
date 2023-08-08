// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./Colors.sol";

// Useful for debugging. Remove when deploying to a live network.
import "hardhat/console.sol";

contract Canvas is ERC721, ERC721Holder, Ownable {
	using Counters for Counters.Counter;
    using Strings for uint256;
	using Strings for uint16;

	// canvas dimensions
	uint256 public constant CANVAS_WIDTH = 16;
	uint256 public constant CANVAS_HEIGHT = 16;

	//canvas state
	uint256 public constant NUM_PIXELS = CANVAS_WIDTH * CANVAS_HEIGHT;

	struct State {
		string title;
		bool locked;
		uint16[NUM_PIXELS] iColor;
		string[NUM_PIXELS] colorStr;
	}

	struct Pixel {
		uint16 x;
		uint16 y;
		uint16 iColor;
	}

	Colors public colorsContract;

	mapping(uint256 => State) public canvasData;

	Counters.Counter private tokenIdCounter;

	//the cost to lock a canvas
	uint256 public constant LOCK_COST = 0.0005 ether;

	error InvalidTokenID(uint256 tokenID);
	error CanvasLocked(uint256 tokenID);
	error CanvasNotFilled(uint256 tokenID);
	error ColorNotOwnedByAddress(uint256 color, address owner);
	error InvalidPixel(uint16 x, uint16 y);
	error OnlyOneUnlockedCanvas(uint256 tokenID);
	error CantTransferUntilLocked(uint256 tokenID);

	//event CanvasUpdated(uint256 tokenID, Pixel[] pixels);
    event CanvasUpdated(uint256 tokenID, uint16[] xCoords, uint16[] yCoords, uint16[] colorIds);

	constructor(Colors _colorsContract) ERC721("Canvas", "CANVAS") {
		colorsContract = _colorsContract;
	}

	function totalSupply() public view returns (uint256) {
		return tokenIdCounter.current();
	}

	// anyone can mint a new shared canvas
	// but only if the last canvas has been locked
	function createNewCanvas() public {
		console.log("createNewCanvas");

		uint256 tokenId = tokenIdCounter.current();
		//check that the last canvas is locked
		if (tokenId > 0) {
			State storage state = canvasData[tokenId];
			if (!state.locked) revert OnlyOneUnlockedCanvas(tokenId);
		}

		tokenIdCounter.increment();
		_safeMint(address(this), tokenIdCounter.current()); //the contract owns the token until it has been locked
	}

    function getPixels(uint256 tokenId) external view returns (uint16[NUM_PIXELS] memory)
    {
        //check if it is valid
        if (!_exists(tokenId)) revert InvalidTokenID(tokenId);
        State memory state = canvasData[tokenId];
        return state.iColor;
    }


	//function commitPixels(uint256 tokenID, Pixel[] calldata pixels) public {
    function commitPixels(uint256 tokenID, uint16[] calldata xCoords, uint16[] calldata yCoords, uint16[] calldata colorIds) external {
		//check that the tokenID is valid
		if (!_exists(tokenID)) revert InvalidTokenID(tokenID);

		State storage state = canvasData[tokenID];
		//check that the canvas is not locked
		if (state.locked) revert CanvasLocked(tokenID);

		//for (uint256 i = 0; i < pixels.length; i++) {
        for (uint256 i = 0; i < colorIds.length; i++) {

            //uint16 x = pixels[i].x;
            //uint16 y = pixels[i].y;
            //uint16 colorId = pixels[i].iColor;

            uint16 x = xCoords[i];
            uint16 y = yCoords[i];
            uint16 colorId = colorIds[i];

			//check that the pixel is in bounds
			if (x >= CANVAS_WIDTH || y >= CANVAS_HEIGHT)
				revert InvalidPixel(x, y);

			uint256 offset = (y * CANVAS_WIDTH) + x;

			//check that the color is owned by the sender
			//(should only own valid colors)
			//if (msg.sender != colorsContract.ownerOf(colorId))
			//  revert ColorNotOwnedByAddress(colorId, msg.sender);

			state.iColor[offset] = colorId;

            //write svg string here cause its super slow in tokenUri?
            //this is pretty brutal for gas...maybe just when locked?

            /*
            string memory xStr = x.toString();
            string memory yStr = y.toString();

			state.colorStr[offset] = string(
				abi.encodePacked(
					"<path d='M",
					xStr,
					" ",
					yStr,
					"h1v1H",
					xStr,
					"z' fill='#",
					getColorString(colorId),
					"'/>"
				)
			);
            */
		}

		//send an event that the canvas has been updated
		//emit CanvasUpdated(tokenID, pixels);
        emit CanvasUpdated(tokenID, xCoords, yCoords, colorIds);
	}

	// lock the canvas so that it can't be updated
	// - locking the canvas requires that all the pixels are filled
	// - whoever locks the canvas will be the new owner and be able to set the title
	// - the canvas can only be locked once
	// - locking the canvas costs a locking fee; the fee is split between the color owners by their
	//   contribution amount
	function lockCanvas(uint256 tokenID, string calldata title) public payable {
		//check that the tokenID is valid
		if (!_exists(tokenID)) revert InvalidTokenID(tokenID);

		State storage state = canvasData[tokenID];
		//check that the canvas is not locked
		if (state.locked) revert CanvasLocked(tokenID);

		//check that all the pixels are filled
		//i.e. values should be [1,4096]
		for (uint256 i = 0; i < NUM_PIXELS; i++) {
			if (state.iColor[i] == 0) revert CanvasNotFilled(tokenID);
		}

		//check that the sender has sent enough ether
		if (msg.value < LOCK_COST) revert("Insufficient funds");

		//lock the canvas
		state.locked = true;

		//set the title
		state.title = title;

		//todo: start an auction for the canvas

		//transfer the canvas to the sender
		_transfer(ownerOf(tokenID), msg.sender, tokenID);
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

		//create the metadata string
		string memory metadata = string(
			abi.encodePacked(
				'{"name": ',
				state.title,
				'", "description": "A ',
				CANVAS_WIDTH.toString(),
				"x",
				CANVAS_HEIGHT.toString(),
				' pixel canvas", "image": "data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 ',
				CANVAS_WIDTH.toString(),
				" ",
				CANVAS_HEIGHT.toString(),
				'">'
			)
		);

		//loop through the pixels and add them to the metadata
		for (uint256 i = 0; i < 256; i++) {
            if (state.iColor[i] != 0)
			    metadata = string(
                    abi.encodePacked(
					    metadata,
                        state.colorStr[i]));

		}

		//finish the metadata
		metadata = string(abi.encodePacked(metadata, '</svg>" }'));

		//return the metadata
		return metadata;
	}

	// override transfer behaviour;
	// canvas can only be transferred if locked
	// royalties are paid to the color owners by their contribution amount
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

		//split royalties
	}
}
