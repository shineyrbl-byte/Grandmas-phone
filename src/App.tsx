import { useCallback, useEffect, useRef, useState } from "react";
import { DAYS, FLAGS, KIND_LABEL, MESSAGES, START_SAVINGS, type FlagId, type Message } from "./data/messages";
import { applyResult, judge, newGame, summary, VERIFIES_PER_DAY, type Decision, type GameState, type Result, type TapId } from "./game";

type Screen = "title" | "day" | "play" | "end";

const money = (n: number) => "$" + n.toLocaleString("en-US");
const moodFace = (m: number) => (m >= 80 ? "😄" : m >= 60 ? "🙂" : m >= 40 ? "😐" : m >= 20 ? "😟" : "😢");
const clockFor = (m: Message) => {
  const i = MESSAGES.filter((x) => x.day === m.day).indexOf(m);
  const mins = 8 * 60 + 30 + i * 150;
  const h = Math.floor(mins / 60);
  return `${((h + 11) % 12) + 1}:${String(mins % 60).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("title");
  const [game, setGame] = useState<GameState>(newGame);
  const [big, setBig] = useState(() => localStorage.getItem("gp.big") === "1");

  useEffect(() => {
    document.documentElement.classList.toggle("big", big);
    localStorage.setItem("gp.big", big ? "1" : "0");
  }, [big]);

  const start = () => {
    setGame(newGame());
    setScreen("day");
  };

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => setScreen("title")} aria-label="Grandma's Phone, back to title screen">
          <span aria-hidden>📱</span> Grandma's Phone
        </button>
        <button className="chip" aria-pressed={big} onClick={() => setBig((b) => !b)}>
          <span aria-hidden>🔎</span> {big ? "Normal text" : "Larger text"}
        </button>
      </header>
      <main id="main">
        {screen === "title" && <Title onPlay={start} />}
        {screen === "day" && <DayIntro day={MESSAGES[game.index].day} game={game} onGo={() => setScreen("play")} />}
        {screen === "play" && (
          <Play
            key={game.index}
            game={game}
            onDone={(r, usedVerify) => {
              const before = MESSAGES[game.index];
              const next = applyResult({ ...game, verifiesLeft: game.verifiesLeft - (usedVerify ? 1 : 0) }, r);
              setGame(next);
              window.scrollTo({ top: 0 });
              if (next.index >= MESSAGES.length) setScreen("end");
              else if (MESSAGES[next.index].day !== before.day) setScreen("day");
            }}
          />
        )}
        {screen === "end" && <End game={game} onAgain={start} />}
      </main>
    </div>
  );
}

/* ───────────────────────── Title ───────────────────────── */

function Title({ onPlay }: { onPlay: () => void }) {
  return (
    <section className="title-screen">
      <div className="title-art" aria-hidden>
        <div className="mini-phone">
          <div className="notif n1">🎁 You WON $50,000!!</div>
          <div className="notif n2">🌻 Priya: Sunday lunch? 🍋</div>
          <div className="notif n3">📦 USPS: package on hold</div>
          <div className="notif n4">🎙️ "Gran, it's me…"</div>
        </div>
        <div className="title-gran">👵</div>
      </div>
      <div className="title-copy">
        <h1>Grandma's Phone</h1>
        <p className="lede">
          Grandma Rosa's phone won't stop buzzing. Some messages are from the people she loves. Some are scams. Keep her savings
          safe, <strong>without cutting her off from her family.</strong>
        </p>
        <ol className="howto">
          <li><span aria-hidden>📨</span><span>Read each message on Grandma's phone.</span></li>
          <li><span aria-hidden>🚩</span><span>Tap anything that looks suspicious to flag it.</span></li>
          <li><span aria-hidden>📞</span><span>Not sure? Check another way, like calling the real person.</span></li>
          <li><span aria-hidden>⚖️</span><span>Decide: <b>safe</b> or <b>scam</b>. Careful: blocking real messages makes Grandma lonely!</span></li>
        </ol>
        <button className="btn primary big-btn" onClick={onPlay} autoFocus>
          ▶ Start the week
        </button>
        <p className="small muted">5 days · 20 messages · about 10 minutes · no sign-up · works with a keyboard</p>
      </div>
    </section>
  );
}

/* ───────────────────────── Day intro ───────────────────────── */

function DayIntro({ day, game, onGo }: { day: number; game: GameState; onGo: () => void }) {
  const d = DAYS[day];
  return (
    <section className="day-screen" aria-labelledby="day-title">
      <p className="eyebrow">Day {day + 1} of 5</p>
      <h1 id="day-title">{d.name}</h1>
      <div className="gran-say big-say">
        <span className="gran-avatar" aria-hidden>👵</span>
        <p>"{d.intro}"</p>
      </div>
      <Week day={day} />
      <div className="day-stats">
        <span>💰 Savings: <b>{money(game.savings)}</b></span>
        <span>{moodFace(game.mood)} Happiness: <b>{game.mood}%</b></span>
        <span>⭐ Score: <b>{game.score}</b></span>
      </div>
      <p className="muted">You can check {VERIFIES_PER_DAY} messages another way today.</p>
      <button className="btn primary big-btn" onClick={onGo} autoFocus>
        Open Grandma's phone →
      </button>
    </section>
  );
}

function Week({ day }: { day: number }) {
  return (
    <ol className="week" aria-label="Week progress">
      {DAYS.map((d, i) => (
        <li key={d.name} className={i < day ? "done" : i === day ? "now" : ""} aria-current={i === day ? "step" : undefined}>
          {d.name.slice(0, 3)}
        </li>
      ))}
    </ol>
  );
}

/* ───────────────────────── Play ───────────────────────── */

function Play({ game, onDone }: { game: GameState; onDone: (r: Result, usedVerify: boolean) => void }) {
  const msg = MESSAGES[game.index];
  const [taps, setTaps] = useState<Set<TapId>>(new Set());
  const [inspected, setInspected] = useState({ sender: false, link: false });
  const [verified, setVerified] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [live, setLive] = useState("");
  const dayMsgs = MESSAGES.filter((m) => m.day === msg.day);
  const posInDay = dayMsgs.indexOf(msg) + 1;
  const verifiesLeft = game.verifiesLeft - (verified ? 1 : 0);
  const canCheck = !!msg.verify && !verified && game.verifiesLeft > 0;

  const toggle = (id: TapId, label: string) => {
    const on = !taps.has(id);
    const next = new Set(taps);
    if (on) next.add(id);
    else next.delete(id);
    setTaps(next);
    setLive(on ? `Flagged as suspicious: ${label}` : `Removed flag from: ${label}`);
  };

  const decide = useCallback((d: Decision) => setResult((r) => r ?? judge(msg, taps, d)), [msg, taps]);
  const check = useCallback(() => {
    if (canCheck && !result) setVerified(true);
  }, [canCheck, result]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (result || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "s") decide("safe");
      else if (k === "b") decide("scam");
      else if (k === "c") check();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide, check, result]);

  const kind = KIND_LABEL[msg.kind];
  const isCall = msg.kind === "call" || msg.kind === "voice";
  const fromLabel = msg.kind === "voice" ? "Voice note from" : msg.kind === "call" ? "Incoming call" : "From";

  return (
    <div className="play">
      <aside className="side" aria-label="Grandma's status">
        <div className="gran-card">
          <div className="gran-top">
            <span className="gran-avatar lg" aria-hidden>👵</span>
            <div>
              <h2>Grandma Rosa</h2>
              <p className="muted small">
                {DAYS[msg.day].name} · message {posInDay} of {dayMsgs.length}
              </p>
            </div>
          </div>
          <Meter label="Savings" icon="💰" value={game.savings} max={START_SAVINGS} text={money(game.savings)} tone="money" />
          <Meter label="Happiness" icon={moodFace(game.mood)} value={game.mood} max={100} text={`${game.mood}%`} tone="mood" />
          <p className="score">⭐ Score <b>{game.score}</b></p>
          <Week day={msg.day} />
        </div>
        <FieldGuide />
      </aside>

      <section className="center" aria-label="Grandma's phone">
        <div className="gran-say">
          <span className="gran-avatar" aria-hidden>👵</span>
          <p>"{msg.grandma}"</p>
        </div>

        <div className={`phone kind-${msg.kind}`}>
          <div className="phone-status" aria-hidden>
            <span>{clockFor(msg)}</span>
            <span>📶 🔋</span>
          </div>
          <div className="app-bar">
            <span aria-hidden>{kind.icon}</span> {kind.app}
          </div>

          <div className={isCall ? "call-head" : "sender-row"}>
            {isCall && <div className="caller-avatar" aria-hidden>{msg.kind === "voice" ? "🎙️" : "📞"}</div>}
            <span className="from-label">{fromLabel}</span>
            <Flaggable id="sender" taps={taps} onToggle={toggle} label={`Sender: ${msg.sender.name}`} className="sender-chip">
              {msg.sender.name}
            </Flaggable>
            <button className="inspect" aria-expanded={inspected.sender} onClick={() => setInspected((s) => ({ ...s, sender: true }))} disabled={inspected.sender}>
              🔍 {inspected.sender ? "Checked" : "Who is this really?"}
            </button>
            {inspected.sender && <p className="reveal" role="note">{msg.sender.detail}</p>}
          </div>

          <div className={isCall ? "transcript" : "bubble"}>
            {msg.segments.map((s, i) => (
              <Flaggable key={i} id={String(i)} taps={taps} onToggle={toggle} label={`"${s.t.trim()}"`}>
                {s.t}
              </Flaggable>
            ))}
            {msg.link && (
              <div className="link-row">
                <Flaggable id="link" taps={taps} onToggle={toggle} label={`Link: ${msg.link.label}`} className="link-chip">
                  🔗 {msg.link.label}
                </Flaggable>
                <button className="inspect" aria-expanded={inspected.link} onClick={() => setInspected((s) => ({ ...s, link: true }))} disabled={inspected.link}>
                  🔍 {inspected.link ? "Checked" : "Where does it really go?"}
                </button>
                {inspected.link && <p className="reveal" role="note">{msg.link.real}</p>}
              </div>
            )}
          </div>

          {verified && msg.verify && (
            <div className="verify-note" role="status">
              <b>📞 {msg.verify.action}</b>
              <p>{msg.verify.result}</p>
            </div>
          )}
        </div>

        <p className="hint">
          <span aria-hidden>👆</span> Tap any part that looks suspicious to flag it 🚩. Tap again to unflag. 🔍 buttons are free to use.
        </p>
        <div className="sr-only" aria-live="polite">{live}</div>

        <div className="actions">
          <button className="btn ghost" onClick={check} disabled={!canCheck} title={!msg.verify ? "There's no other way to check this one. Trust the red flags!" : undefined}>
            📞 Check another way{" "}
            <span className="muted">{!msg.verify ? "(not possible here)" : verified ? "(done)" : `(${verifiesLeft} left today)`}</span>
            <kbd>C</kbd>
          </button>
          <div className="decide">
            <button className="btn safe" onClick={() => decide("safe")}>
              ✅ Safe: let Grandma reply <kbd>S</kbd>
            </button>
            <button className="btn scam" onClick={() => decide("scam")}>
              🚫 Scam: block &amp; report <kbd>B</kbd>
            </button>
          </div>
        </div>
      </section>

      {result && <Feedback msg={msg} result={result} onNext={() => onDone(result, verified)} last={game.index === MESSAGES.length - 1} />}
    </div>
  );
}

function Flaggable({
  id,
  taps,
  onToggle,
  label,
  className = "",
  children,
}: {
  id: TapId;
  taps: Set<TapId>;
  onToggle: (id: TapId, label: string) => void;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  const on = taps.has(id);
  // A span (not a button) so long sentences wrap naturally inside the message bubble.
  return (
    <span
      role="button"
      tabIndex={0}
      className={`flaggable ${className} ${on ? "flagged" : ""}`}
      aria-pressed={on}
      aria-label={`${label}. ${on ? "Flagged as suspicious." : "Tap to flag as suspicious."}`}
      onClick={() => onToggle(id, label)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle(id, label);
        }
      }}
    >
      {on && <span className="flag-pin" aria-hidden>🚩</span>}
      {children}
    </span>
  );
}

function Meter({ label, icon, value, max, text, tone }: { label: string; icon: string; value: number; max: number; text: string; tone: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className={`meter ${tone}`}>
      <div className="meter-top">
        <span>
          <span aria-hidden>{icon}</span> {label}
        </span>
        <b>{text}</b>
      </div>
      <div className="meter-track" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-valuetext={text}>
        <div className="meter-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function FieldGuide() {
  return (
    <details className="guide" open>
      <summary>🚩 Red flag field guide</summary>
      <ul>
        {(Object.keys(FLAGS) as FlagId[]).map((f) => (
          <li key={f}>
            <span aria-hidden>{FLAGS[f].icon}</span>
            <div>
              <b>{FLAGS[f].name}</b>
              <p>{FLAGS[f].tip}</p>
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}

/* ───────────────────────── Feedback ───────────────────────── */

function Feedback({ msg, result, onNext, last }: { msg: Message; result: Result; onNext: () => void; last: boolean }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const headline = result.correct
    ? msg.scam
      ? { icon: "🛡️", text: "Nice catch! That was a scam.", tone: "good" }
      : { icon: "💛", text: "Right! That one was real.", tone: "good" }
    : msg.scam
      ? { icon: "😬", text: "Oh no, that was a scam!", tone: "bad" }
      : { icon: "💔", text: "Oops, that message was real.", tone: "bad" };

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="fb-title">
      <div className={`feedback ${headline.tone}`}>
        <h2 id="fb-title">
          <span aria-hidden>{headline.icon}</span> {headline.text}
        </h2>
        <p className="outcome">{result.outcome}</p>

        <div className="deltas">
          <span className={result.savingsDelta < 0 ? "neg" : "pos"}>💰 {result.savingsDelta < 0 ? `−${money(-result.savingsDelta)}` : "Savings safe"}</span>
          <span className={result.moodDelta < 0 ? "neg" : "pos"}>
            {result.moodDelta < 0 ? "😢" : "😊"} Happiness {result.moodDelta > 0 ? "+" : ""}
            {result.moodDelta}
          </span>
          <span className="pos">⭐ +{result.points}</span>
        </div>

        {msg.scam && (
          <div className="flags-review">
            <h3>Red flags in this message</h3>
            <ul>
              {result.found.map((f, i) => (
                <li key={"f" + i} className="found">
                  <span className="mark" aria-label="Spotted">✅</span>
                  <span aria-hidden>{FLAGS[f].icon}</span>
                  <span><b>{FLAGS[f].name}</b> <span className="muted">You spotted it!</span></span>
                </li>
              ))}
              {result.missed.map((f, i) => (
                <li key={"m" + i} className="missed">
                  <span className="mark" aria-label="Missed">⭕</span>
                  <span aria-hidden>{FLAGS[f].icon}</span>
                  <span><b>{FLAGS[f].name}</b> <span className="muted">{FLAGS[f].tip}</span></span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {result.wrongTaps > 0 && (
          <p className="small muted">
            You flagged {result.wrongTaps} normal {result.wrongTaps === 1 ? "part" : "parts"} (−{result.wrongTaps * 5} points). Not everything is suspicious!
          </p>
        )}

        <div className="lesson">
          <b>💡 Remember</b>
          <p>{msg.lesson}</p>
        </div>

        <button ref={ref} className="btn primary big-btn" onClick={onNext}>
          {last ? "See Grandma's week →" : "Next message →"}
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── End ───────────────────────── */

function End({ game, onAgain }: { game: GameState; onAgain: () => void }) {
  const s = summary(game);
  const weakest = (Object.keys(FLAGS) as FlagId[])
    .filter((f) => s.flagStats[f].total > 0)
    .sort((a, b) => s.flagStats[a].found / s.flagStats[a].total - s.flagStats[b].found / s.flagStats[b].total)[0];

  return (
    <section className="end">
      <div className="end-hero">
        <div className="rank-emoji" aria-hidden>{s.rank.emoji}</div>
        <p className="eyebrow">Grandma's week is over</p>
        <h1>{s.rank.title}</h1>
        <p className="lede">{s.rank.line}</p>
      </div>

      <div className="stats">
        <Stat big={money(game.savings)} small={`of ${money(START_SAVINGS)} savings kept`} />
        <Stat big={`${moodFace(game.mood)} ${game.mood}%`} small="Grandma's happiness" />
        <Stat big={`${s.scamsCaught}/${s.scamsTotal}`} small="scams blocked" />
        <Stat big={`${s.realKept}/${s.realTotal}`} small="real messages delivered" />
        <Stat big={`${s.flagsFound}/${s.flagsTotal}`} small="red flags spotted" />
        <Stat big={String(game.score)} small="final score" />
      </div>

      {weakest && s.flagStats[weakest].found < s.flagStats[weakest].total && (
        <p className="tip-box">
          <b>Your blind spot:</b> {FLAGS[weakest].icon} {FLAGS[weakest].name}. {FLAGS[weakest].tip}
        </p>
      )}

      <div className="cheat" id="cheat-sheet">
        <h2>📋 Scam-spotting cheat sheet</h2>
        <p className="muted">Print it, or show it to the older people in your life. Talking about scams is one of the best ways to stop them.</p>
        <div className="cheat-grid">
          {(Object.keys(FLAGS) as FlagId[]).map((f) => (
            <div key={f} className="cheat-item">
              <span aria-hidden>{FLAGS[f].icon}</span>
              <div>
                <b>{FLAGS[f].name}</b>
                <p>{FLAGS[f].tip}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="rules">
          <p><b>🛑 Stop.</b> Real people and companies can wait while you check.</p>
          <p><b>📞 Check another way.</b> Hang up, then call the saved number or the one on the back of your card.</p>
          <p><b>🗣️ Tell someone.</b> Scammers want secrecy. A quick chat with family breaks the spell.</p>
          <p><b>🔐 Pick a family safe word.</b> If someone calls claiming to be family in trouble, ask for it.</p>
        </div>
        <p className="small muted">
          In 2025, Americans over 60 reported losing about $7.7 billion to fraud, according to the FBI's Internet Crime Complaint Center. Most scams are never reported.
        </p>
      </div>

      <div className="end-actions">
        <button className="btn primary" onClick={() => window.print()}>🖨️ Print the cheat sheet</button>
        <button className="btn ghost" onClick={onAgain}>🔁 Play again</button>
      </div>
    </section>
  );
}

function Stat({ big, small }: { big: string; small: string }) {
  return (
    <div className="stat">
      <b>{big}</b>
      <span>{small}</span>
    </div>
  );
}
