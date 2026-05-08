import type { MiddlewareHandler } from "hono";

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const header = c.req.header("Authorization");

  if (!header?.startsWith("Bearer ")) {
    return c.json({ ok: false, error: "Unauthorized" }, 401);
  }

  const token = header.slice(7);
  const expected = process.env.APP_PASSWORD;

  if (!expected || token !== expected) {
    return c.json({ ok: false, error: "Unauthorized" }, 401);
  }

  await next();
};
