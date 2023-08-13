require('dotenv').config();

// see: https://github.com/alexeden/rpi-led-matrix
const { LedMatrix } = require("rpi-led-matrix");

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
	const matrix = new LedMatrix(
	{
		...LedMatrix.defaultMatrixOptions(),
		rows: 64,
		cols: 64,
	},
	{
		...LedMatrix.defaultRuntimeOptions(),
		gpioSlowdown: 4,
	}
	)

	matrix.clear().brightness(100);

        //call the contract
        const canvasContract = new ethers.Contract(canvasAddress, canvasABI, provider);

        const canvasWidth = Number(await canvasContract.CANVAS_WIDTH());
        console.log("Canvas Width:", canvasWidth);

        const canvasData = await canvasContract.canvasData(1);
        console.log("Canvas Data:", canvasData);

        const pixels = await canvasContract.getPixels(1);
        console.log("Pixels:", pixels);

	//set the pixels
        for (let i = 0; i < pixels.length; i++) {
            const x = i % canvasWidth;
            const y = Math.floor(i / canvasWidth);
            const color = Number(pixels[i]);
            if (color > 0) {
                const r = ((color >> 8) & 0xF) << 4;
                const g = ((color >> 4) & 0xF) << 4;
                const b = ((color & 0xF) << 4);
                console.log("set pixel(", x, ",", y, "): ", r, g, b);
		matrix.fgColor({ r: r, g: g, b: b}).setPixel(x, y);
            }
        }
	matrix.sync();

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

                    const r = (color >> 8) & 0xF;
                    const g = (color >> 4) & 0xF;
                    const b = color & 0xF;

                    console.log("set pixel:", x, y, r, g, b);
		    matrix.fgColor({r:r, g:g, b:b}).setPixel(x,y);
                }
                //update the led matrix
		matrix.sync()
            }
            catch (e) {
                console.log("error:", e);
            }

        });

})()
