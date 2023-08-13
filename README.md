# Splatter Party 🎨
### A project for Superhack 2023

The idea for this project was to build a collaborative painting dapp that allows participants to work together to create a piece of art that is then auctioned off and the proceeds are split between the participants proportionally according to their contributions.

## How it works
- The 64x64 canvas is stored entirely on chain using 12-bit color values. 
- Every 8 hours a new canvas is created
- Participants can paint to the canvas and then commit their changes

## LED Matrix
- I wanted to try out getting a real-time view of the canvas that could be hung up on a wall so I built a small LED matrix that displays the canvas in real time.
- Using a raspberry pi and a 64x64 LED matrix I was able to display the canvas in real time

The project is built using the following technologies:
- [Scaffold-Eth 2](https://github.com/scaffold-eth/scaffold-eth-2)

## Demo
The contracts are deployed on Optimism Goerli
https://goerli-optimism.etherscan.io/address/0xa1cf3f1329f74b289bace14a08e5d7ca2eda1d35

You can try it ot for yourself here:
https://splatterparty.vercel.app/



