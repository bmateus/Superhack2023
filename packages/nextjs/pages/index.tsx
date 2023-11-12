import type { NextPage } from "next";
import { MetaHeader } from "~~/components/MetaHeader";
import { useScaffoldContractRead, useScaffoldContractWrite, useScaffoldEventSubscriber } from "~~/hooks/scaffold-eth";
import { CanvasThumbnail } from "~~/components/canvas-view/CanvasThumbnail";
import { useCanvasData } from "~~/hooks/canvas/useCanvasData";

const Home: NextPage = () => {

  const { data: totalSupply, refetch: getTotalSupply } = useScaffoldContractRead({
    contractName: "Canvas",
    functionName: "totalSupply",
  });

  console.log("Total Supply", totalSupply);

  const thumbnails = [];

  for (let i = 1; i <= totalSupply; i++) {  
    thumbnails.push(
      <div key={i}>
        <CanvasThumbnail canvasTokenId={i}/>
      </div>);
  }
  
  let showCreateNewCanvas = false;
  const lastCanvasData = useCanvasData(totalSupply);
  if (lastCanvasData && lastCanvasData.isLocked) {
    showCreateNewCanvas = true;
  }
  
  //console.log("Last Canvas Data:", lastCanvasData);

  const { writeAsync: sendCreateRequest, isLoading: waitingForCreate } = useScaffoldContractWrite({
    contractName: "Canvas",
    functionName: "createNewCanvas",
    onBlockConfirmation: txnReceipt => {
      console.log("📦 Transaction blockHash", txnReceipt.blockHash);
      //go to the new canvas page?
    },
  });

  const createNewCanvas = () => {
    console.log("Create New Canvas");
    sendCreateRequest();
  }

  return (
    <>
      <MetaHeader />  
      <div className="p-6 container mx-auto">
        <div className="py-2">
          <h1 className="text-center text-4xl">Gallery</h1>
        </div>
      <div className="md:grid md:gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12" data-theme="scaffoldEthDark">
          {thumbnails && 
            thumbnails.map((thumb) => {
              return thumb
            })
          }

          {showCreateNewCanvas && 
            <div key="create" onClick={createNewCanvas}>
              <div className="p-6 mb-6 transition duration-300 group transform hover:-translate-y-2 hover:shadow-2xl rounded-2xl cursor-pointer">
                <div className="relative mb-4 rounded-2xl ">
                  
                    <img
                      width={500}
                      height={500}
                      className="bg-black border-2 border-white"
                      src={"/new_canvas.jpg"}
                      alt="Thumbnail"
                    />
                  
                  <h3 className="text-center text-2xl">Create New Canvas</h3>
                </div>
              </div>
            </div>
          }

      </div>
      </div>    
    </>
  );
};

export default Home;
