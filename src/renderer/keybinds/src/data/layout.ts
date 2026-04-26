export type GridRow = (string | null)[];

export const CYBORG_GRID: GridRow[] = [
  [null, "4", "8", "12", "17", null],
  [null, "3", "7", "11", "16", null],
  ["36", "2", "6", "10", "15", "19"],
  [null, "1", "5", "9", "14", null],
  [null, "37", "38", "13", "18", null],
];

export type ThumbCell = { id: string; dir: string } | null;

export const CYBORG_THUMB: ThumbCell[][] = [
  [
    { id: "29", dir: "←" },
    { id: "28", dir: "↑" },
    { id: "22", dir: "◉" },
    { id: "30", dir: "↓" },
    { id: "31", dir: "→" },
  ],
  [null, { id: "41", dir: "↗" }, { id: "23", dir: "◉" }, { id: "20", dir: "↘" }, null],
];

export const CYRO_GRID: GridRow[] = [
  ["4", "3", "2", "1"],
  ["8", "7", "6", "5"],
  ["12", "11", "10", "9"],
  ["17", "16", "15", "14"],
];

export const CYRO_THUMB: { id: string; dir: string }[] = [
  { id: "22", dir: "◉" },
  { id: "28", dir: "↑" },
  { id: "29", dir: "←" },
  { id: "30", dir: "↓" },
  { id: "31", dir: "→" },
];
