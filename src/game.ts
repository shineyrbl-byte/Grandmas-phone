import { FLAGS, MESSAGES, START_SAVINGS, type FlagId, type Message } from "./data/messages";

export type Decision = "safe" | "scam";

/** Tap targets: "sender", "link", or a segment index as a string ("0", "1", …). */
export type TapId = string;

export const POINTS = { correct: 100, flag: 25, wrongTap: 5 };
export const START_MOOD = 70;
export const VERIFIES_PER_DAY = 2;

/** Every red flag hidden in a message, keyed by where it is. */
export function flagTargets(msg: Message): Map<TapId, FlagId> {
  const map = new Map<TapId, FlagId>();
  if (msg.sender.flag) map.set("sender", "sender");
  if (msg.link?.flag) map.set("link", "link");
  msg.segments.forEach((s, i) => {
    if (s.flag) map.set(String(i), s.flag);
  });
  return map;
}

export interface Result {
  messageId: string;
  decision: Decision;
  correct: boolean;
  found: FlagId[];
  missed: FlagId[];
  wrongTaps: number;
  points: number;
  savingsDelta: number;
  moodDelta: number;
  outcome: string;
}

export function judge(msg: Message, taps: Set<TapId>, decision: Decision): Result {
  const targets = flagTargets(msg);
  const found: FlagId[] = [];
  const missed: FlagId[] = [];
  for (const [id, flag] of targets) (taps.has(id) ? found : missed).push(flag);
  const wrongTaps = [...taps].filter((id) => !targets.has(id)).length;

  const correct = (decision === "scam") === msg.scam;
  const points = Math.max(
    0,
    (correct ? POINTS.correct : 0) + found.length * POINTS.flag - wrongTaps * POINTS.wrongTap,
  );

  let savingsDelta = 0;
  let moodDelta = 0;
  let outcome: string;
  if (msg.scam) {
    if (decision === "scam") {
      moodDelta = 3;
      outcome = msg.ifBlocked;
    } else {
      savingsDelta = msg.risk ? -msg.risk : 0;
      moodDelta = -10;
      outcome = msg.ifAllowed;
    }
  } else if (decision === "safe") {
    moodDelta = 8;
    outcome = msg.ifAllowed;
  } else {
    // Blocking a real message: Grandma loses touch, and ignoring a real fraud alert costs money.
    savingsDelta = msg.risk ? -msg.risk : 0;
    moodDelta = -15;
    outcome = msg.ifBlocked;
  }

  return { messageId: msg.id, decision, correct, found, missed, wrongTaps, points, savingsDelta, moodDelta, outcome };
}

export interface GameState {
  index: number;
  savings: number;
  mood: number;
  score: number;
  verifiesLeft: number;
  results: Result[];
}

export function newGame(): GameState {
  return { index: 0, savings: START_SAVINGS, mood: START_MOOD, score: 0, verifiesLeft: VERIFIES_PER_DAY, results: [] };
}

export const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function applyResult(state: GameState, r: Result): GameState {
  const next = state.index + 1;
  const newDay = next < MESSAGES.length && MESSAGES[next].day !== MESSAGES[state.index].day;
  return {
    index: next,
    savings: Math.max(0, state.savings + r.savingsDelta),
    mood: clamp(state.mood + r.moodDelta, 0, 100),
    score: state.score + r.points,
    verifiesLeft: newDay ? VERIFIES_PER_DAY : state.verifiesLeft,
    results: [...state.results, r],
  };
}

export function summary(state: GameState) {
  const byId = new Map(MESSAGES.map((m) => [m.id, m]));
  const scams = state.results.filter((r) => byId.get(r.messageId)!.scam);
  const real = state.results.filter((r) => !byId.get(r.messageId)!.scam);
  const flagStats = Object.fromEntries(
    (Object.keys(FLAGS) as FlagId[]).map((f) => [f, { found: 0, total: 0 }]),
  ) as Record<FlagId, { found: number; total: number }>;
  for (const r of state.results) {
    for (const f of r.found) (flagStats[f].found++, flagStats[f].total++);
    for (const f of r.missed) flagStats[f].total++;
  }
  const flagsFound = state.results.reduce((a, r) => a + r.found.length, 0);
  const flagsTotal = state.results.reduce((a, r) => a + r.found.length + r.missed.length, 0);
  const correct = state.results.filter((r) => r.correct).length;
  return {
    scamsCaught: scams.filter((r) => r.correct).length,
    scamsTotal: scams.length,
    realKept: real.filter((r) => r.correct).length,
    realTotal: real.length,
    flagsFound,
    flagsTotal,
    correct,
    flagStats,
    rank: rankFor(correct, state.results.length),
  };
}

export function rankFor(correct: number, total: number) {
  const pct = total ? correct / total : 0;
  if (pct === 1) return { title: "Scam Buster Supreme", emoji: "🏆", line: "Not a single scam got past you, and Grandma never missed a thing." };
  if (pct >= 0.85) return { title: "Family Guardian", emoji: "🛡️", line: "Grandma is lucky to have you looking out for her." };
  if (pct >= 0.65) return { title: "Scam Spotter", emoji: "🔍", line: "You caught most of them. A few tricky ones slipped through." };
  if (pct >= 0.4) return { title: "Learning the Ropes", emoji: "📚", line: "Scammers are sneaky! Check the red flags and try again." };
  return { title: "Scammers' Favorite", emoji: "🎣", line: "Ouch. The good news: every red flag you learn makes the next scam easier to spot." };
}
