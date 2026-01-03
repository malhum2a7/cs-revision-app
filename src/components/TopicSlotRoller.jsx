import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import sections from "../data/sections";

function flattenTopics() {
  const out = [];
  for (const s of sections) {
    for (const t of s.topics) {
      out.push({
        sectionName: s.name,
        topicName: t.name,
        sectionSlug: s.sectionSlug,
        topicSlug: t.topicSlug,
      });
    }
  }
  return out;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function TopicSlotRoller({ className = "" }) {
  const navigate = useNavigate();
  const topics = useMemo(() => flattenTopics(), []);

  const [rolling, setRolling] = useState(false);
  const [display, setDisplay] = useState(() => pickRandom(topics));
  const [finalPick, setFinalPick] = useState(null);

  const timersRef = useRef([]);

  function clearTimers() {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }

  function roll() {
    if (!topics.length || rolling) return;

    clearTimers();
    setRolling(true);
    setFinalPick(null);

    // Total roll duration and cadence
    const totalMs = 1400;          // overall roll time
    const tickStart = 45;          // fast at start
    const tickEnd = 140;           // slower near end
    const steps = 22;

    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      // easeOut (slows down)
      const ease = 1 - Math.pow(1 - t, 2);
      const tick = Math.round(tickStart + (tickEnd - tickStart) * ease);
      const at = Math.round((totalMs * i) / steps);

      const id = setTimeout(() => {
        setDisplay(pickRandom(topics));
      }, at);

      timersRef.current.push(id);
      // small extra jitter tick so it feels less "metronome"
      const id2 = setTimeout(() => {
        setDisplay(pickRandom(topics));
      }, at + Math.min(22, tick / 3));
      timersRef.current.push(id2);
    }

    // choose final
    const doneId = setTimeout(() => {
      const chosen = pickRandom(topics);
      setDisplay(chosen);
      setFinalPick(chosen);
      setRolling(false);
    }, totalMs + 60);

    timersRef.current.push(doneId);
  }

  function goToPicked() {
    if (!finalPick) return;
    navigate(`/section/${finalPick.sectionSlug}/${finalPick.topicSlug}`);
  }

  // Uses your theme vars
  const accent = "var(--accent)";
  const border = "color-mix(in srgb, var(--accent) 30%, rgba(0,0,0,0))";

  return (
    <div
      className={[
        "rounded-3xl border bg-[var(--card)] shadow-sm",
        "p-3 w-[320px]",
        className,
      ].join(" ")}
      style={{ borderColor: border }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold" style={{ color: accent }}>
          Random topic
        </div>

        <button
          className="btn"
          onClick={roll}
          disabled={rolling}
          style={{
            borderColor: rolling ? "rgba(15,23,42,0.12)" : border,
            opacity: rolling ? 0.7 : 1,
          }}
          title="Roll"
        >
        Roll
        </button>
      </div>

      {/* Slot "window" */}
      <div
        className="rounded-2xl border px-3 py-2"
        style={{
          borderColor: border,
          background: "rgba(255,255,255,0.04)",
        }}
      >
        <div className="text-xs text-[var(--muted)] truncate">
          {display.sectionName}
        </div>

        <div
          className="mt-1 font-semibold leading-snug"
          style={{
            transform: rolling ? "translateY(0)" : "translateY(0)",
            transition: "transform 120ms ease",
          }}
        >
          {display.topicName}
        </div>

        {/* tiny "rolling" shimmer */}
        <div
          className="mt-2 h-[3px] rounded-full"
          style={{
            background: rolling
              ? `linear-gradient(90deg, transparent, color-mix(in srgb, ${accent} 60%, transparent), transparent)`
              : "transparent",
            opacity: rolling ? 1 : 0,
            transition: "opacity 180ms ease",
          }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          className="btn"
          onClick={goToPicked}
          disabled={!finalPick}
          style={{
            borderColor: finalPick ? border : "rgba(15,23,42,0.12)",
            opacity: finalPick ? 1 : 0.6,
            cursor: finalPick ? "pointer" : "not-allowed",
          }}
          title="Open the picked topic"
        >
          Open
        </button>

        <div className="text-xs text-[var(--muted)]">
          {rolling ? "Rolling…" : finalPick ? "" : "Tap Roll"}
        </div>
      </div>
    </div>
  );
}
