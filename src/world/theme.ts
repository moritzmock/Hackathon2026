// World colours in one place: a soft miniature diorama, like a hand-painted model
// town. Brick-red tile roofs with some slate, cream, sand and ochre walls, deep
// greens, grey streets and slate-blue water under a cool grey-blue sky. Everything
// stays a little muted, so the three challenge buildings in the interface's full
// orange are the brightest things on the map.
export const theme = {
  ink: "#15181c",
  water: "#5b7e9c",
  sky: "#c9d1dc",
  sun: "#ffe0b5",
  facades: ["#f6e7c8", "#efd59e", "#e6bd7f", "#f8f0de", "#efcfae", "#e4d3ad", "#f3dca8", "#d3dcc2", "#f0cfc2", "#ece4d2"],
  roofTiles: ["#c4573e", "#b84e39", "#cf6a4c", "#a8483a", "#c86448"],
  roofSlate: ["#5d6878", "#6a7586", "#525d6c"],
  roofFlat: ["#d8d2c6", "#cfc9bd", "#e0dbd0", "#d3cdc1", "#dcd6cb", "#c8c2b6", "#ddd8cd", "#d1cbbf", "#93b06a"], // ~1 in 9 green roofs
  chimney: "#9c8f84",
  glass: [0.36, 0.46, 0.57] as const,
  windowFrame: "#f4efe6",
  units: "#e4e1dc",
  // things that move or float over the map
  skyTop: "#b3c1d3",
  cloud: "#ffffff",
  smoke: "#eef0f2",
  wheel: "#2b3038",
  bird: "#37404c",
  balloon: ["#ff7a33", "#fff3d6"],
  basket: "#9a6c47",
  // the three challenge buildings: orange accent, matching the interface
  target: "#ff7a33",
  targetHover: "#ff8c4d",
  targetSelected: "#ff6a1f",
  road: "#9a9ea5",
  sidewalk: "#ddd8ce",
  kerb: "#ece8e0",
  marking: "#fbfbf8",
  path: "#d6caae",
  trees: ["#5e9a45", "#4f8c3d", "#6aa64c", "#46803a", "#7aae55"],
  conifers: ["#3c6f3a", "#457a40", "#335f34"],
  bushes: ["#558f3f", "#62a048", "#4a8238", "#6fa94f"],
  trunk: "#7d5d44",
  cars: ["#c9473d", "#ece6da", "#3f5f86", "#d9b44a", "#5d8a6a", "#7a6f9a", "#2f3540", "#b8bfc8"],
};
