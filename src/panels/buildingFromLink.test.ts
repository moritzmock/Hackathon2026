import assert from "node:assert/strict";
import { test } from "node:test";
import { buildingFromLink } from "./buildingFromLink.ts";

const ids = ["building_01", "building_02", "building_03"];

test("a link with a known building opens that building", () => {
  assert.equal(buildingFromLink("?building=building_02", ids), "building_02");
  assert.equal(buildingFromLink("?low&building=building_03", ids), "building_03");
});

test("no building, or one the city does not know, opens the city as usual", () => {
  assert.equal(buildingFromLink("", ids), null);
  assert.equal(buildingFromLink("?low", ids), null);
  assert.equal(buildingFromLink("?building=", ids), null);
  assert.equal(buildingFromLink("?building=building_09", ids), null);
});
