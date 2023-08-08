import { useEffect, useState } from "react";
//import Link from "next/link";
import type { NextPage } from "next";
//import { BugAntIcon, MagnifyingGlassIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { MetaHeader } from "~~/components/MetaHeader";
import { CanvasView, Pixel } from "~~/components/canvas-view/CanvasView";
import { ControlView } from "~~/components/canvas-view/ControlView";
import { PaletteView } from "~~/components/canvas-view/PaletteView";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const [selectedCanvas, setSelectedCanvas] = useState(1);
  const [isCanvasLocked, setIsCanvasLocked] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);
  const [uncommittedPixels, setUncommittedPixels] = useState<Pixel[]>([]);
  const [canvasTitle, setCanvasTitle] = useState("New Canvas");

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

  const onCanvasSelected = () => {
    const canvasId = 1;
    setSelectedCanvas(canvasId);
  };

  useEffect(() => {
    //console.log("Refetching");
    Promise.all([
      getCanvasState().then(() => {
        let title: string = canvasState ? canvasState[0] : "New Canvas";
        if (title == "") title = "Canvas #" + selectedCanvas;
        const isLocked: boolean = canvasState ? Boolean(canvasState[1]) : false;
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
            committedPixels={committedPixels as number[]}
            uncommittedPixels={uncommittedPixels}
            setUncommittedPixels={setUncommittedPixels}
          />
        </div>
      </div>
    </>
  );
};

export default Home;
