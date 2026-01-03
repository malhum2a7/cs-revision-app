import React, { useEffect, useMemo, useRef, useState } from "react";

const PHRASES = [
  [/in order to/gi, "to"],
  [/due to the fact that/gi, "because"],
  [/a large number of/gi, "many"],
  [/a small number of/gi, "few"],
  [/as a result of/gi, "because of"],
  [/at the same time as/gi, "while"],
  [/in the event that/gi, "if"],
  [/with regard to/gi, "about"],
  [/in relation to/gi, "about"],
  [/it is important to note that/gi, ""],
  [/this means that/gi, "so"],
  [/the process of/gi, ""],
  [/is able to/gi, "can"],
  [/are able to/gi, "can"],
  [/has the ability to/gi, "can"],
  [/make use of/gi, "use"],
  [/as well as/gi, "&"],
];

const FILLER = [
  /\bbasically\b/gi,
  /\bessentially\b/gi,
  /\bactually\b/gi,
  /\bjust\b/gi,
  /\bkind of\b/gi,
  /\bsort of\b/gi,
  /\bin general\b/gi,
  /\bfor the most part\b/gi,
  /\bit can be said that\b/gi,
  /\bclearly\b/gi,
  /\bsimply\b/gi,
  /\bquite\b/gi,
  /\bsomewhat\b/gi,
];

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * IMPORTANT: you asked for "definite interchangeable terms only".
 * So: only keep substitutions that are standard abbreviations / acronyms,
 * and common exam-safe shortenings (e.g. CPU, RAM, ALU, MAR, MDR, etc.)
 * Avoid "information -> data" type swaps (not always interchangeable).
 */
const TERM_MAP = new Map([
  // connectors / shorthand
  ["and", "&"],
  ["because", "b/c"],
  ["for example", "e.g."],
  ["that is", "i.e."],
  ["versus", "vs"],
  ["with", "w/"],
  ["without", "w/o"],

  // memory & cpu (safe acronyms)
  ["central processing unit", "CPU"],
  ["arithmetic logic unit", "ALU"],
  ["control unit", "CU"],
  ["random access memory", "RAM"],
  ["read only memory", "ROM"],
  ["memory address register", "MAR"],
  ["memory data register", "MDR"],
  ["program counter", "PC"],
  ["current instruction register", "CIR"],

  // storage
  ["solid state drive", "SSD"],
  ["hard disk drive", "HDD"],

  // networking (safe acronyms)
  ["internet protocol", "IP"],
  ["transmission control protocol", "TCP"],
  ["user datagram protocol", "UDP"],
  ["domain name system", "DNS"],
  ["dynamic host configuration protocol", "DHCP"],
  ["hypertext transfer protocol", "HTTP"],
  ["hypertext transfer protocol secure", "HTTPS"],
  ["media access control address", "MAC address"],

  // programming / tooling (safe acronyms)
  ["object oriented programming", "OOP"],
  ["integrated development environment", "IDE"],
  ["application programming interface", "API"],
  ["graphical user interface", "GUI"],
  ["command line interface", "CLI"],
  ["version control system", "VCS"],

  // algorithms (safe acronyms)
  ["depth first search", "DFS"],
  ["breadth first search", "BFS"],
  ["big o notation", "Big-O"],
]);

function summariseOffline(raw) {
  let text = (raw || "").replace(/\s+/g, " ").trim();
  if (!text) return "";

  // 1) phrase compression
  for (const [re, rep] of PHRASES) text = text.replace(re, rep);
  text = text.replace(/\s+/g, " ").trim();

  // 2) remove filler
  for (const re of FILLER) text = text.replace(re, "");
  text = text.replace(/\s+/g, " ").trim();

  // 3) apply term substitutions - multiword first
  const entries = [...TERM_MAP.entries()];
  const multi = entries.filter(([k]) => k.includes(" "));
  const single = entries.filter(([k]) => !k.includes(" "));

  for (const [k, v] of multi) {
    const re = new RegExp(`\\b${escapeRegExp(k)}\\b`, "gi");
    text = text.replace(re, v);
  }

  // single-word token replace
  text = text
    .split(/(\b)/)
    .map((tok) => {
      const low = tok.toLowerCase();
      for (const [k, v] of single) if (low === k) return v;
      return tok;
    })
    .join("");

  text = text.replace(/\s+/g, " ").trim();

  // 4) bullets
  const parts = text
    .split(/(?<=[.!?])\s+|;\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length <= 1 && text.length < 160) return text;

  // 5) clean bullets (dedupe)
  const seen = new Set();
  const bullets = [];
  for (let s of parts) {
s = s.replace(/^-+\s*/, "").trim();

    if (s.length < 12) continue;

    const key = s.toLowerCase().replace(/[^a-z0-9]+/g, "");
    if (seen.has(key)) continue;
    seen.add(key);

    s = s.replace(/[.]+$/g, "");
    bullets.push(`• ${s}`);
  }

  return bullets.join("\n");
}

export default function SummariserPopover({ open, onClose, initialText = "" }) {
  const [input, setInput] = useState("");
  const overlayRef = useRef(null);
  const boxRef = useRef(null);

  // when opened, preload selection text
  useEffect(() => {
    if (!open) return;
    setInput((initialText || "").trim());
  }, [open, initialText]);

  const output = useMemo(() => summariseOffline(input), [input]);

  // ESC closes + clears
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setInput("");
        onClose?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // click outside closes + clears
  function onOverlayMouseDown(e) {
    if (boxRef.current && !boxRef.current.contains(e.target)) {
      setInput("");
      onClose?.();
    }
  }

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
      onMouseDown={onOverlayMouseDown}
    >
      <div
        ref={boxRef}
        className="w-full max-w-3xl rounded-3xl border bg-[var(--card)] shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex items-center justify-between gap-3">
          <div className="font-semibold">Offline Summariser</div>
          <button
            className="btn"
            onClick={() => {
              setInput("");
              onClose?.();
            }}
          >
            Close
          </button>
        </div>

        <div className="p-4 grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-semibold mb-2">Selected text</div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full min-h-[260px] rounded-2xl border bg-white/60 p-3 outline-none"
              placeholder="Select text in your notes, then click Summarise…"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Summary</div>
              <button
                className="btn"
                onClick={() => output && navigator.clipboard.writeText(output)}
                disabled={!output}
              >
                Copy
              </button>
            </div>

            <textarea
              readOnly
              value={output}
              className="w-full min-h-[260px] rounded-2xl border bg-white/40 p-3 outline-none whitespace-pre-wrap"
              placeholder="Your summary will appear here…"
            />
          </div>
        </div>

        <div className="px-4 pb-4 text-xs text-[var(--muted)]">
          Uses exam-safe abbreviations/acronyms (CPU, RAM, ALU, MAR, MDR, TCP/IP, etc.), removes filler,
          and converts into bullet points.
        </div>
      </div>
    </div>
  );
}
