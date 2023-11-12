import { useState } from "react";
import { useRouter } from "next/router";
import type { NextPage } from "next";
import { MetaHeader } from "~~/components/MetaHeader";
import { CanvasView, Pixel } from "~~/components/canvas-view/CanvasView";
import { ControlView } from "~~/components/canvas-view/ControlView";
import { PaletteView } from "~~/components/canvas-view/PaletteView";
import { useScaffoldContractRead, useScaffoldEventSubscriber } from "~~/hooks/scaffold-eth";

const CanvasTokenPage: NextPage = () => {
  
  const router = useRouter();
  const { tokenId: selectedCanvas } = router.query as { tokenId?: number };

  const [selectedColor, setSelectedColor] = useState(0);
  const [uncommittedPixels, setUncommittedPixels] = useState<Pixel[]>([]);
  
  const { data: canvasState, refetch: refetchCanvasState } = useScaffoldContractRead({
    contractName: "Canvas",
    functionName: "canvasData",
    args: [BigInt(selectedCanvas ?? 1)],
  });

  let canvasCreatedAt = new Date((canvasState ? Number(canvasState[0]) : 0) * 1000);
  let canvasTitle: string = (!canvasState || canvasState[1] === "") ? "Canvas #" + Number(selectedCanvas) : canvasState[1];
  let isCanvasLocked = canvasState ? Boolean(canvasState[2]) : false;

  console.log("Canvas State", canvasState);

  const { data: committedPixels, refetch: refetchCommittedPixels } = useScaffoldContractRead({
    contractName: "Canvas",
    functionName: "getPixels",
    args: [BigInt(selectedCanvas ?? 1)],
  });

  console.log("Committed Pixels", committedPixels);

  //listen for CanvasUpdated events so we can update the canvas
  useScaffoldEventSubscriber({
    contractName: "Canvas",
    eventName: "CanvasUpdated",
    listener: logs => {
      let shouldRefresh = false;
      logs.map(log => {
        const { tokenID, colorIds, positions } = log.args;
        console.log();
        console.log("CanvasUpdated:", tokenID, colorIds, positions);
        if (selectedCanvas && BigInt(selectedCanvas) == tokenID) {
          shouldRefresh = true;
        }
      });
      //refresh the canvas
      if (shouldRefresh) {
        refetchCanvasState();
        refetchCommittedPixels();
      }
    },
  });

  return (
    //check if selected canvas is valid
    <>
      <MetaHeader />
      <div className="flex" data-theme="scaffoldEthDark">
        {(selectedCanvas && (
          <>
            <div className="flex-none">
              
              { !isCanvasLocked && 
              (
                <PaletteView 
                  selectedColor={selectedColor} 
                  onColorSelected={color => setSelectedColor(color)} 
                />
              )
              }

              <ControlView
                selectedCanvas={selectedCanvas}
                uncommittedPixels={uncommittedPixels}
                setUncommittedPixels={setUncommittedPixels}
                isCanvasLocked={isCanvasLocked}
                canvasCreatedAt={canvasCreatedAt}
              />

            </div>
            <div className="flex-grow m-16">
              <div className="flex flex-row place-items-center">
                <h1>{canvasTitle}</h1>
              </div>
              <CanvasView
                selectedColor={selectedColor}
                setSelectedColor={setSelectedColor}
                committedPixels={committedPixels as number[]}
                uncommittedPixels={uncommittedPixels}
                setUncommittedPixels={setUncommittedPixels}
                isCanvasLocked={isCanvasLocked}
              />
            </div>
          </>
        )) || (
          <div className="flex-grow m-16">
            <div className="flex flex-row place-items-center">
              <h2>Invalid Canvas {selectedCanvas}</h2>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CanvasTokenPage;
