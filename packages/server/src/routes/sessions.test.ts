import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestApp, cleanupTestApp, get, jsonRequest, seedSession, seedClassicAttempt, type TestContext } from "../test-helpers.js";

let ctx: TestContext;
beforeEach(() => { ctx = createTestApp(); });
afterEach(() => { cleanupTestApp(ctx); });

describe("POST /api/:collection/sessions", () => {
  it("creates a session", async () => {
    const id = crypto.randomUUID();
    const res = await jsonRequest(ctx.app, "POST", "/api/world/sessions", {
      id,
      mode: "classic",
      exit_condition: "normal",
      quick: false,
      started: new Date().toISOString(),
    });
    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.id).toBe(id);
  });

  it("returns 409 for duplicate session", async () => {
    const id = crypto.randomUUID();
    const data = { id, mode: "classic", exit_condition: "normal", quick: false, started: new Date().toISOString() };

    await jsonRequest(ctx.app, "POST", "/api/world/sessions", data);
    const res = await jsonRequest(ctx.app, "POST", "/api/world/sessions", data);
    expect(res.status).toBe(409);
  });

  it("returns 400 for invalid data", async () => {
    const res = await jsonRequest(ctx.app, "POST", "/api/world/sessions", {
      id: crypto.randomUUID(),
      mode: "invalid-mode",
      exit_condition: "normal",
      started: new Date().toISOString(),
    });
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/:collection/sessions/:id", () => {
  it("ends a session with attempts", async () => {
    const sid = seedSession(ctx.db);
    seedClassicAttempt(ctx.db, sid);

    const res = await jsonRequest(ctx.app, "PUT", `/api/world/sessions/${sid}`, {
      ended: new Date().toISOString(),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.deleted).toBeUndefined();
  });

  it("deletes a session with no attempts", async () => {
    const sid = seedSession(ctx.db);

    const res = await jsonRequest(ctx.app, "PUT", `/api/world/sessions/${sid}`, {
      ended: new Date().toISOString(),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.deleted).toBe(true);
  });

  it("returns 400 for invalid body", async () => {
    const sid = seedSession(ctx.db);
    const res = await jsonRequest(ctx.app, "PUT", `/api/world/sessions/${sid}`, {});
    expect(res.status).toBe(400);
  });
});

describe("GET /api/:collection/sessions", () => {
  it("returns paginated sessions", async () => {
    const sid = seedSession(ctx.db);
    seedClassicAttempt(ctx.db, sid);

    const res = await get(ctx.app, "/api/world/sessions?limit=10&offset=0");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.sessions).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(body.sessions[0].attempt_count).toBe(1);
  });

  it("returns empty list for no sessions", async () => {
    const res = await get(ctx.app, "/api/world/sessions");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.sessions).toHaveLength(0);
    expect(body.total).toBe(0);
  });

  it("respects pagination", async () => {
    for (let i = 0; i < 5; i++) {
      const sid = seedSession(ctx.db);
      seedClassicAttempt(ctx.db, sid);
    }

    const res = await get(ctx.app, "/api/world/sessions?limit=2&offset=0");
    const body = await res.json() as any;
    expect(body.sessions).toHaveLength(2);
    expect(body.total).toBe(5);
  });
});

describe("GET /api/:collection/sessions/:id", () => {
  it("returns session with attempts", async () => {
    const sid = seedSession(ctx.db);
    seedClassicAttempt(ctx.db, sid);

    const res = await get(ctx.app, `/api/world/sessions/${sid}`);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.session.id).toBe(sid);
    expect(body.attempts).toHaveLength(1);
    expect(body.attempts[0].correct).toBe(true); // boolean conversion
  });

  it("returns 404 for unknown session", async () => {
    const res = await get(ctx.app, `/api/world/sessions/${crypto.randomUUID()}`);
    expect(res.status).toBe(404);
  });

  it("scopes to collection", async () => {
    const sid = seedSession(ctx.db, { collectionId: "us-states" });

    const res = await get(ctx.app, `/api/world/sessions/${sid}`);
    expect(res.status).toBe(404);
  });
});
