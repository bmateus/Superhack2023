const LedMatrix = require("easybotics-rpi-rgb-led-matrix");

const ethers = require("ethers");

const { abi : canvasABI } = require("./abi/Canvas.json");

const canvasAddress = process.env.CONTRACT_ADDRESS;

console.log("CONTRACT_ADDRESS:", canvasAddress);

const RPC_ENDPOINT = process.env.RPC_ENDPOINT || "http://127.0.0.1:8545/"

console.log("RPC_ENDPOINT:", RPC_ENDPOINT);

const provider = new ethers.JsonRpcProvider(RPC_ENDPOINT);
provider.pollingInterval = 100;

(async () => {

        // requires root
        var matrix = new LedMatrix(64, 64);

        //call the contract
        const canvasContract = new ethers.Contract(canvasAddress, canvasABI, provider);

        const canvasWidth = Number(await canvasContract.CANVAS_WIDTH());
        console.log("Canvas Width:", canvasWidth);

        const canvasData = await canvasContract.canvasData(1);    
        console.log("Canvas Data:", canvasData);

        const pixels = await canvasContract.getPixels(1);
        console.log("Pixels:", pixels);

        //event CanvasUpdated(uint256 tokenID, uint16[] colorIds, uint8[] positions);
        //event CanvasLocked(uint256 tokenID, string title);
            
        canvasContract.on("CanvasUpdated", (tokenId, colorIds, positions, event) => {      

            console.log("tokenId:", tokenId);
            console.log("colorIds:", colorIds);
            console.log("positions:", positions);
            //console.log("event:", event);

            try {
                //write this to the led matrix
                for (let i = 0; i < positions.length; i++) {
                    
                    const pos = Number(positions[i]);
                    const color = Number(colorIds[i]);
                    
                    const x = pos % canvasWidth;
                    const y = Math.floor(pos / canvasWidth);
                    
                    const r = (color >> 8) & 0xFF;
                    const g = (color >> 4) & 0xFF;
                    const b = color & 0xFF;

                    console.log("set pixel:", x, y, r, g, b);
                    matrix.setPixel(x, y, r, g, b);
                }
                //update the led matrix
                matrix.update();
            } 
            catch (e) {
                console.log("error:", e);
            }

        });

})()