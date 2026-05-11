import { describe, it, expect } from "vitest";
import {
  ClassicAttemptSchema,
  PickFlagAttemptSchema,
  PickItemAttemptSchema,
  SessionSchema,
  CreateSessionSchema,
  FlagProgressSchema,
  SettingSchema,
  TagSchema,
} from "../index.js";

describe("ClassicAttemptSchema", () => {
  const valid = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    session_id: "550e8400-e29b-41d4-a716-446655440001",
    flag: "gb",
    guess: "gb",
    correct: true,
    forgotten: false,
    confidence: 3,
    reaction_time_ms: 1500,
    ts: "2025-01-01T00:00:00.000Z",
  };

  it("accepts valid data", () => {
    expect(ClassicAttemptSchema.safeParse(valid).success).toBe(true);
  });

  it("allows null guess", () => {
    expect(ClassicAttemptSchema.safeParse({ ...valid, guess: null }).success).toBe(true);
  });

  it("rejects missing flag", () => {
    const { flag, ...noFlag } = valid;
    expect(ClassicAttemptSchema.safeParse(noFlag).success).toBe(false);
  });

  it("defaults accidental to false", () => {
    const result = ClassicAttemptSchema.safeParse(valid);
    expect(result.success && result.data.accidental).toBe(false);
  });
});

describe("PickFlagAttemptSchema", () => {
  it("requires options array", () => {
    const valid = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      session_id: "550e8400-e29b-41d4-a716-446655440001",
      flag: "gb",
      guess: "fr",
      options: ["gb", "fr", "de", "it"],
      correct: false,
      confidence: 2,
      reaction_time_ms: 3000,
      ts: "2025-01-01T00:00:00.000Z",
    };
    expect(PickFlagAttemptSchema.safeParse(valid).success).toBe(true);
    expect(PickFlagAttemptSchema.safeParse({ ...valid, options: undefined }).success).toBe(false);
  });
});

describe("SessionSchema", () => {
  it("accepts valid session", () => {
    const result = SessionSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      mode: "classic",
      exit_condition: "normal",
      quick: false,
      started: "2025-01-01T00:00:00.000Z",
      ended: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid mode", () => {
    const result = SessionSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      mode: "invalid-mode",
      exit_condition: "normal",
      quick: false,
      started: "2025-01-01T00:00:00.000Z",
      ended: null,
    });
    expect(result.success).toBe(false);
  });

  it("accepts pick-the-item mode", () => {
    const result = SessionSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      mode: "pick-the-item",
      exit_condition: "due",
      quick: true,
      started: "2025-01-01T00:00:00.000Z",
      ended: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("CreateSessionSchema", () => {
  it("omits ended field", () => {
    const result = CreateSessionSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      mode: "classic",
      exit_condition: "normal",
      quick: false,
      started: "2025-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });
});

describe("FlagProgressSchema", () => {
  it("accepts valid progress", () => {
    const result = FlagProgressSchema.safeParse({
      flag: "gb",
      mnemonic: "Union Jack",
      stability: 10.5,
      difficulty: 5.0,
      state: 2,
      last_review: "2025-01-01T00:00:00.000Z",
      due: "2025-01-05T00:00:00.000Z",
      updated_at: "2025-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });
});

describe("SettingSchema", () => {
  it("accepts valid setting", () => {
    const result = SettingSchema.safeParse({
      key: "speed_timeout_classic_ms",
      value: "10000",
      type: "number",
      label: "Speed timeout",
      category: "Speed Mode",
    });
    expect(result.success).toBe(true);
  });
});

describe("TagSchema", () => {
  it("accepts valid tag", () => {
    const result = TagSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Easy flags",
      sort_order: 0,
      description: "Flags everyone knows",
      type: "group",
      updated_at: "2025-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("accepts similar type", () => {
    const result = TagSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Chad vs Romania",
      sort_order: 0,
      description: "",
      type: "similar",
      updated_at: "2025-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });
});
