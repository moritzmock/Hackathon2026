/** "building_02" → 2 (the pin number) and "Building 2" (display name). */
export const buildingNumber = (id: string) => Number(id.split("_")[1]);
export const buildingName = (id: string) => `Building ${buildingNumber(id)}`;
