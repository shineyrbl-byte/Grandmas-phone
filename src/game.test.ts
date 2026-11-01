import { describe, expect, it } from "vitest";
import { DAYS, FLAGS, MESSAGES, START_SAVINGS } from "./data/messages";
import { applyResult, flagTargets, judge, newGame, POINTS, summary, VERIFIES_PER_DAY } from "./game";

const msg = (id: string) => MESSAGES.find((m) => m.id === id)!;

describe("content", () => {
  it("has 4 messages for each of the 5 days, in order", () => {
    expect(MESSAGES).toHaveLength(20);
    DAYS.forEach((_, d) => expect(MESSAGES.filter((m) => m.day === d)).toHaveLength(4));
    MESSAGES.forEach((m, i) => i && expect(m.day).toBeGreaterThanOrEqual(MESSAGES[i - 1].day));
  });

  it("gives every scam at least two red flags and every real message none", () => {
    for (const m of MESSAGES) {
      const n = flagTargets(m).size;
      if (m.scam) expect(n, m.id).toBeGreaterThanOrEqual(2);
      else expect(n, m.id).toBe(0);
    }
  });

  it("uses only known flags and unique ids", () => {
    expect(new Set(MESSAGES.map((m) => m.id)).size).toBe(MESSAGES.length);
    for (const m of MESSAGES) for (const f of flagTargets(m).values()) expect(FLAGS[f]).toBeDefined();
  });

  it("mixes real messages in so blocking everything doesn't win", () => {
    const real = MESSAGES.filter((m) => !m.scam).length;
    expect(real).toBeGreaterThanOrEqual(6);
  });
});

describe("judge", () => {
  it("rewards blocking a scam and every red flag found", () => {
    const r = judge(msg("lottery"), new Set(["sender", "link", "0", "1", "2"]), "scam");
    expect(r.correct).toBe(true);
    expect(r.missed).toEqual([]);
    expect(r.points).toBe(POINTS.correct + 5 * POINTS.flag);
    expect(r.savingsDelta).toBe(0);
  });

  it("costs Grandma money when a scam gets through", () => {
    const r = judge(msg("voice-clone"), new Set(), "safe");
    expect(r.correct).toBe(false);
    expect(r.savingsDelta).toBe(-3000);
    expect(r.moodDelta).toBeLessThan(0);
    expect(r.missed.length).toBeGreaterThan(0);
  });

  it("hurts Grandma's mood when a real message is blocked", () => {
    const r = judge(msg("priya-lunch"), new Set(), "scam");
    expect(r.correct).toBe(false);
    expect(r.moodDelta).toBe(-15);
    expect(r.savingsDelta).toBe(0);
  });

  it("charges the real fraud alert's amount when you ignore it", () => {
    expect(judge(msg("bank-fraud-alert"), new Set(), "scam").savingsDelta).toBe(-612);
    expect(judge(msg("bank-fraud-alert"), new Set(), "safe").savingsDelta).toBe(0);
  });

  it("takes points off for tapping normal text, but never goes negative", () => {
    const r = judge(msg("clinic"), new Set(["0", "1", "2", "sender"]), "safe");
    expect(r.wrongTaps).toBe(4);
    expect(r.points).toBe(POINTS.correct - 4 * POINTS.wrongTap);
    expect(judge(msg("clinic"), new Set(["0", "1", "2", "sender"]), "scam").points).toBe(0);
  });
});

describe("a full week", () => {
  it("a perfect run keeps all savings and finds every flag", () => {
    let s = newGame();
    for (const m of MESSAGES) {
      const taps = new Set(flagTargets(m).keys());
      s = applyResult(s, judge(m, taps, m.scam ? "scam" : "safe"));
    }
    const sum = summary(s);
    expect(s.savings).toBe(START_SAVINGS);
    expect(sum.correct).toBe(20);
    expect(sum.flagsFound).toBe(sum.flagsTotal);
    expect(sum.rank.title).toBe("Scam Buster Supreme");
  });

  it("blocking everything protects money but leaves Grandma lonely", () => {
    let s = newGame();
    for (const m of MESSAGES) s = applyResult(s, judge(m, new Set(), "scam"));
    expect(s.mood).toBeLessThan(40);
    expect(summary(s).realKept).toBe(0);
  });

  it("savings never drop below zero", () => {
    let s = newGame();
    for (const m of MESSAGES) s = applyResult(s, judge(m, new Set(), "safe"));
    expect(s.savings).toBe(0);
  });

  it("refills check-another-way uses each morning", () => {
    let s = { ...newGame(), verifiesLeft: 0 };
    for (let i = 0; i < 4; i++) s = applyResult(s, judge(MESSAGES[i], new Set(), "safe"));
    expect(s.verifiesLeft).toBe(VERIFIES_PER_DAY);
  });
});
