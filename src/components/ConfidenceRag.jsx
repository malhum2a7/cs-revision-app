// src/components/ConfidenceRag.jsx
import React, { useEffect, useMemo, useState } from "react";
import { idbGetConfidence, idbSetConfidence } from "../utils/idbConfidence";

const DAY = 24 * 60 * 60 * 1000;
const MONTH_APPROX = 30 * DAY;

function decayStatus(status, updatedAt) {
  if (!updatedAt) return status || "red";
  const age = Date.now() - updatedAt;

  // spec:
  // green -> amber after 1 month
  // amber -> red after 1 month
  if (status === "green" && age >= MONTH_APPROX) return "amber";
  if (status === "amber" && age >= MONTH_APPROX) return "red";
  return status || "red";
}

function nextStatus(current) {
  // click cycles: red -> amber -> green -> red
  if (current === "red") return "amber";
  if (current === "amber") return "green";
  return "red";
}

export default function ConfidenceRag({
  storageKey,              // REQUIRED (unique id per section/topic)
  label = true,            // show text?
  compact = false,         // small UI for lists
  className = "",
}) {
  const [raw, setRaw] = useState({ status: "red", updatedAt: 0 });
  const effective = useMemo(
    () => decayStatus(raw?.status, raw?.updatedAt),
    [raw]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rec = await idbGetConfidence(storageKey);
        if (mounted) setRaw(rec || { status: "red", updatedAt: 0 });
      } catch (e) {
        console.error("Confidence load failed:", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [storageKey]);

async function onClick(e) {
  e.preventDefault();
  e.stopPropagation();

  const newStatus = nextStatus(effective);
  setRaw({ status: newStatus, updatedAt: Date.now() });
  try {
    await idbSetConfidence(storageKey, newStatus);
  } catch (e) {
    console.error("Confidence save failed:", e);
  }
}


  const styles = {
    red:   { dot: "bg-red-500",   text: "text-red-600",   title: "Red (needs work)" },
    amber: { dot: "bg-amber-400", text: "text-amber-600", title: "Amber (in progress)" },
    green: { dot: "bg-green-500", text: "text-green-600", title: "Green (confident)" },
  }[effective];

  return (
    <button
      type="button"
      onClick={onClick}
      title={styles.title}
      className={[
        "inline-flex items-center gap-2 rounded-full border",
        compact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm",
        "bg-[var(--card)] hover:shadow-sm transition",
        className,
      ].join(" ")}
    >
      <span className={`inline-block rounded-full ${styles.dot}`} style={{ width: compact ? 10 : 12, height: compact ? 10 : 12 }} />
      {label && <span className={`${styles.text} font-medium`}>{effective.toUpperCase()}</span>}
    </button>
  );
}
