import type { MiddlewareHandler } from "hono";
import { isKnownCollection, flagByCode } from "@flag-quiz/shared";

declare module "hono" {
  interface ContextVariableMap {
    collectionId: string;
  }
}

export const requireCollection: MiddlewareHandler = async (c, next) => {
  const id = c.req.param("collection");
  if (!id || !isKnownCollection(id)) {
    return c.json({ ok: false, error: "Unknown collection" }, 404);
  }
  c.set("collectionId", id);
  await next();
};

export function isFlagInCollection(collectionId: string, code: string): boolean {
  return flagByCode(collectionId, code) !== undefined;
}
