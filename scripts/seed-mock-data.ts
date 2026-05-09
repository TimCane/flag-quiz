import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { flags } = require("../packages/shared/dist/index.js");

const DATA_DIR = process.env.DATA_DIR || "packages/server/data";
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(path.join(DATA_DIR, "journal.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Ensure all tables exist
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY, mode TEXT NOT NULL, exit_condition TEXT NOT NULL,
    quick INTEGER NOT NULL DEFAULT 0, started TEXT NOT NULL, ended TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS classic_attempts (
    id TEXT PRIMARY KEY, session_id TEXT NOT NULL, flag TEXT NOT NULL,
    guess TEXT, correct INTEGER NOT NULL, forgotten INTEGER NOT NULL DEFAULT 0,
    confidence INTEGER NOT NULL, reaction_time_ms INTEGER NOT NULL,
    ts TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
  );
  CREATE TABLE IF NOT EXISTS pick_flag_attempts (
    id TEXT PRIMARY KEY, session_id TEXT NOT NULL, flag TEXT NOT NULL,
    guess TEXT NOT NULL, options TEXT NOT NULL, correct INTEGER NOT NULL,
    confidence INTEGER NOT NULL, reaction_time_ms INTEGER NOT NULL,
    ts TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
  );
  CREATE TABLE IF NOT EXISTS pick_country_attempts (
    id TEXT PRIMARY KEY, session_id TEXT NOT NULL, flag TEXT NOT NULL,
    guess TEXT NOT NULL, options TEXT NOT NULL, correct INTEGER NOT NULL,
    confidence INTEGER NOT NULL, reaction_time_ms INTEGER NOT NULL,
    ts TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
  );
  CREATE TABLE IF NOT EXISTS flag_progress (
    flag TEXT PRIMARY KEY, mnemonic TEXT NOT NULL DEFAULT '',
    stability REAL, difficulty REAL, state INTEGER NOT NULL DEFAULT 0,
    last_review TEXT, due TEXT, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY, value TEXT NOT NULL, type TEXT NOT NULL,
    label TEXT NOT NULL, category TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY, name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS flag_tags (
    flag TEXT NOT NULL,
    tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (flag, tag_id)
  );
`);

function uuid() { return crypto.randomUUID(); }
function randomInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomChoice<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randomChoices<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function dateAt(daysAgo: number, hourOffset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(randomInt(8, 22), randomInt(0, 59), randomInt(0, 59));
  return d.toISOString();
}

const now = new Date().toISOString();
const allFlagCodes: string[] = flags.map((f: any) => f.code);

// ── Clear existing mock data ──────────────────────────────
console.log("Clearing existing data...");
db.exec(`
  DELETE FROM flag_tags;
  DELETE FROM tags;
  DELETE FROM classic_attempts;
  DELETE FROM pick_flag_attempts;
  DELETE FROM pick_country_attempts;
  DELETE FROM sessions;
  DELETE FROM flag_progress;
  DELETE FROM settings WHERE key = 'presentation_config';
`);

// ── Tags ──────────────────────────────────────────────────
console.log("Creating tags...");

const tagData = [
  { id: uuid(), name: "Flags you should just know", description: "The classics - everyone knows these", sort_order: 0 },
  { id: uuid(), name: "Word association wizardry", description: "The country name literally tells you the colours", sort_order: 1 },
  { id: uuid(), name: "The tricolour squad", description: "Three vertical or horizontal stripes - mix and match!", sort_order: 2 },
  { id: uuid(), name: "Spot the difference", description: "Flags that are basically identical with tiny differences", sort_order: 3 },
  { id: uuid(), name: "Cool unique designs", description: "Flags so distinctive you can't forget them", sort_order: 4 },
  { id: uuid(), name: "Stars & celestial vibes", description: "Moons, stars, suns, and cosmic energy", sort_order: 5 },
  { id: uuid(), name: "Cross gang", description: "Nordic crosses, Swiss crosses, all the crosses", sort_order: 6 },
  { id: uuid(), name: "Animals & nature", description: "Eagles, lions, dragons, and leafy friends", sort_order: 7 },
  { id: uuid(), name: "The red family", description: "So much red it hurts your eyes", sort_order: 8 },
  { id: uuid(), name: "Union Jack offspring", description: "Countries that kept a bit of Britain in the corner", sort_order: 9 },
  { id: uuid(), name: "Pan-African colours", description: "Red, yellow, green - the holy trinity", sort_order: 10 },
  { id: uuid(), name: "Crescent club", description: "Islamic crescent moon representation", sort_order: 11 },
  { id: uuid(), name: "Island life", description: "Flags from island nations with beach vibes", sort_order: 12 },
  { id: uuid(), name: "My nemesis flags", description: "I will NEVER learn these properly", sort_order: 13 },
  { id: uuid(), name: "Weirdly satisfying", description: "Flags that just look really nice", sort_order: 14 },
];

const insertTag = db.prepare(`INSERT INTO tags (id, name, sort_order, description, updated_at) VALUES (?, ?, ?, ?, ?)`);
for (const t of tagData) {
  insertTag.run(t.id, t.name, t.sort_order, t.description, now);
}

// ── Flag-tag assignments (every flag gets at least one tag) ─
console.log("Assigning flags to tags...");

const tagAssignments: Record<string, string[]> = {
  // Flags you should just know
  [tagData[0].id]: ["us", "gb", "fr", "de", "jp", "cn", "br", "au", "ca", "in", "it", "es", "ru", "mx", "kr", "za", "tr", "eg", "ar", "se", "no", "ch", "nl", "pt", "gr"],
  // Word association wizardry
  [tagData[1].id]: ["is", "gr", "ie", "nl", "tr", "gd", "cr", "co", "lr", "cl", "ec", "sv", "hn", "gt", "ni", "bz"],
  // The tricolour squad
  [tagData[2].id]: ["fr", "it", "ie", "be", "ro", "td", "ml", "gn", "ci", "ng", "ne", "cm", "sn", "mg", "de", "hu", "bg", "nl", "lu", "at", "ru", "ee", "lt", "lv", "am", "co", "ec", "ve"],
  // Spot the difference
  [tagData[3].id]: ["td", "ro", "mc", "id", "pl", "sg", "ie", "ci", "ml", "gn", "sn", "cm", "ad", "md", "au", "nz", "no", "is", "se", "dk", "hu", "it", "bg", "sl", "sk"],
  // Cool unique designs
  [tagData[4].id]: ["np", "ch", "lk", "bz", "kz", "mz", "bt", "cy", "al", "me", "ge", "za", "ky", "bm", "mw", "sz", "ke", "ug", "rw"],
  // Stars & celestial vibes
  [tagData[5].id]: ["us", "cn", "br", "au", "nz", "cl", "cu", "pr", "ph", "mm", "vn", "kp", "gh", "tg", "bf", "dj", "so", "mz", "et", "il", "jo", "ma", "dz", "tn", "ly", "mr"],
  // Cross gang
  [tagData[6].id]: ["no", "se", "dk", "fi", "is", "ch", "gb", "ge", "do", "to", "dm"],
  // Animals & nature
  [tagData[7].id]: ["al", "me", "mx", "eg", "ke", "ug", "rw", "zw", "zm", "mw", "bz", "dm", "gd", "ca", "lk", "bt", "kz", "sz"],
  // The red family
  [tagData[8].id]: ["cn", "vn", "tr", "tn", "ma", "al", "me", "mk", "ch", "dk", "to", "sg", "id", "mc", "ba", "hr", "rs", "pg", "tl"],
  // Union Jack offspring
  [tagData[9].id]: ["au", "nz", "fj", "tv", "ck", "gb"],
  // Pan-African colours
  [tagData[10].id]: ["et", "gh", "gn", "ml", "sn", "cm", "bf", "tg", "bj", "ne", "td", "cf", "cg", "ga", "gq", "rw", "bi", "ke", "ug", "tz", "mz", "zw", "zm", "mw", "mg"],
  // Crescent club
  [tagData[11].id]: ["tr", "pk", "my", "tn", "dz", "ly", "mr", "az", "uz", "tm", "sg", "bn", "mv"],
  // Island life
  [tagData[12].id]: ["fj", "ws", "to", "tv", "ki", "nr", "vu", "sb", "pg", "cu", "jm", "ht", "tt", "bs", "bb", "gd", "ag", "dm", "kn", "lc", "vc", "cy", "mt", "mg", "mu", "sc", "km", "mv", "lk"],
  // My nemesis flags
  [tagData[13].id]: ["td", "ro", "mc", "id", "ml", "gn", "ci", "ie", "sn", "cm", "ad", "md", "sl", "sk", "hu", "bg", "ly", "er"],
  // Weirdly satisfying
  [tagData[14].id]: ["za", "np", "bt", "kz", "sz", "br", "bs", "sc", "ag", "mz", "ge", "kr", "jp", "ca", "mk", "ba"],
};

const insertFlagTag = db.prepare(`INSERT OR IGNORE INTO flag_tags (flag, tag_id, updated_at) VALUES (?, ?, ?)`);

// Assign each flag to its FIRST matching tag only (one tag per flag)
const assignedFlags = new Set<string>();
for (const [tagId, codes] of Object.entries(tagAssignments)) {
  for (const code of codes) {
    if (allFlagCodes.includes(code) && !assignedFlags.has(code)) {
      insertFlagTag.run(code, tagId, now);
      assignedFlags.add(code);
    }
  }
}

// Ensure EVERY remaining flag gets exactly one random tag
const unassigned = allFlagCodes.filter((c: string) => !assignedFlags.has(c));
console.log(`  Assigning ${unassigned.length} remaining untagged flags...`);
for (const code of unassigned) {
  const tag = randomChoice(tagData);
  insertFlagTag.run(code, tag.id, now);
}

// ── Sessions & Attempts (365 days of use) ─────────────────
console.log("Creating sessions and attempts (1 year of data)...");

const modes = ["classic", "pick-the-flag", "pick-the-country"];
const exitConditions = ["normal", "streak", "speed"];

const insertSession = db.prepare(`INSERT INTO sessions (id, mode, exit_condition, quick, started, ended, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);
const insertClassic = db.prepare(`INSERT INTO classic_attempts (id, session_id, flag, guess, correct, forgotten, confidence, reaction_time_ms, ts, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
const insertPickFlag = db.prepare(`INSERT INTO pick_flag_attempts (id, session_id, flag, guess, options, correct, confidence, reaction_time_ms, ts, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
const insertPickCountry = db.prepare(`INSERT INTO pick_country_attempts (id, session_id, flag, guess, options, correct, confidence, reaction_time_ms, ts, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

// Confusion pairs for realistic wrong guesses
const confusionPairs: Record<string, string[]> = {
  td: ["ro"], ro: ["td"], mc: ["id"], id: ["mc"], pl: ["sg", "id"], sg: ["pl", "id"],
  ie: ["ci"], ci: ["ie"], ml: ["gn"], gn: ["ml"], sn: ["cm"], cm: ["sn"],
  au: ["nz"], nz: ["au"], no: ["is"], is: ["no"], se: ["dk"], dk: ["se"],
  ad: ["md"], md: ["ad"], co: ["ec"], ec: ["co"], hu: ["it", "bg"], bg: ["hu"],
  sl: ["sk"], sk: ["sl"], ly: ["er"], er: ["ly"],
};

// Simulate improving accuracy over the year (start ~50%, end ~80%)
function accuracyForDay(dayOffset: number): number {
  const progress = 1 - (dayOffset / 365);
  return 0.45 + (progress * 0.35); // 45% -> 80%
}

// Simulate improving reaction time (start ~5s, end ~2s)
function reactionTimeForDay(dayOffset: number): number {
  const progress = 1 - (dayOffset / 365);
  const baseMs = 5000 - (progress * 3000); // 5000 -> 2000
  return Math.max(600, baseMs + randomInt(-800, 800));
}

// 1-3 sessions per day, some days off
let totalSessions = 0;
let totalAttempts = 0;

db.transaction(() => {
  for (let dayOffset = 365; dayOffset >= 0; dayOffset--) {
    // ~70% chance of playing on any given day
    if (Math.random() > 0.7) continue;

    const sessionsToday = randomInt(1, 3);
    for (let s = 0; s < sessionsToday; s++) {
      const sessionId = uuid();
      const mode = randomChoice(modes);
      const exitCondition = randomChoice(exitConditions);
      const quick = Math.random() > 0.6 ? 1 : 0;
      const started = dateAt(dayOffset);
      const ended = started;
      const createdAt = started;

      insertSession.run(sessionId, mode, exitCondition, quick, started, ended, createdAt);
      totalSessions++;

      const attemptCount = randomInt(8, 30);
      const dayAccuracy = accuracyForDay(dayOffset);

      for (let a = 0; a < attemptCount; a++) {
        const flag = randomChoice(allFlagCodes);
        const correct = Math.random() < dayAccuracy ? 1 : 0;
        const reactionTimeMs = Math.round(reactionTimeForDay(dayOffset));
        const confidence = correct
          ? randomChoice([2, 3, 3, 3, 4, 4])
          : randomChoice([1, 1, 2, 2]);
        const ts = started;
        const attemptId = uuid();

        if (mode === "classic") {
          let guess: string | null = null;
          const forgotten = correct ? 0 : (Math.random() > 0.8 ? 1 : 0);
          if (!correct && !forgotten) {
            const confused = confusionPairs[flag];
            guess = confused ? randomChoice(confused) : randomChoice(allFlagCodes);
          } else if (correct) {
            guess = flag;
          }
          insertClassic.run(attemptId, sessionId, flag, guess, correct, forgotten, confidence, reactionTimeMs, ts, createdAt);
        } else if (mode === "pick-the-flag") {
          const options = [flag];
          while (options.length < 4) {
            const opt = randomChoice(allFlagCodes);
            if (!options.includes(opt)) options.push(opt);
          }
          const guess = correct ? flag : randomChoice(options.filter((o: string) => o !== flag));
          insertPickFlag.run(attemptId, sessionId, flag, guess, JSON.stringify(options), correct, confidence, reactionTimeMs, ts, createdAt);
        } else {
          const options = [flag];
          while (options.length < 4) {
            const opt = randomChoice(allFlagCodes);
            if (!options.includes(opt)) options.push(opt);
          }
          const guess = correct ? flag : randomChoice(options.filter((o: string) => o !== flag));
          insertPickCountry.run(attemptId, sessionId, flag, guess, JSON.stringify(options), correct, confidence, reactionTimeMs, ts, createdAt);
        }
        totalAttempts++;
      }
    }
  }
})();

// ── Flag Progress (FSRS data + mnemonics for ALL flags) ───
console.log("Creating flag progress for all flags...");

const mnemonics: Record<string, string> = {
  us: "Stars and stripes - 50 stars for 50 states, 13 stripes for 13 colonies",
  gb: "Union Jack - combines England, Scotland, and Ireland crosses",
  fr: "Blue white red - liberté, égalité, fraternité. Vertical stripes!",
  de: "Black red gold horizontal - not Belgium which is vertical!",
  jp: "Circle of the rising sun on white - clean and simple",
  cn: "Red with yellow stars - big star = CCP, four small = social classes",
  br: "Green for forests, yellow diamond for gold, blue globe with stars and a banner",
  au: "Union Jack top-left + Southern Cross constellation on blue",
  ca: "Red and white with the iconic maple leaf - impossible to forget",
  in: "Saffron white green with Ashoka Chakra wheel in the middle",
  np: "Only non-rectangular flag in the world! Two stacked triangles - Nepal is special",
  ch: "White cross on red square - one of only two square flags (Vatican is the other)",
  it: "Green white red vertical - think pizza! Green basil, white mozzarella, red tomato",
  td: "Blue yellow red vertical - ALMOST identical to Romania! Chad has darker blue",
  ro: "Blue yellow red vertical - nearly identical to Chad but slightly lighter blue",
  mc: "Red over white - looks exactly like Indonesia but shorter and wider",
  id: "Red over white - looks exactly like Monaco but taller and narrower",
  ie: "Green white orange vertical - NOT the same as Ivory Coast which is reversed!",
  ci: "Orange white green vertical - reverse of Ireland! Côte d'Ivoire starts with orange",
  tr: "Red with white crescent and star - the classic Turkish moon",
  no: "Blue cross on red with white outline - Norwegian Nordic cross",
  se: "Yellow/gold cross on blue - Swedish Nordic cross, IKEA colours!",
  dk: "White cross on red - the Dannebrog, oldest flag in the world!",
  is: "Red cross on blue with white outline - Iceland's Nordic cross",
  al: "Double-headed black eagle on red - the Albanian eagle is fierce",
  za: "Rainbow nation Y-shape with 6 colours - most colourful flag ever",
  kr: "White with red-blue yin-yang (taeguk) and four trigrams in corners",
  mx: "Green white red with eagle eating a snake on a cactus - what a scene!",
  lk: "Lion holding a sword on maroon with orange/green stripes - Sri Lanka's lion is boss",
  bt: "Dragon on diagonally split orange and yellow - Bhutan's thunder dragon",
  kz: "Sky blue with golden sun and soaring eagle - Kazakhstan's steppe eagle",
  eg: "Red white black horizontal with golden eagle of Saladin",
  ar: "Light blue and white horizontal stripes with Sun of May",
  ru: "White blue red horizontal - Russia's tricolour",
  es: "Red yellow red horizontal with coat of arms - Spain's bold stripes",
  pt: "Green and red vertical split with armillary sphere",
  gr: "Blue and white horizontal stripes with cross in canton",
  nl: "Red white blue horizontal - the Dutch tricolour, OG of tricolours",
  be: "Black yellow red vertical - Belgian frites colours (not really)",
  at: "Red white red horizontal - Austrian stripes, legend says blood-stained tunic",
  pl: "White over red - looks like Indonesia/Monaco flipped!",
  sg: "Red over white with crescent and stars - Singapore's tiny flag",
  fi: "Blue cross on white - Finland's Nordic cross, cool and clean",
  ee: "Blue black white horizontal - Estonia's moody palette",
  lt: "Yellow green red horizontal - Lithuania's traffic light flag",
  lv: "Maroon white maroon horizontal - Latvia's unique dark red",
  bg: "White green red horizontal - Bulgaria, not Hungary!",
  hu: "Red white green horizontal - Hungary, not Bulgaria!",
  hr: "Red white blue horizontal with checkerboard coat of arms",
  rs: "Red blue white horizontal with coat of arms - Serbia's tricolour",
  ba: "Blue triangle with white stars and yellow triangle - Bosnia's modern design",
  mk: "Red with golden sun rays spreading from centre - North Macedonia",
  me: "Red with golden double-headed eagle - Montenegro means Black Mountain",
  ge: "White with red cross and four small crosses - Georgia's five-cross flag",
  cy: "White with copper-coloured island silhouette and olive branches",
  mt: "White and red vertical with George Cross medal in corner",
  lu: "Red white blue horizontal - Luxembourg, similar to Netherlands but lighter blue",
  pk: "Green with white crescent and star plus white stripe - Pakistan",
  my: "Red and white stripes with blue canton, crescent and star - Malaysia",
  ph: "Blue and red horizontal with white triangle and sun with 8 rays",
  vn: "Red with large yellow star - Vietnam's simple but bold design",
  th: "Red white blue white red horizontal - Thailand's elephant-free flag",
  mm: "Yellow green red horizontal with white star - Myanmar",
  kh: "Blue red blue horizontal with Angkor Wat temple - Cambodia",
  la: "Red blue red horizontal with white circle - Laos",
  bd: "Green with red circle offset to the left - Bangladesh",
  mv: "Red border, green rectangle with white crescent - Maldives",
  jm: "Green and black with golden X saltire - Jamaica's unique design",
  cu: "Blue and white stripes with red triangle and white star - Cuba",
  ht: "Blue and red horizontal with coat of arms - Haiti",
  do: "Red and blue quartered with white cross - Dominican Republic",
  tt: "Red with black diagonal stripe bordered in white - Trinidad",
  bs: "Aquamarine and gold stripes with black triangle - Bahamas beach vibes",
  bb: "Blue and gold vertical with trident - Barbados",
  ke: "Black red green horizontal with Maasai shield and spears",
  tz: "Green and blue diagonal with black and yellow stripes - Tanzania",
  ug: "Black yellow red horizontal repeated with crane in circle - Uganda",
  rw: "Blue yellow green horizontal with sun in top right - Rwanda",
  et: "Green yellow red horizontal with blue circle and star - Ethiopia",
  gh: "Red gold green horizontal with black star - Ghana",
  ng: "Green white green vertical - Nigeria's simple design",
  sn: "Green yellow red vertical with green star - Senegal",
  cm: "Green red yellow vertical with star - Cameroon",
  ma: "Red with green pentacle star - Morocco",
  dz: "Green and white vertical with red crescent and star - Algeria",
  tn: "Red with white circle containing red crescent and star - Tunisia",
  sa: "Green with Arabic script and sword - Saudi Arabia",
  ae: "Red green white black - UAE's four-colour flag",
  qa: "Maroon and white with serrated edge - Qatar's unique shape",
  il: "White with blue Star of David between two blue stripes - Israel",
  jo: "Black white green horizontal with red triangle and star - Jordan",
  lb: "Red white red horizontal with cedar tree - Lebanon",
  iq: "Red white black horizontal with green Arabic script - Iraq",
  ir: "Green white red horizontal with emblem and Allah script - Iran",
  af: "Black red green vertical with mosque emblem - Afghanistan",
  uz: "Blue white green horizontal with crescent and stars - Uzbekistan",
  tm: "Green with ornate carpet pattern stripe and crescent - Turkmenistan, most detailed flag!",
  az: "Blue red green horizontal with crescent and star - Azerbaijan",
  pe: "Red white red vertical - Peru",
  co: "Yellow blue red horizontal (yellow is double width) - Colombia",
  ec: "Yellow blue red horizontal with coat of arms - Ecuador",
  ve: "Yellow blue red horizontal with arc of stars - Venezuela",
  cl: "White and red horizontal with blue canton and white star - Chile",
  uy: "White and blue stripes with Sun of May in canton - Uruguay",
  py: "Red white blue horizontal with different emblems on each side - Paraguay is unique!",
  bo: "Red yellow green horizontal - Bolivia",
  sc: "Radiating coloured bands from bottom-left corner - Seychelles, the rainbow burst!",
  fj: "Light blue with Union Jack and shield with Fijian symbols",
  ws: "Red with blue canton containing Southern Cross - Samoa",
  to: "Red with white canton containing red cross - Tonga",
  nz: "Blue with Union Jack and four red stars with white borders - New Zealand",
};

const insertProgress = db.prepare(`INSERT OR REPLACE INTO flag_progress (flag, mnemonic, stability, difficulty, state, last_review, due, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

db.transaction(() => {
  for (const flag of flags) {
    const code: string = flag.code;
    // Simulate varied FSRS states - more flags in review after a year
    const stateWeights = [0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3];
    const state = randomChoice(stateWeights);

    let stability: number | null = null;
    let difficulty: number | null = null;
    let lastReview: string | null = null;
    let due: string | null = null;

    if (state > 0) {
      // Review state flags have high stability
      if (state === 2) {
        stability = randomInt(10, 200); // 10-200 days for well-learned flags
      } else if (state === 1) {
        stability = Math.random() * 5 + 0.5; // 0.5-5.5 days for learning
      } else {
        stability = Math.random() * 3 + 0.2; // relearning
      }
      difficulty = Math.random() * 8 + 1; // 1-9
      lastReview = dateAt(randomInt(0, 14));
      const dueOffset = randomInt(-3, 30);
      due = dateAt(-dueOffset);
    }

    const mnemonic: string = mnemonics[code] || "";

    insertProgress.run(code, mnemonic, stability, difficulty, state, lastReview, due, now);
  }
})();

// ── Presentation config ───────────────────────────────────
console.log("Setting presentation config...");

const config = {
  tag_order: tagData.map(t => t.id),
  show_title_slide: true,
  show_end_slide: true,
  show_analytics: true,
  show_mnemonics: true,
};

db.prepare(`INSERT OR REPLACE INTO settings (key, value, type, label, category) VALUES (?, ?, ?, ?, ?)`).run(
  "presentation_config",
  JSON.stringify(config),
  "string",
  "Presentation config",
  "Presentation",
);

// ── Summary ───────────────────────────────────────────────
const tagCount = (db.prepare("SELECT COUNT(*) as c FROM tags").get() as any).c;
const flagTagCount = (db.prepare("SELECT COUNT(*) as c FROM flag_tags").get() as any).c;
const sessionCount = (db.prepare("SELECT COUNT(*) as c FROM sessions").get() as any).c;
const classicCount = (db.prepare("SELECT COUNT(*) as c FROM classic_attempts").get() as any).c;
const pickFlagCount = (db.prepare("SELECT COUNT(*) as c FROM pick_flag_attempts").get() as any).c;
const pickCountryCount = (db.prepare("SELECT COUNT(*) as c FROM pick_country_attempts").get() as any).c;
const progressCount = (db.prepare("SELECT COUNT(*) as c FROM flag_progress").get() as any).c;
const mnemonicCount = (db.prepare("SELECT COUNT(*) as c FROM flag_progress WHERE mnemonic != ''").get() as any).c;

console.log("\nDone! Mock data seeded (1 year of use):");
console.log(`  - ${tagCount} tags`);
console.log(`  - ${flagTagCount} flag-tag assignments (every flag tagged)`);
console.log(`  - ${sessionCount} sessions`);
console.log(`  - ${classicCount + pickFlagCount + pickCountryCount} total attempts (${classicCount} classic, ${pickFlagCount} pick-flag, ${pickCountryCount} pick-country)`);
console.log(`  - ${progressCount} flag progress records`);
console.log(`  - ${mnemonicCount} mnemonics`);
console.log(`  - Presentation config with all ${tagCount} tags selected`);
