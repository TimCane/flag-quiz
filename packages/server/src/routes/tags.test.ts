import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestApp, cleanupTestApp, get, jsonRequest, seedTag, type TestContext } from "../test-helpers.js";

let ctx: TestContext;
beforeEach(() => { ctx = createTestApp(); });
afterEach(() => { cleanupTestApp(ctx); });

describe("GET /api/:collection/tags", () => {
  it("returns empty list initially", async () => {
    const res = await get(ctx.app, "/api/world/tags");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.tags).toEqual([]);
  });

  it("returns tags ordered by sort_order", async () => {
    seedTag(ctx.db, { name: "Second", sortOrder: 2 });
    seedTag(ctx.db, { name: "First", sortOrder: 1 });

    const res = await get(ctx.app, "/api/world/tags");
    const body = await res.json() as any;
    expect(body.tags).toHaveLength(2);
    expect(body.tags[0].name).toBe("First");
    expect(body.tags[1].name).toBe("Second");
  });

  it("scopes to collection", async () => {
    seedTag(ctx.db, { collectionId: "us-states" });

    const res = await get(ctx.app, "/api/world/tags");
    const body = await res.json() as any;
    expect(body.tags).toHaveLength(0);
  });
});

describe("POST /api/:collection/tags", () => {
  it("creates a tag", async () => {
    const id = crypto.randomUUID();
    const res = await jsonRequest(ctx.app, "POST", "/api/world/tags", {
      id,
      name: "Easy Flags",
      sort_order: 0,
      description: "Flags everyone knows",
      type: "group",
      updated_at: new Date().toISOString(),
    });
    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.id).toBe(id);
  });

  it("rejects invalid data", async () => {
    const res = await jsonRequest(ctx.app, "POST", "/api/world/tags", { bad: "data" });
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/:collection/tags/:id", () => {
  it("updates a tag", async () => {
    const id = seedTag(ctx.db, { name: "Old Name" });

    const res = await jsonRequest(ctx.app, "PUT", `/api/world/tags/${id}`, {
      name: "New Name",
      sort_order: 5,
      description: "Updated",
      type: "similar",
      updated_at: new Date().toISOString(),
    });
    expect(res.status).toBe(200);

    const row = ctx.db.prepare("SELECT name, type FROM tags WHERE id = ?").get(id) as any;
    expect(row.name).toBe("New Name");
    expect(row.type).toBe("similar");
  });

  it("returns 404 for unknown tag", async () => {
    const res = await jsonRequest(ctx.app, "PUT", `/api/world/tags/${crypto.randomUUID()}`, {
      name: "Test",
      sort_order: 0,
      description: "",
      type: "group",
      updated_at: new Date().toISOString(),
    });
    expect(res.status).toBe(404);
  });

  it("rejects invalid body", async () => {
    const id = seedTag(ctx.db);
    const res = await jsonRequest(ctx.app, "PUT", `/api/world/tags/${id}`, { bad: "data" });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/:collection/tags/:id", () => {
  it("deletes a tag", async () => {
    const id = seedTag(ctx.db);

    const res = await ctx.app.request(`/api/world/tags/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${(await import("../test-helpers.js")).TEST_TOKEN}` },
    });
    expect(res.status).toBe(200);

    const row = ctx.db.prepare("SELECT id FROM tags WHERE id = ?").get(id);
    expect(row).toBeUndefined();
  });

  it("returns 404 for unknown tag", async () => {
    const res = await ctx.app.request(`/api/world/tags/${crypto.randomUUID()}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${(await import("../test-helpers.js")).TEST_TOKEN}` },
    });
    expect(res.status).toBe(404);
  });

  it("cascades to flag_tags", async () => {
    const tagId = seedTag(ctx.db);
    ctx.db.prepare("INSERT INTO flag_tags (collection_id, flag, tag_id, updated_at) VALUES (?,?,?,?)").run("world", "gb", tagId, new Date().toISOString());

    await ctx.app.request(`/api/world/tags/${tagId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${(await import("../test-helpers.js")).TEST_TOKEN}` },
    });

    const { cnt } = ctx.db.prepare("SELECT COUNT(*) AS cnt FROM flag_tags WHERE tag_id = ?").get(tagId) as { cnt: number };
    expect(cnt).toBe(0);
  });
});

describe("PUT /api/:collection/tags/reorder", () => {
  it("reorders tags", async () => {
    const a = seedTag(ctx.db, { name: "A", sortOrder: 0 });
    const b = seedTag(ctx.db, { name: "B", sortOrder: 1 });

    const res = await jsonRequest(ctx.app, "PUT", "/api/world/tags/reorder", {
      order: [
        { id: a, sort_order: 1 },
        { id: b, sort_order: 0 },
      ],
      updated_at: new Date().toISOString(),
    });
    expect(res.status).toBe(200);

    const tags = ctx.db.prepare("SELECT name FROM tags WHERE collection_id = 'world' ORDER BY sort_order ASC").all() as any[];
    expect(tags[0].name).toBe("B");
    expect(tags[1].name).toBe("A");
  });
});

describe("GET /api/:collection/flag-tags", () => {
  it("returns flag-tag associations", async () => {
    const tagId = seedTag(ctx.db);
    ctx.db.prepare("INSERT INTO flag_tags (collection_id, flag, tag_id, updated_at) VALUES (?,?,?,?)").run("world", "gb", tagId, new Date().toISOString());

    const res = await get(ctx.app, "/api/world/flag-tags");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.flag_tags).toHaveLength(1);
    expect(body.flag_tags[0].flag).toBe("gb");
  });
});

describe("PUT /api/:collection/flag-tags/:flag", () => {
  it("sets tags for a flag", async () => {
    const t1 = seedTag(ctx.db, { name: "T1" });
    const t2 = seedTag(ctx.db, { name: "T2" });

    const res = await jsonRequest(ctx.app, "PUT", "/api/world/flag-tags/gb", {
      tag_ids: [t1, t2],
      updated_at: new Date().toISOString(),
    });
    expect(res.status).toBe(200);

    const { cnt } = ctx.db.prepare("SELECT COUNT(*) AS cnt FROM flag_tags WHERE collection_id = 'world' AND flag = 'gb'").get() as { cnt: number };
    expect(cnt).toBe(2);
  });

  it("replaces existing tags", async () => {
    const t1 = seedTag(ctx.db, { name: "T1" });
    const t2 = seedTag(ctx.db, { name: "T2" });
    const now = new Date().toISOString();

    await jsonRequest(ctx.app, "PUT", "/api/world/flag-tags/gb", { tag_ids: [t1], updated_at: now });
    await jsonRequest(ctx.app, "PUT", "/api/world/flag-tags/gb", { tag_ids: [t2], updated_at: now });

    const tags = ctx.db.prepare("SELECT tag_id FROM flag_tags WHERE collection_id = 'world' AND flag = 'gb'").all() as any[];
    expect(tags).toHaveLength(1);
    expect(tags[0].tag_id).toBe(t2);
  });

  it("rejects unknown flag", async () => {
    const res = await jsonRequest(ctx.app, "PUT", "/api/world/flag-tags/nonexistent", {
      tag_ids: [],
      updated_at: new Date().toISOString(),
    });
    expect(res.status).toBe(400);
  });
});
