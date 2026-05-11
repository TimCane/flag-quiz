import crypto from "crypto";
import type { MiddlewareHandler } from "hono";

function deriveToken(password: string): string {
  return crypto.createHmac("sha256", password).update("flag-quiz-token").digest("hex");
}

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const header = c.req.header("Authorization");

  if (!header?.startsWith("Bearer ")) {
    return c.json({ ok: false, error: "Unauthorized" }, 401);
  }

  const token = header.slice(7);
  const expected = process.env.APP_PASSWORD;

  if (!expected) {
    return c.json({ ok: false, error: "Unauthorized" }, 401);
  }

  const expectedToken = deriveToken(expected);
  const tokenBuf = Buffer.from(token);
  const expectedBuf = Buffer.from(expectedToken);

  if (tokenBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(tokenBuf, expectedBuf)) {
    return c.json({ ok: false, error: "Unauthorized" }, 401);
  }

  await next();
};
