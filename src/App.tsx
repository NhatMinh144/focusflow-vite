import React, { useEffect, useRef, useState } from "react";

// FocusFlow — a single-file React app (React + Tailwind)
// Two tabs: Focus Timer & Daily Checklist
// Local persistence via localStorage. Mobile-friendly big digits.
// Hardened for sandboxed environments: fullscreen & wake lock are feature-detected and safely handled.
// Added Diagnostics & self-tests to avoid crashes like "TypeError: Disallowed by permissions policy".

export default function App() {
  const [tab, setTab] = useState("timer");
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <Header tab={tab} setTab={setTab} />
      <main className="mx-auto max-w-5xl p-4 md:p-8">
        {tab === "timer" ? <FocusTimer /> : <DailyChecklist />}
      </main>
      <Footer />
    </div>
  );
}

function Header({ tab, setTab }: { tab: string; setTab: (t: string) => void }) {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-zinc-200">
      <div className="mx-auto max-w-5xl flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-2xl bg-zinc-900 text-white grid place-items-center font-semibold">FF</span>
          <div>
            <h1 className="text-lg font-semibold leading-tight">FocusFlow</h1>
            <p className="text-xs text-zinc-500 -mt-0.5">Minimal focus timer & daily checklist</p>
          </div>
        </div>
        <nav className="flex rounded-xl bg-zinc-100 p-1 gap-1">
          {[
            { id: "timer", label: "Focus Timer" },
            { id: "checklist", label: "Daily Checklist" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                "px-3 py-1.5 text-sm rounded-lg transition " +
                (tab === t.id
                  ? "bg-white shadow-sm font-medium"
                  : "text-zinc-600 hover:bg-white/60")
              }
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

// ------------- Focus Timer -------------

type Phase = "plan" | "focus" | "break" | "review";

function FocusTimer() {
  // Settings
  const [focusMin, setFocusMin] = useState<number>(() => loadNumber("ff_focusMin", 25));
  const [breakMin, setBreakMin] = useState<number>(() => loadNumber("ff_breakMin", 5));
  const [cycles, setCycles] = useState<number>(() => loadNumber("ff_cycles", 4));
  const [autoAdvance, setAutoAdvance] = useState<boolean>(() => loadBool("ff_autoAdvance", true));
  const [blockEasyExit, setBlockEasyExit] = useState<boolean>(() => loadBool("ff_blockExit", true));
  const [soundOn, setSoundOn] = useState<boolean>(() => loadBool("ff_soundOn", true));
  const [vibrateOn, setVibrateOn] = useState<boolean>(() => loadBool("ff_vibrateOn", true));

  // Runtime state
  const [phase, setPhase] = useState<Phase>("plan");
  const [remaining, setRemaining] = useState<number>(focusMin * 60);
  const [running, setRunning] = useState<boolean>(false);
  const [currentCycle, setCurrentCycle] = useState<number>(1);
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);
  const [fs, setFs] = useState<boolean>(false);
  const [fsDenied, setFsDenied] = useState<string | null>(null);
  const [antiExitCode, setAntiExitCode] = useState<string>(() => generateCode());
  const intervalRef = useRef<number | null>(null);
  const wakeRef = useRef<any>(null);

  // Persist settings
  useEffect(() => saveNumber("ff_focusMin", focusMin), [focusMin]);
  useEffect(() => saveNumber("ff_breakMin", breakMin), [breakMin]);
  useEffect(() => saveNumber("ff_cycles", cycles), [cycles]);
  useEffect(() => saveBool("ff_autoAdvance", autoAdvance), [autoAdvance]);
  useEffect(() => saveBool("ff_blockExit", blockEasyExit), [blockEasyExit]);
  useEffect(() => saveBool("ff_soundOn", soundOn), [soundOn]);
  useEffect(() => saveBool("ff_vibrateOn", vibrateOn), [vibrateOn]);

  // Keep remaining in sync when user changes durations during PLAN/REVIEW
  useEffect(() => {
    if (phase === "plan" || phase === "review") setRemaining(focusMin * 60);
  }, [focusMin, phase]);

  // Tick loop
  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(intervalRef.current!);
          onPhaseEnd();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => intervalRef.current && window.clearInterval(intervalRef.current);
  }, [running]);

  // Wake Lock (keep screen awake) — safe wrapper
  useEffect(() => {
    const enable = async () => {
      try {
        // @ts-ignore
        if (running && navigator?.wakeLock?.request) {
          // @ts-ignore
          wakeRef.current = await navigator.wakeLock.request("screen");
          setWakeLockActive(true);
          wakeRef.current?.addEventListener?.("release", () => setWakeLockActive(false));
        }
      } catch (e) {
        // In sandboxed iframes or disallowed policies, request() can throw TypeError
        setWakeLockActive(false);
      }
    };
    const disable = async () => {
      try { await wakeRef.current?.release?.(); } catch {}
      setWakeLockActive(false);
    };
    if (running) enable(); else disable();
    return () => disable();
  }, [running]);

  // Helpers
  const totalCycles = cycles;
  const isFocusPhase = phase === "focus";
  const duration = phase === "focus" ? focusMin * 60 : phase === "break" ? breakMin * 60 : focusMin * 60;
  const progress = 1 - remaining / Math.max(1, duration);

  function chime(type: "end" | "tick") {
    if (!soundOn) return;
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine"; o.frequency.value = type === "end" ? 880 : 440;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      o.start(); o.stop(ctx.currentTime + 0.3);
    } catch {}
  }

  function vibrate(pattern = [200, 100, 200]) {
    try { if (vibrateOn && (navigator as any)?.vibrate) (navigator as any).vibrate(pattern); } catch {}
  }

  function onPhaseEnd() {
    chime("end");
    vibrate([300, 150, 300]);
    if (phase === "focus") {
      if (currentCycle < totalCycles) {
        setPhase("break");
        setRemaining(breakMin * 60);
        setRunning(autoAdvance);
      } else {
        setPhase("review");
        setRemaining(focusMin * 60);
        setRunning(false);
        incrementStat("ff_sessions_completed");
      }
    } else if (phase === "break") {
      setPhase("focus");
      setRemaining(focusMin * 60);
      setCurrentCycle((c) => c + 1);
      setRunning(autoAdvance);
    }
  }

  async function requestFullscreenSafe() {
    setFsDenied(null);
    try {
      const d: any = document;
      const el: any = document.documentElement;
      const can = (d.fullscreenEnabled || el.requestFullscreen || el.webkitRequestFullscreen);
      if (!can) { setFs(false); setFsDenied("Fullscreen not supported in this environment."); return false; }
      if (el.requestFullscreen) { await el.requestFullscreen(); }
      else if (el.webkitRequestFullscreen) { await el.webkitRequestFullscreen(); }
      setFs(true);
      return true;
    } catch (err: any) {
      setFs(false);
      setFsDenied(err?.message || "Fullscreen was blocked by the browser/policy.");
      return false;
    }
  }

  async function exitFullscreenSafe() {
    try {
      const d: any = document;
      if (d.exitFullscreen) await d.exitFullscreen();
      else if ((d as any).webkitExitFullscreen) await (d as any).webkitExitFullscreen();
    } catch {}
    setFs(false);
  }

  async function startFocus() {
    setPhase("focus");
    setRemaining(focusMin * 60);
    setRunning(true);
    setAntiExitCode(generateCode());
    // Try fullscreen but never crash if permissions disallow it
    await requestFullscreenSafe();
  }

  function stopEarly() {
    setRunning(false);
    setPhase("review");
    setRemaining(focusMin * 60);
  }

  return (
    <section className="grid gap-6 md:grid-cols-[1.2fr,1fr]">
      {/* Big timer card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="px-2 py-0.5 rounded-full bg-zinc-100">Phase: {phase.toUpperCase()}</span>
            {phase !== "plan" && (
              <span className="px-2 py-0.5 rounded-full bg-zinc-100">Cycle {currentCycle}/{totalCycles}</span>
            )}
            {wakeLockActive && <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Wake Lock</span>}
            {fs && <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Fullscreen</span>}
          </div>
          <div className="flex items-center gap-2">
            {fs ? (
              <button className="px-2 py-1 text-xs rounded-lg bg-zinc-100" onClick={exitFullscreenSafe}>Exit Fullscreen</button>
            ) : (
              <button className="px-2 py-1 text-xs rounded-lg bg-zinc-100" onClick={requestFullscreenSafe}>Fullscreen</button>
            )}
          </div>
        </div>

        {fsDenied && (
          <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-xs p-3">
            {fsDenied} — You can still focus without fullscreen. Try enabling it in your browser, or use Guided Access/App Pinning on your phone.
          </div>
        )}

        <div className="mt-6 grid place-items-center">
          <TimerDisplay remaining={remaining} progress={progress} isFocus={isFocusPhase} />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {phase === "plan" && (
            <button className="px-4 py-2 rounded-xl text-sm transition shadow-sm bg-zinc-900 text-white hover:opacity-90" onClick={startFocus}>Start Focus</button>
          )}
          {phase !== "plan" && (
            <>
              {!running ? (
                <button className="px-4 py-2 rounded-xl text-sm transition shadow-sm bg-zinc-900 text-white hover:opacity-90" onClick={() => setRunning(true)}>Resume</button>
              ) : (
                <button className="px-4 py-2 rounded-xl text-sm transition shadow-sm bg-zinc-100 hover:bg-zinc-200" onClick={() => setRunning(false)}>Pause</button>
              )}
              {phase !== "review" && (
                blockEasyExit ? (
                  <AntiExitButton code={antiExitCode} onConfirm={stopEarly} />
                ) : (
                  <button className="px-4 py-2 rounded-xl text-sm transition shadow-sm bg-red-600 text-white hover:bg-red-500" onClick={stopEarly}>End Early</button>
                )
              )}
              {phase === "review" && (
                <button className="px-4 py-2 rounded-xl text-sm transition shadow-sm bg-zinc-900 text-white hover:opacity-90" onClick={() => { setPhase("plan"); setCurrentCycle(1); }}>Plan Next</button>
              )}
            </>
          )}
        </div>

        {/* Plan & Settings */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <NumberField label="Focus (min)" value={focusMin} setValue={setFocusMin} min={5} max={180} />
          <NumberField label="Break (min)" value={breakMin} setValue={setBreakMin} min={1} max={60} />
          <NumberField label="Cycles" value={cycles} setValue={setCycles} min={1} max={12} />
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-2">
          <Toggle label="Auto-advance phases" value={autoAdvance} setValue={setAutoAdvance} />
          <Toggle label="Require code to end early" value={blockEasyExit} setValue={setBlockEasyExit} />
          <Toggle label="Chime on phase end" value={soundOn} setValue={setSoundOn} />
          <Toggle label="Vibrate on phone" value={vibrateOn} setValue={setVibrateOn} />
        </div>

        <Tips />
      </div>

      {/* Side card: Notes, Stats, Diagnostics */}
      <div className="bg-white rounded-2xl p-6 shadow-sm grid gap-4 content-start">
        <h3 className="text-base font-semibold">Session Notes</h3>
        <textarea
          className="w-full min-h-[120px] rounded-xl border border-zinc-200 p-3 focus:outline-none focus:ring-2 focus:ring-zinc-300"
          placeholder="What will you focus on this session? (optional)"
          defaultValue={loadStringDateScoped("ff_notes", "")}
          onChange={(e) => saveStringDateScoped("ff_notes", e.target.value)}
        />
        <Stats />
        <Diagnostics />
      </div>
    </section>
  );
}

function TimerDisplay({ remaining, progress, isFocus }: { remaining: number; progress: number; isFocus: boolean }) {
  return (
    <div className="w-full">
      <div className="relative mx-auto max-w-[560px]">
        <div className="aspect-square rounded-3xl bg-zinc-50 border border-zinc-200 grid place-items-center">
          <div className="text-center">
            <div className={`text-7xl md:text-8xl font-mono tabular-nums ${isFocus ? "text-zinc-900" : "text-zinc-500"}`}>{formatMMSS(remaining)}</div>
            <p className="mt-2 text-xs text-zinc-500">{isFocus ? "FOCUS" : "BREAK"}</p>
          </div>
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
            <div
              className="absolute bottom-0 left-0 right-0 bg-zinc-200/60"
              style={{ height: `${Math.max(2, progress * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function formatMMSS(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function NumberField({ label, value, setValue, min, max }: { label: string; value: number; setValue: (n: number) => void; min?: number; max?: number }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3">
      <span className="text-sm text-zinc-600">{label}</span>
      <input
        type="number"
        className="w-24 rounded-lg border border-zinc-200 p-2 text-right"
        value={value}
        min={min}
        max={max}
        onChange={(e) => setValue(clamp(Number(e.target.value), min ?? 0, max ?? 9999))}
      />
    </label>
  );
}

function Toggle({ label, value, setValue }: { label: string; value: boolean; setValue: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3">
      <span className="text-sm text-zinc-600">{label}</span>
      <button
        onClick={() => setValue(!value)}
        className={`h-6 w-11 rounded-full transition relative ${value ? "bg-zinc-900" : "bg-zinc-300"}`}
        aria-pressed={value}
      >
        <span className={`absolute top-0.5 transition ${value ? "left-6" : "left-0.5"} h-5 w-5 rounded-full bg-white`} />
      </button>
    </label>
  );
}

function AntiExitButton({ code, onConfirm }: { code: string; onConfirm: () => void }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  return (
    <>
      <button className="px-4 py-2 rounded-xl text-sm transition shadow-sm bg-red-600 text-white hover:bg-red-500" onClick={() => setOpen(true)}>End Early</button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h4 className="text-base font-semibold">Confirm End</h4>
            <p className="mt-1 text-sm text-zinc-600">Type the code to confirm you really want to stop now.</p>
            <div className="mt-4 grid gap-2">
              <div className="text-2xl font-mono select-none tracking-widest text-zinc-700">{code}</div>
              <input
                autoFocus
                className="rounded-lg border border-zinc-200 p-2"
                placeholder="Enter code"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-1.5 rounded-lg bg-zinc-100" onClick={() => setOpen(false)}>Cancel</button>
              <button
                className="px-3 py-1.5 rounded-lg bg-red-600 text-white"
                onClick={() => {
                  if (input.trim() === code) { setOpen(false); onConfirm(); }
                }}
              >Confirm</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Tips() {
  return (
    <div className="mt-6 rounded-xl border border-zinc-200 p-4 text-sm text-zinc-600">
      <p className="font-medium mb-1">Make it phone-proof:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Open FocusFlow on your phone → tap Fullscreen (if available) to hide browser chrome.</li>
        <li>Enable <em>Guided Access</em> (iOS) or <em>App Pinning</em> (Android) to reduce accidental exits.</li>
        <li>Turn on Do Not Disturb. Place phone face-down away from reach.</li>
        <li>Use the <span className="font-medium">“Require code to end early”</span> toggle to add friction.</li>
      </ul>
    </div>
  );
}

function Stats() {
  const sessions = loadNumber("ff_sessions_completed", 0);
  const [streak, setStreak] = useState<number>(() => loadNumber("ff_streak", 0));
  const [lastDay, setLastDay] = useState<string>(() => loadString("ff_last_day", ""));

  useEffect(() => {
    const today = dateKey(new Date());
    if (lastDay !== today) {
      if (lastDay && daysBetween(parseDateKey(lastDay), new Date()) === 1) {
        const ns = streak + 1; setStreak(ns); saveNumber("ff_streak", ns);
      } else if (!lastDay) {
        setStreak(streak);
      } else {
        setStreak(0); saveNumber("ff_streak", 0);
      }
      saveString("ff_last_day", today);
      setLastDay(today);
    }
  }, []);

  return (
    <div className="rounded-xl border border-zinc-200 p-4 text-sm">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-2xl font-semibold">{sessions}</div>
          <div className="text-xs text-zinc-500">Focus sessions</div>
        </div>
        <div>
          <div className="text-2xl font-semibold">{streak}</div>
          <div className="text-xs text-zinc-500">Day streak</div>
        </div>
        <TodayProgress />
      </div>
    </div>
  );
}

function TodayProgress() {
  const tasks = useDailyTasks();
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div className="text-2xl font-semibold">{pct}%</div>
      <div className="text-xs text-zinc-500">Tasks done today</div>
    </div>
  );
}

// ------------- Diagnostics & Self-tests -------------

function Diagnostics() {
  const [results, setResults] = useState<{ name: string; pass: boolean; note?: string }[]>([]);

  function run() {
    const out: { name: string; pass: boolean; note?: string }[] = [];

    // Test 1: Fullscreen wrapper should not throw and should return boolean
    try {
      const can = !!((document as any).fullscreenEnabled || (document.documentElement as any).requestFullscreen || (document.documentElement as any).webkitRequestFullscreen);
      out.push({ name: "Fullscreen feature-detect", pass: true, note: can ? "available" : "unavailable" });
    } catch (e: any) {
      out.push({ name: "Fullscreen feature-detect", pass: false, note: e?.message });
    }

    // Test 2: Wake Lock access should not throw on read
    try {
      const has = !!(navigator as any)?.wakeLock;
      out.push({ name: "Wake Lock detect", pass: true, note: has ? "present" : "absent" });
    } catch (e: any) {
      out.push({ name: "Wake Lock detect", pass: false, note: e?.message });
    }

    // Test 3: Vibrate wrapper should not throw
    try {
      if ((navigator as any)?.vibrate) { (navigator as any).vibrate(0); }
      out.push({ name: "Vibrate safe call", pass: true });
    } catch (e: any) {
      out.push({ name: "Vibrate safe call", pass: false, note: e?.message });
    }

    // Test 4: AudioContext safe construct
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (Ctx) { const ctx = new Ctx(); ctx.close(); }
      out.push({ name: "AudioContext init", pass: true });
    } catch (e: any) {
      out.push({ name: "AudioContext init", pass: false, note: e?.message });
    }

    setResults(out);
  }

  return (
    <div className="rounded-xl border border-zinc-200 p-4 text-sm grid gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Diagnostics</h3>
        <button className="px-3 py-1.5 rounded-lg bg-zinc-100" onClick={run}>Run self-tests</button>
      </div>
      {results.length > 0 && (
        <ul className="text-xs grid gap-1">
          {results.map((r, i) => (
            <li key={i} className={r.pass ? "text-emerald-700" : "text-red-700"}>
              {r.pass ? "✓" : "✗"} {r.name}{r.note ? ` — ${r.note}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ------------- Daily Checklist -------------

type Task = { id: string; text: string; done: boolean };

function DailyChecklist() {
  const [date, setDate] = useState<string>(() => dateKey(new Date()));
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks(date));
  const [input, setInput] = useState("");

  useEffect(() => { saveTasks(date, tasks); }, [date, tasks]);
  useEffect(() => { setTasks(loadTasks(date)); }, [date]);

  const done = tasks.filter((t) => t.done).length;

  function addTask() {
    const text = input.trim();
    if (!text) return;
    setTasks((prev) => [{ id: cryptoId(), text, done: false }, ...prev]);
    setInput("");
  }

  function carryOverIncomplete() {
    const yesterdayKey = dateKey(addDays(parseDateKey(date), -1));
    const yTasks = loadTasks(yesterdayKey);
    const carry = yTasks.filter((t) => !t.done).map((t) => ({ ...t, id: cryptoId() }));
    if (carry.length) setTasks((prev) => [...carry, ...prev]);
  }

  return (
    <section className="grid gap-6 md:grid-cols-[1.2fr,1fr]">
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Daily Checklist</h3>
            <p className="text-xs text-zinc-500">Simple, fast, local-only</p>
          </div>
          <input
            type="date"
            className="rounded-lg border border-zinc-200 p-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="mt-4 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-zinc-200 p-3"
            placeholder="Add a task and hit Enter"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />
          <button className="px-4 py-2 rounded-xl text-sm transition shadow-sm bg-zinc-900 text-white hover:opacity-90" onClick={addTask}>Add</button>
        </div>

        <div className="mt-4">
          {tasks.length === 0 ? (
            <EmptyState onCarry={carryOverIncomplete} />
          ) : (
            <ul className="space-y-2">
              {tasks.map((t) => (
                <li key={t.id} className="group flex items-center gap-3 rounded-xl border border-zinc-200 p-3">
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={(e) => setTasks((prev) => prev.map((x) => x.id === t.id ? { ...x, done: e.target.checked } : x))}
                    className="h-5 w-5"
                  />
                  <input
                    className={`flex-1 bg-transparent outline-none ${t.done ? "line-through text-zinc-400" : ""}`}
                    value={t.text}
                    onChange={(e) => setTasks((prev) => prev.map((x) => x.id === t.id ? { ...x, text: e.target.value } : x))}
                  />
                  <button
                    className="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 rounded-lg bg-zinc-100"
                    onClick={() => setTasks((prev) => prev.filter((x) => x.id !== t.id))}
                  >Delete</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="text-zinc-600">
            {done}/{tasks.length} done — {tasks.length ? Math.round((done / tasks.length) * 100) : 0}%
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-lg bg-zinc-100" onClick={() => setTasks((prev) => prev.filter((t) => !t.done))}>Clear completed</button>
            <button className="px-3 py-1.5 rounded-lg bg-zinc-100" onClick={() => setTasks([])}>Clear all</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm grid gap-3 content-start">
        <h3 className="text-base font-semibold">Daily Focus Flow</h3>
        <ol className="list-decimal pl-5 text-sm space-y-2 text-zinc-700">
          <li><span className="font-medium">Plan (2–3 min)</span> — Define tasks & select focus duration.</li>
          <li><span className="font-medium">Focus (25–60 min)</span> — Fullscreen, phone away, code to end early.</li>
          <li><span className="font-medium">Break (5–10 min)</span> — Move, water, breathe.</li>
          <li><span className="font-medium">Review (1–2 min)</span> — Check off tasks, jot quick notes.</li>
        </ol>
        <p className="text-xs text-zinc-500">Tip: Start with 25/5 × 4 cycles. Increase as your streak grows.</p>
      </div>
    </section>
  );
}

function EmptyState({ onCarry }: { onCarry: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-600 grid gap-2">
      <p>No tasks yet. Add your top 3–5 priorities for today.</p>
      <button className="self-start px-3 py-1.5 rounded-lg bg-zinc-100" onClick={onCarry}>Carry over yesterday’s incomplete</button>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-8 pb-8 text-center text-xs text-zinc-500">
      <p>All data is stored locally in your browser. No accounts. No servers.</p>
    </footer>
  );
}

// ------------- Utils & Storage -------------

function clamp(n: number, min: number, max: number) { return Math.min(max, Math.max(min, n)); }
function cryptoId() { return Math.random().toString(36).slice(2, 10); }
function generateCode() { return Math.floor(1000 + Math.random() * 9000).toString(); }

function saveNumber(key: string, n: number) { localStorage.setItem(key, String(n)); }
function loadNumber(key: string, fallback = 0) { const v = localStorage.getItem(key); return v ? Number(v) : fallback; }
function saveBool(key: string, b: boolean) { localStorage.setItem(key, b ? "1" : "0"); }
function loadBool(key: string, fallback = false) { const v = localStorage.getItem(key); return v ? v === "1" : fallback; }
function saveString(key: string, s: string) { localStorage.setItem(key, s); }
function loadString(key: string, fallback = "") { const v = localStorage.getItem(key); return v ?? fallback; }

function dateKey(d: Date) { return d.toISOString().slice(0, 10); }
function parseDateKey(k: string) { return new Date(k + "T00:00:00"); }
function addDays(d: Date, days: number) { const nd = new Date(d); nd.setDate(nd.getDate() + days); return nd; }
function daysBetween(a: Date, b: Date) { return Math.floor((parseDateKey(dateKey(b)).getTime() - parseDateKey(dateKey(a)).getTime()) / 86400000); }

function incrementStat(key: string) { const n = loadNumber(key, 0) + 1; saveNumber(key, n); }

function loadStringDateScoped(base: string, fallback = "") {
  const k = `${base}_${dateKey(new Date())}`; return loadString(k, fallback);
}
function saveStringDateScoped(base: string, value: string) {
  const k = `${base}_${dateKey(new Date())}`; saveString(k, value);
}

function tasksKeyFor(date: string) { return `ff_tasks_${date}`; }
function loadTasks(date: string): Task[] { try { return JSON.parse(localStorage.getItem(tasksKeyFor(date)) || "[]"); } catch { return []; } }
function saveTasks(date: string, tasks: Task[]) { localStorage.setItem(tasksKeyFor(date), JSON.stringify(tasks)); }

function useDailyTasks(): Task[] {
  const [date] = useState<string>(() => dateKey(new Date()));
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks(date));
  useEffect(() => {
    const id = setInterval(() => setTasks(loadTasks(date)), 1000);
    return () => clearInterval(id);
  }, [date]);
  return tasks;
}
