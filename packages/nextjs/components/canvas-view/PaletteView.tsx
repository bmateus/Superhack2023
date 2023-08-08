//renders a palette which is a svg of 32x128 rectangles
//handle clicks on the rectangles and print the relative position of the mouse in the svg
import { getColorFromIndex } from "~~/utils/canvas/ColorUtils";

type PaletteViewProps = {
  selectedColor: number;
  onColorSelected: (color: number) => void;
};

export const PaletteView = ({ selectedColor, onColorSelected }: PaletteViewProps) => {
  const WIDTH = 64;
  const HEIGHT = 64;

  //handle clicks on the rectangles
  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    //get the position of the mouse in the svg
    const rect = e.currentTarget.getBoundingClientRect();

    const x = e.clientX - rect.left; //x position within the element.
    const y = e.clientY - rect.top; //y position within the element.

    const tileX = Math.floor((x / rect.width) * WIDTH);
    const tileY = Math.floor((y / rect.height) * HEIGHT);

    console.log("Palette clicked tile:" + tileX + " " + tileY);
    //calculate the selected color based on the tile coords
    const colorIdx = tileX + tileY * WIDTH;

    if (colorIdx >= 0 && colorIdx < 4096) onColorSelected(colorIdx);
  };

  const clickNextColor = () => {
    console.log("Next color");
    if (selectedColor < 4095) onColorSelected(selectedColor + 1);
  };

  const clickPrevColor = () => {
    console.log("Prev color");
    if (selectedColor > 0) onColorSelected(selectedColor - 1);
  };

  const viewBox = "0 0 " + WIDTH + " " + HEIGHT;

  const svg = (
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox={viewBox} onClick={handleClick}>
      {[...Array(4096).keys()].map((i: number) => {
        const x = i % WIDTH;
        const y = Math.floor(i / WIDTH);
        const color = getColorFromIndex(i);
        return <rect key={"color" + i} x={x} y={y} width="1" height="1" fill={color} />;
      })}
    </svg>
  );

  return (
    <div className="flex-none m-16">
      <div className="flex flex-row gap-4 m-4 place-items-center">
        <div className="w-10 h-10" style={{ backgroundColor: getColorFromIndex(selectedColor) }}></div>
        <div>ID: {selectedColor}</div>
        <div>Value: {getColorFromIndex(selectedColor)}</div>
      </div>
      {svg}
      <div className="flex flex-row gap-1 m-4">
        <button className="btn btn-primary btn-sm font-normal cursor-auto flex" onClick={clickPrevColor}>
          &lsaquo;
        </button>
        <div className="flex-grow"></div>
        <button className="btn btn-primary btn-sm font-normal cursor-auto flex" onClick={clickNextColor}>
          &rsaquo;
        </button>
      </div>
    </div>
  );
};
