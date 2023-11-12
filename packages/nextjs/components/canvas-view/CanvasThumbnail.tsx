//create a canvas thumbnail

import Image from "next/image";
import Link from "next/link";
import { useCanvasData } from "~~/hooks/canvas/useCanvasData";

type CanvasThumbnailProps = {  
    canvasTokenId: bigint;
}

export const CanvasThumbnail = (props: CanvasThumbnailProps) => {

    const { svg, title } = useCanvasData(props.canvasTokenId ?? 1);

    //render the image
    return (
        <>
        <article
            key={"Canvas #" + props.canvasTokenId}
            className="p-6 mb-6 transition duration-300 group transform hover:-translate-y-2 hover:shadow-2xl rounded-2xl cursor-pointer"
            >

        <div className="relative mb-4 rounded-2xl ">
            <Link 
                href={"/" + props.canvasTokenId}
                className="max-h-80 rounded-2xl w-full object-cover"
            >
            {svg && (<Image
                width={500}
                height={500}
                className="bg-black border-2 border-white"
                src={"data:image/svg+xml," + encodeURIComponent(svg)}
                alt="Thumbnail"
                />)}     

            {!svg && (<Image
                width={500}
                height={500}
                className="bg-black border-2 border-white"
                src={"/new_canvas.jpg"}
                alt="Thumbnail"
                />)}

            </Link>
        
        <h3 className="text-center text-2xl">
            {svg ? title : "Contribute!"}
        </h3>
        
        </div>
        </article>
        </>
    );
}
