import { useEffect, useState } from "react";
import { useScaffoldContractRead } from "../scaffold-eth";

type TokenUriData = {
    name: string;
    description: string;
    image: string;
}

export function useCanvasData(tokenId: bigint) {

    const { data: canvasData, refetch: getCanvasData } = useScaffoldContractRead({
        contractName: "Canvas",
        functionName: "canvasData",
        args: [tokenId],
      });

    let createdTime = 0;
    let title = "";
    let isLocked = false;
    let svg = "";

    console.log("canvasData:", canvasData);

    if (canvasData) {
        createdTime = canvasData[0];
        title = canvasData[1];
        isLocked = canvasData[2];
        svg = canvasData[3];
    }

    let tokenUriData : TokenUriData = {} as TokenUriData;

    
    //get the tokenURI from the contract
    const { data: tokenURI, refetch: getTokenURI } = useScaffoldContractRead({
        contractName: "Canvas",
        functionName: "tokenURI",
        args: [tokenId],
        });

    // convert to svg
    if (isLocked && tokenURI) {
        try {            
            //console.log("tokenURI:", tokenURI)
            //fix busted json until we can update contract
            let fixed = tokenURI.replace(/[^\u0009\u000A\u000D\u0020-\uD7FF]/gu, "");
            fixed = fixed.replace("\"name\": ", "\"name\": \"");
            fixed = fixed.replace("Splatter Party #", "Splatter Party #?\"");
            fixed = fixed.replace("data:image/svg+xml;utf8,", "");
            //console.log("fixed:", fixed)
            tokenUriData = JSON.parse(fixed);                
        }
        catch (e) {
            console.log("error parsing tokenURI:", e);
        }
    }
    

    return { createdTime, title, isLocked, svg };

}