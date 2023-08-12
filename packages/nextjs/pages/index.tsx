import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { MetaHeader } from "~~/components/MetaHeader";
import { CanvasView, Pixel } from "~~/components/canvas-view/CanvasView";
import { ControlView } from "~~/components/canvas-view/ControlView";
import { PaletteView } from "~~/components/canvas-view/PaletteView";
import { useScaffoldContractRead, useScaffoldEventSubscriber } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const [selectedCanvas, setSelectedCanvas] = useState(1);
  const [isCanvasLocked, setIsCanvasLocked] = useState(false);
  const [canvasCreatedAt, setCanvasCreatedAt] = useState<Date>();
  const [selectedColor, setSelectedColor] = useState(0);
  const [uncommittedPixels, setUncommittedPixels] = useState<Pixel[]>([]);
  const [canvasTitle, setCanvasTitle] = useState();

  const { data: canvasState, refetch: getCanvasState } = useScaffoldContractRead({
    contractName: "Canvas",
    functionName: "canvasData",
    args: [BigInt(selectedCanvas)],
  });

  const { data: committedPixels, refetch: getCommittedPixels } = useScaffoldContractRead({
    contractName: "Canvas",
    functionName: "getPixels",
    args: [BigInt(selectedCanvas)],
  });

  //listen for CanvasUpdated events
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
        getCommittedPixels();
      }
    },
  });

  const onCanvasSelected = () => {
    const canvasId = 1;
    setSelectedCanvas(canvasId);
  };

  useEffect(() => {
    Promise.all([
      getCanvasState().then(() => {
        //console.log("Canvas State", canvasState);
        let createdAt = canvasState ? Number(canvasState[0]) : 0;
        console.log("Canvas Created At", new Date(createdAt * 1000))
        let title: string = canvasState ? canvasState[1] : "New Canvas";
        if (title == "") title = "Canvas #" + Number(selectedCanvas);
        const isLocked: boolean = canvasState ? Boolean(canvasState[2]) : false;
        setCanvasCreatedAt(new Date(createdAt * 1000));
        setCanvasTitle(title);
        setIsCanvasLocked(isLocked);
      }),
      getCommittedPixels(),
    ]).then(() => {
      //console.log("..done refetching");
    });
  }, [getCommittedPixels, getCanvasState, selectedCanvas, canvasState]);

  return (
    <>
      <MetaHeader />
      <div className="flex" data-theme="scaffoldEthDark">
        <div className="flex-none">
          <PaletteView selectedColor={selectedColor} onColorSelected={color => setSelectedColor(color)} />
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
            <div className="flex-grow"></div>
            <button onClick={onCanvasSelected}>Refresh</button>
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
      </div>
    </>
  );
};

export default Home;
