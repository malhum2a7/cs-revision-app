// src/pages/ClozePractice.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { idbGetNote } from "../utils/idbNotes";

const notesKey = (sectionSlug, topicSlug, tab) =>
  `notes_${sectionSlug}_${topicSlug}_${tab}`;

// ---------- Unicode-aware helpers ----------
const WORD_RE = /^\p{L}[\p{L}\p{N}]*(?:[-'’][\p{L}\p{N}]+)*$/u;
// tokens: words OR whitespace OR punctuation
const TOKEN_RE =
  /\p{L}[\p{L}\p{N}]*(?:[-'’][\p{L}\p{N}]+)*|\s+|[^\s\p{L}\p{N}]+/gu;

// IMPORTANT: must be a single "word token"
const IMAGE_TOKEN = "IMAGETOKEN";

// --- Convert HTML into blocks/lines to preserve layout (paragraph-ish) ---
function htmlToBlocks(html) {
  const safe = (html || "").replace(/<img\b[^>]*>/gi, ` ${IMAGE_TOKEN} `);

  const withBreaks = safe
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|blockquote|pre)>/gi, "\n")
    .replace(/<(br)\s*\/?>/gi, "\n")
    .replace(/<\/(ul|ol)>/gi, "\n");

  const text = withBreaks.replace(/<[^>]*>/g, " ");

  const lines = text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return lines;
}

// returns { displayParts: (string | {answer, idx})[], answers: string[] }
function makeCloze(text, percent = 0.15) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return { displayParts: [""], answers: [] };

  const tokens = clean.match(TOKEN_RE) || [];
  if (tokens.length === 0) return { displayParts: [clean], answers: [] };

  // Candidate indices = words only, never image marker, prefer length > 3
  let candidates = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === IMAGE_TOKEN) continue;
    if (WORD_RE.test(t) && t.length > 3) candidates.push(i);
  }

  // Fallback: any word token (still not images)
  if (candidates.length === 0) {
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t === IMAGE_TOKEN) continue;
      if (WORD_RE.test(t)) candidates.push(i);
    }
  }

  if (candidates.length === 0) return { displayParts: tokens, answers: [] };

  // Do NOT force 1 blank on every line (short lines can be 0)
  let target = Math.round(candidates.length * percent);

  // safety cap so it never blanks "too much"
  const cap = Math.max(1, Math.floor(candidates.length * 0.35));
  target = Math.min(target, cap);

  // if target is 0, return original (no blanks for this line)
  if (target <= 0) return { displayParts: tokens, answers: [] };

  const picks = new Set();
  while (picks.size < target && picks.size < candidates.length) {
    const k = Math.floor(Math.random() * candidates.length);
    picks.add(candidates[k]);
  }

  const answers = [];
  const parts = [];
  let blankIdx = 0;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (picks.has(i)) {
      answers.push(t);
      parts.push({ answer: t, idx: blankIdx });
      blankIdx += 1;
    } else {
      parts.push(t);
    }
  }

  return { displayParts: parts, answers };
}

// Build cloze per-block so layout stays clean
function makeClozeBlocks(blocks, percent = 0.15) {
  let globalIdx = 0;

  const out = blocks.map((b) => {
    const c = makeCloze(b, percent);

    const parts = c.displayParts.map((p) => {
      if (typeof p === "string") return p;
      const remapped = { ...p, idx: globalIdx };
      globalIdx += 1;
      return remapped;
    });

    return { ...c, displayParts: parts };
  });

  const totalAnswers = out.reduce((sum, b) => sum + b.answers.length, 0);
  return { blocks: out, totalAnswers };
}

export default function ClozePractice() {
  const { sectionSlug, topicSlug } = useParams();
  const navigate = useNavigate();

  const paper = Number(localStorage.getItem("practice_paper") || "1");
  const accent = paper === 1 ? "var(--accent)" : "var(--accent2)";

  const [sourceHtml, setSourceHtml] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      const key = notesKey(sectionSlug, topicSlug, "mynotes");

      try {
        const idb = await idbGetNote(key);
        const legacy = localStorage.getItem(key) || "";
        const chosen = (idb && idb.trim().length ? idb : legacy) || "";
        if (mounted) setSourceHtml(chosen);
      } catch (e) {
        console.error("Failed to load notes for practice:", e);
        const legacy = localStorage.getItem(key) || "";
        if (mounted) setSourceHtml(legacy);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [sectionSlug, topicSlug]);

  const blocks = useMemo(() => htmlToBlocks(sourceHtml), [sourceHtml]);

  const [clozeBlocks, setClozeBlocks] = useState({ blocks: [], totalAnswers: 0 });
  const [inputs, setInputs] = useState({});

  function regenWith(percent) {
    setInputs({});
    const next = makeClozeBlocks(blocks, percent);

    // If we ended up with 0 blanks overall, try a stronger pass once
    if (blocks.length > 0 && next.totalAnswers === 0) {
      const fallback = makeClozeBlocks(blocks, Math.max(percent, 0.18));
      setClozeBlocks(fallback);
      return;
    }

    setClozeBlocks(next);
  }

  useEffect(() => {
    regenWith(0.15);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks]);

  function regen() {
    regenWith(0.15);
  }

  function isCorrect(i, answer) {
    const user = (inputs[i] || "").trim();
    const ans = (answer || "").trim();
    return user.length > 0 && user.toLowerCase() === ans.toLowerCase();
  }

  return (
    <div className="max-w-5xl mx-auto page">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="btn">
          Back
        </button>
        <button onClick={regen} className="btn" disabled={blocks.length === 0}>
          Regenerate (15%)
        </button>
      </div>

      <div className="rounded-2xl border bg-[var(--card)] p-5 shadow-sm">
        {loading ? (
          <div className="text-sm text-[var(--muted)]">Loading notes…</div>
        ) : blocks.length === 0 ? (
          <div className="text-sm text-[var(--muted)]">
            No notes found for this topic yet. Add notes in <b>MyNotes</b> first, then come back.
          </div>
        ) : clozeBlocks.totalAnswers === 0 ? (
          <div className="text-sm text-[var(--muted)]">
            Couldn’t generate blanks from these notes. Add a bit more normal text (words), then regenerate.
          </div>
        ) : (
          <div className="space-y-4">
            {clozeBlocks.blocks.map((blk, bIdx) => (
              <div key={bIdx} className="text-[16px] leading-8">
                {blk.displayParts.map((p, idx) => {
                  if (typeof p === "string") {
                    if (p === IMAGE_TOKEN) {
                      return (
                        <span
                          key={`${bIdx}-img-${idx}`}
                          className="inline-flex items-center px-2 py-0.5 mx-1 rounded-lg border text-xs"
                          style={{
                            borderColor: `color-mix(in srgb, ${accent} 40%, transparent)`,
                            color: "var(--muted)",
                            background: "rgba(255,255,255,0.35)",
                          }}
                        >
                          image
                        </span>
                      );
                    }
                    return <span key={`${bIdx}-t-${idx}`}>{p}</span>;
                  }

                  const ok = isCorrect(p.idx, p.answer);

                  return (
                    <span key={`${bIdx}-b-${p.idx}-${idx}`} className="inline-flex items-center">
                      <input
                        value={inputs[p.idx] || ""}
                        onChange={(e) =>
                          setInputs((prev) => ({ ...prev, [p.idx]: e.target.value }))
                        }
                        onFocus={(e) => {
                          e.target.style.boxShadow = `0 0 0 3px color-mix(in srgb, ${accent} 25%, transparent)`;
                        }}
                        onBlur={(e) => {
                          e.target.style.boxShadow = ok
                            ? "0 0 0 2px rgba(34,197,94,0.10)"
                            : "none";
                        }}
                        className="mx-1 px-2 py-1 rounded-lg border outline-none align-baseline"
                        style={{
                          background: ok ? "rgba(34,197,94,0.15)" : "transparent",
                          borderColor: ok
                            ? "rgba(34,197,94,0.75)"
                            : `color-mix(in srgb, ${accent} 45%, transparent)`,
                          boxShadow: ok ? "0 0 0 2px rgba(34,197,94,0.10)" : "none",
                          width: Math.min(320, Math.max(110, (p.answer.length + 4) * 10)),
                        }}
                        autoComplete="off"
                        spellCheck={false}
                      />
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
