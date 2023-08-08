export const getColorFromIndex = (index: number): string => {
  return "#" + ((index >> 8) & 0xf).toString(16) + ((index >> 4) & 0xf).toString(16) + (index & 0xf).toString(16);
};
