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
  setSelectedColor: (color: number) => void;
  committedPixels: number[];
  uncommittedPixels: Pixel[];
  setUncommittedPixels: (pixels: Pixel[]) => void;
  isCanvasLocked: boolean;
};

export const CanvasView = ({
  selectedColor,
  setSelectedColor,
  committedPixels,
  uncommittedPixels,
  setUncommittedPixels,
  isCanvasLocked,
}: CanvasViewProps) => {
  const WIDTH = 64;
  const HEIGHT = 64;

  const [zoomLevel, setZoomLevel] = useState(100);

  const getColorAtTile = (x: number, y: number): number => {
    //look through the uncommitted pixels first
    let color = 0;
    for (let i = 0; i < uncommittedPixels.length; i++) {
      const pixel = uncommittedPixels[i];
      if (pixel.x == x && pixel.y == y) color = pixel.color;
    }
    if (color != 0) return color;
    //look through the committed pixels
    const index = x + y * WIDTH;
    console.log("Click:" + committedPixels[index]);
    return committedPixels[index];
  };

  //handle clicks on the rectangles
  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    //print which rect was clicked on

    //get the position of the mouse in the svg
    const rect = e.currentTarget.getBoundingClientRect();

    const x = e.clientX - rect.left; //x position within the element.
    const y = e.clientY - rect.top; //y position within the element.

    const tileX = Math.floor((x / rect.width) * WIDTH);
    const tileY = Math.floor((y / rect.height) * HEIGHT);

    //check if shift key is being pressed
    if (e.shiftKey) {
      console.log("Color Picker clicked tile:" + tileX + " " + tileY);
      const pickedColor = getColorAtTile(tileX, tileY);
      if (pickedColor != 0) setSelectedColor(pickedColor);
    } else if (!isCanvasLocked) {
      const newPixel: Pixel = { x: tileX, y: tileY, color: selectedColor };
      console.log("adding new pixel at " + tileX + " " + tileY);
      setUncommittedPixels([...uncommittedPixels, newPixel]);
    }
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
