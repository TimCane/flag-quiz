import type { Collection, Flag } from "./types.js";
import { world } from "./world.js";
import { ukCounties } from "./uk-counties.js";
import { usStates } from "./us-states.js";

export type { Collection, Flag };

export const collections: Collection[] = [world, ukCounties, usStates];

export const collectionsById = new Map<string, Collection>(
  collections.map((c) => [c.id, c]),
);

export function getCollection(id: string): Collection | undefined {
  return collectionsById.get(id);
}

export function flagByCode(
  collectionId: string,
  code: string,
): Flag | undefined {
  const c = collectionsById.get(collectionId);
  if (!c) return undefined;
  return c.flags.find((f) => f.code === code);
}

export function flagsForCollection(collectionId: string): Flag[] {
  return collectionsById.get(collectionId)?.flags ?? [];
}

export function isKnownCollection(id: string): boolean {
  return collectionsById.has(id);
}
