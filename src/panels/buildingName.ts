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
