import raw from "./challenge.json";
import type { Challenge, ChallengeBuilding } from "./types";

export const challenge = raw as unknown as Challenge;
export const buildingsById: Record<string, ChallengeBuilding> = Object.fromEntries(
  challenge.buildings.map((b) => [b.id, b]),
);
export const defaultParams = (): Record<string, number> =>
  Object.fromEntries(challenge.parameters.map((p) => [p.name, p.default]));
