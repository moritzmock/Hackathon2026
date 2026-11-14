/** The building a link asks the city to open (`city.html?building=building_02`), if the city knows it. */
export function buildingFromLink(search: string, ids: readonly string[]): string | null {
  const id = new URLSearchParams(search).get("building");
  return id && ids.includes(id) ? id : null;
}
