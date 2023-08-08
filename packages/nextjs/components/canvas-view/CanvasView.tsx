import { useState } from "react";
import { getColorFromIndex } from "~~/utils/canvas/ColorUtils";

//renders a canvas which is a svg of 64x64 rectangles
//handle clicks on the rectangles and print the relative position of the mouse in the svg

export type Pixel = {
  x: number;
  y: number;
  color: number;
};

type CanvasViewProps = {
  selectedColor: number;
  committedPixels: number[];
  uncommittedPixels: Pixel[];
  setUncommittedPixels: (pixels: Pixel[]) => void;
};

export const CanvasView = ({
  selectedColor,
  committedPixels,
  uncommittedPixels,
  setUncommittedPixels,
}: CanvasViewProps) => {
  const WIDTH = 16;
  const HEIGHT = 16;

  const [zoomLevel, setZoomLevel] = useState(100);

  //handle clicks on the rectangles
  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    //print which rect was clicked on

    //get the position of the mouse in the svg
    const rect = e.currentTarget.getBoundingClientRect();

    const x = e.clientX - rect.left; //x position within the element.
    const y = e.clientY - rect.top; //y position within the element.

    const tileX = Math.floor((x / rect.width) * WIDTH);
    const tileY = Math.floor((y / rect.height) * HEIGHT);

    const newPixel: Pixel = { x: tileX, y: tileY, color: selectedColor };
    setUncommittedPixels([...uncommittedPixels, newPixel]);
  };

  const viewBox = "0 0 " + WIDTH + " " + HEIGHT;

  const svg = (
    <svg
      className="flex-grow border-4"
      width={zoomLevel + "%"}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      onClick={handleClick}
    >
      {committedPixels?.map((color, index) => {
        const x = index % WIDTH;
        const y = Math.floor(index / WIDTH);
        if (color != 0)
          return <rect key={"cpx" + index} x={x} y={y} width="1" height="1" fill={getColorFromIndex(color)} />;
      })}

      {uncommittedPixels.map((pixel: Pixel, index) => {
        const x = pixel.x;
        const y = pixel.y;
        const color = pixel.color;
        return <rect key={"upx" + index} x={x} y={y} width="1" height="1" fill={getColorFromIndex(color)} />;
      })}
    </svg>
  );

  return (
    <div className="flex flex-col">
      <div>{svg}</div>
      <div className="flex gap-4">
        <div className="flex">Scale: {zoomLevel}%</div>
        <div className="flex-grow"></div>
        <button className="flex" onClick={() => setZoomLevel(zoomLevel + 10)}>
          +
        </button>
        <button className="flex" onClick={() => setZoomLevel(zoomLevel - 10)}>
          -
        </button>
      </div>
    </div>
  );
};
