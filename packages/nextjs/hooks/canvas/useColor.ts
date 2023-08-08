import { useState } from "react";

export function useColor() {
  const [color, setColor] = useState<number>(0);
  return { color, setColor };
}
