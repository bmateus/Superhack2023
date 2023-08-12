import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Canvas } from "../typechain-types";

/**
 * Deploys a contract named "Colors" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployColors: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network goerli`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` which will fill DEPLOYER_PRIVATE_KEY
    with a random private key in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  //get the address of the colors contract
  const colorsContract = await hre.deployments.get("Colors");

  await deploy("Canvas", {
    from: deployer,
    //args: [colorsContract.address],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  //get canvas contract
  const canvasContract = await hre.ethers.getContract("Canvas", deployer);

  //get the last canvas
  const totalSupply = await canvasContract.totalSupply();
  console.log("totalSupply: ", totalSupply.toString());

  if (totalSupply == 0) {
    //call mint on the canvas contract
    await canvasContract.createNewCanvas();
  }

  //print the tokenURI for first canvas
  let tokenURI = await canvasContract.tokenURI(1);
  console.log("tokenURI: ", tokenURI);

  const pixelData: Canvas.PixelStruct[] = [
    { x: 2, y: 2, iColor: 100 },
    { x: 2, y: 3, iColor: 40 },
    { x: 5, y: 5, iColor: 1000 },
    { x: 15, y: 15, iColor: 2000 },
    { x: 13, y: 2, iColor: 100 },
    { x: 14, y: 3, iColor: 40 },
    { x: 15, y: 5, iColor: 1000 },
    { x: 15, y: 15, iColor: 2000 },
    { x: 8, y: 5, iColor: 1 },
    { x: 8, y: 8, iColor: 4096 },
  ];

  //commit some pixels
  //const tx = await canvasContract.commitPixels(1, pixelData);

  const iColors = pixelData.map(p => p.iColor);
  const offsets = pixelData.map(p => p.x + p.y * 16);

  const tx = await canvasContract.commitPixels(1, iColors, offsets);
  console.log("commitPixels tx: ", tx);

  tokenURI = await canvasContract.tokenURI(1);
  console.log("after commitPixels: tokenURI: ", tokenURI);
};

export default deployColors;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags deployColors
deployColors.tags = ["Colors"];
