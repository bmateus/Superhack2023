import { useEffect, useState } from "react";
import { Pixel } from "./CanvasView";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { Router } from "next/router";

type ControlViewProps = {
  selectedCanvas: number;
  uncommittedPixels: Pixel[];
  setUncommittedPixels: (pixels: Pixel[]) => void;
  isCanvasLocked: boolean;
  canvasCreatedAt: Date;
};

export const ControlView = (props: ControlViewProps) => {
  //const LOCK_TIME_SECS = 60 * 60 * 8; // 8 hours
  const LOCK_TIME_SECS = 60; // 1 minute

  const [title, setTitle] = useState("");

  const colors = props.uncommittedPixels.map(pixel => pixel.color);
  const offsets = props.uncommittedPixels.map(pixel => pixel.x + pixel.y * 16);

  const { writeAsync: sendCommitRequest, isLoading: waitingForCommit } = useScaffoldContractWrite({
    contractName: "Canvas",
    functionName: "commitPixels",
    args: [BigInt(props.selectedCanvas ?? 0), colors, offsets],
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
    onBlockConfirmation: txnReceipt => {
      console.log("📦 Transaction blockHash", txnReceipt.blockHash);
      //clear uncommitted pixels
      props.setUncommittedPixels([]);
    },
  });

  const { writeAsync: sendCreateRequest, isLoading: waitingForCreate } = useScaffoldContractWrite({
    contractName: "Canvas",
    functionName: "createNewCanvas",
    onBlockConfirmation: txnReceipt => {
      console.log("📦 Transaction blockHash", txnReceipt.blockHash);
      //go to the new canvas page  
    },
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const onClickUndo = () => {
    console.log("Undo");
    //TODO: create a proper command stack for undoing 
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

  const onClickNew = () => {
    console.log("Create");
    sendCreateRequest();
  };

  const updateSecondsRemaining = () => {
    if (props.canvasCreatedAt == null) return;

    const now = new Date();
    const createdAt = props.canvasCreatedAt;
    const diff = (now.getTime() - createdAt.getTime()) / 1000;
    setSecondsRemaining(LOCK_TIME_SECS - diff);
  };

  const [secondsRemaining, setSecondsRemaining] = useState(1);

  useEffect(() => {
    let timer = setTimeout(() => {
      //console.log("Updating seconds remaining");
      updateSecondsRemaining();
    }, 1000);
  }, [secondsRemaining]);

  // displays how much time is left until the canvas can be locked
  // in format "X hours Y minutes"
  const unlocksIn = () => {
    let s = secondsRemaining;
    const hours = Math.floor(s / 3600);
    s -= hours * 3600;
    const minutes = Math.floor(s / 60);
    return `${hours} hours ${minutes} minutes`;
  };

  const { data: contributors, refetch: getContributors } = useScaffoldContractRead({
    contractName: "Canvas",
    functionName: "getContributors",
    args: [BigInt(props.selectedCanvas ?? 0)],
  });

  useEffect(() => {
    getContributors();
  }, [props.isCanvasLocked]);

  return (
    <>
      {!props.isCanvasLocked && (
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
          {secondsRemaining <= 0 && (
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
          {secondsRemaining > 0 && <div className="text-accent">Canvas can be locked in {unlocksIn()}</div>}
        </div>
      )}
      {props.isCanvasLocked && (
        <>
          <div className="m-16 flex flex-col gap-4">Contributors:
          {contributors &&
            contributors[0].map((contributor, index) => {
              return (
                <div className="flex flex-col" key={index}>
                  <div className="text-accent">
                    {contributor} : {contributors[1][index].toString()} px
                  </div>
                </div>
              );
            })}
            <button className="btn btn-primary flex" onClick={onClickNew}>
              New Canvas
              </button>
              </div>
        </>
      )}
    </>
  );
};
