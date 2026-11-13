import { buildingsById } from "../data/challenge";

// Short display names from the building type (the buildings stay anonymous).
const SHORT: Record<string, string> = {
  "administrative office": "Office",
  "secondary school": "School",
  "administrative office complex": "Office complex",
};

/** "building_02" → "School". */
export function buildingName(id: string): string {
  const type = String(buildingsById[id]?.facts.building_typology ?? id);
  return SHORT[type] ?? type.charAt(0).toUpperCase() + type.slice(1);
}

/** "Office complex" → "OC", "School" → "SC". */
export function initials(name: string): string {
  const words = name.split(" ");
  return (words.length > 1 ? words.map((w) => w[0]).join("") : name.slice(0, 2)).slice(0, 2).toUpperCase();
}
