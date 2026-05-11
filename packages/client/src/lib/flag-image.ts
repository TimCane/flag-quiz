import type { Flag, Collection } from "@flag-quiz/shared";

export function flagImageUrl(collectionId: string, flag: Pick<Flag, "code" | "ext">): string {
  return `/flags/${collectionId}/${flag.code}.${flag.ext}`;
}

export function flagImageUrlFromCollection(collection: Collection, code: string): string {
  const flag = collection.flags.find((f) => f.code === code);
  if (!flag) return `/flags/${collection.id}/${code}.png`;
  return flagImageUrl(collection.id, flag);
}
