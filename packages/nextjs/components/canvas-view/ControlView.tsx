import { useState } from "react";
import { Pixel } from "./CanvasView";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

type ControlViewProps = {
  selectedCanvas: number;
  uncommittedPixels: Pixel[];
  setUncommittedPixels: (pixels: Pixel[]) => void;
  isCanvasLocked: boolean;
};

export const ControlView = (props: ControlViewProps) => {
  const [title, setTitle] = useState("New Canvas");

  const xCoords = props.uncommittedPixels.map(pixel => pixel.x);
  const yCoords = props.uncommittedPixels.map(pixel => pixel.y);
  const colors = props.uncommittedPixels.map(pixel => pixel.color);

  const { writeAsync: sendCommitRequest, isLoading: waitingForCommit } = useScaffoldContractWrite({
    contractName: "Canvas",
    functionName: "commitPixels",
    args: [BigInt(props.selectedCanvas ?? 0), xCoords, yCoords, colors],
    onBlockConfirmation: txnReceipt => {
      console.log("📦 Transaction blockHash", txnReceipt.blockHash);
      //clear uncommitted pixels
      props.setUncommittedPixels([]);
    },
  });

  const { writeAsync: sendLockRequest, isLoading: waitingForLock } = useScaffoldContractWrite({
    contractName: "Canvas",
    functionName: "lockCanvas",
    args: [BigInt(props.selectedCanvas ?? 0), title],
    value: "0.0005", //TODO: get this from the contract
    onBlockConfirmation: txnReceipt => {
      console.log("📦 Transaction blockHash", txnReceipt.blockHash);
      //clear uncommitted pixels
      props.setUncommittedPixels([]);
    },
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const onClickUndo = () => {
    console.log("Undo");
    const newPixels = props.uncommittedPixels.slice(0, props.uncommittedPixels.length - 1);
    props.setUncommittedPixels(newPixels);
  };

  const onClickCommit = () => {
    console.log("Commit");
    if (props.uncommittedPixels.length > 0) {
      //optime the pixels? clear duplicates?
      sendCommitRequest();
    }
  };

  const onClickLock = () => {
    console.log("Lock");
    sendLockRequest();
  };

  return (
    <div className="m-16 flex flex-col gap-4">
      Uncomitted Pixels: {props.uncommittedPixels.length}
      <button className="btn btn-primary btn-sm font-normal cursor-auto flex" onClick={onClickUndo}>
        <span>Undo</span>
      </button>
      <button
        className={`btn btn-primary btn-sm font-normal cursor-auto flex" ${waitingForCommit ? "loading" : ""}`}
        onClick={onClickCommit}
      >
        <span>Commit</span>
      </button>
      {!props.isCanvasLocked && (
        <>
          <div className={`flex border-2 border-base-300 bg-base-200 rounded-full text-accent`}>
            <input
              className="input input-ghost focus:outline-none focus:bg-transparent focus:text-gray-400 h-[2.2rem] min-h-[2.2rem] px-4 border w-full font-medium placeholder:text-accent/50 text-gray-400"
              placeholder="Set Canvas Title"
              name="Canvas Title"
              value={title}
              onChange={handleTitleChange}
              //disabled={disabled}
              autoComplete="off"
            />
          </div>

          <button
            className={`btn btn-primary btn-sm font-normal cursor-auto flex ${waitingForLock ? "loading" : ""}`}
            onClick={onClickLock}
          >
            <span>Lock</span>
          </button>
        </>
      )}
    </div>
  );
};
