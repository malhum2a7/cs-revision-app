// src/components/TextbookViewer.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

/**
 * In Electron packaged builds you should be using HashRouter, so the URL looks like:
 *   file:///.../index.html#/section/...
 * We must resolve assets relative to the "index.html" part (before the #).
 */
function getIndexBaseHref() {
  const href = window.location.href;
  const noHash = href.split("#")[0]; // file:///.../index.html
  return noHash;
}

export default function TextbookViewer({
  // keep your existing prop names so TopicPage doesn't need changes
  pdfUrl = "/textbook.pdf",

  // book page numbers from your mapping in sections.js
  bookStart,
  bookEnd,

  // one-time calibration (you said it's 9) — hidden from UI
  offset = 9,

  // render zoom
  scale = 1.5,
}) {
  const [numPages, setNumPages] = useState(null);
  const [page, setPage] = useState(() =>
    typeof bookStart === "number" ? bookStart : 1
  );
  const [err, setErr] = useState("");
  const canvasRef = useRef(null);

  // reset to topic start when topic changes
  useEffect(() => {
    if (typeof bookStart === "number") setPage(bookStart);
  }, [bookStart]);

  // convert current "book page" to actual PDF page using offset
  const pdfPage = useMemo(() => {
    const b = typeof page === "number" ? page : 1;
    return Math.max(1, b + offset);
  }, [page, offset]);

  const minBook = typeof bookStart === "number" ? bookStart : 1;
  const maxBook =
    typeof bookEnd === "number"
      ? bookEnd
      : typeof bookStart === "number"
      ? bookStart + 3
      : 9999;

  // resolve asset URLs so they work in file:// + hash routes
  const { workerSrc, pdfSrc } = useMemo(() => {
    const base = getIndexBaseHref();

    // Worker + PDF should sit next to index.html in CRA builds (from /public)
    const worker = new URL("./pdf.worker.min.mjs", base).toString();

    // if pdfUrl is "/textbook.pdf", resolve it to "./textbook.pdf" at app root
    // if you ever pass a relative path, it still resolves safely.
    const normalizedPdf =
      typeof pdfUrl === "string" && pdfUrl.startsWith("/")
        ? `.${pdfUrl}` // "/textbook.pdf" -> "./textbook.pdf"
        : pdfUrl;

    const pdf = new URL(normalizedPdf, base).toString();

    return { workerSrc: worker, pdfSrc: pdf };
  }, [pdfUrl]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setErr("");

      // IMPORTANT: set worker src before loading
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

      const loadingTask = pdfjsLib.getDocument({
        url: pdfSrc,
        // keep workers enabled; now that URL is correct it works in file:// too
      });

      const pdf = await loadingTask.promise;
      if (cancelled) return;

      setNumPages(pdf.numPages);

      const safePdfPage = Math.min(Math.max(1, pdfPage), pdf.numPages);
      const p = await pdf.getPage(safePdfPage);
      if (cancelled) return;

      const viewport = p.getViewport({ scale });

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // hiDPI crisp
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      await p.render({ canvasContext: ctx, viewport }).promise;
    }

    run().catch((e) => {
      console.error(e);
      if (!cancelled) setErr(String(e?.message || e));
    });

    return () => {
      cancelled = true;
    };
  }, [workerSrc, pdfSrc, pdfPage, scale]);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="text-sm text-[var(--muted)]">
          Book page <b>{page}</b>
          {numPages ? (
            <>
              {" "}
              • PDF page <b>{Math.min(Math.max(1, pdfPage), numPages)}</b> /{" "}
              {numPages}
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn"
            onClick={() => setPage((p) => Math.max(minBook, (p || minBook) - 1))}
            disabled={page <= minBook}
          >
            Prev
          </button>

          <button
            className="btn"
            onClick={() => setPage((p) => Math.min(maxBook, (p || minBook) + 1))}
            disabled={page >= maxBook}
          >
            Next
          </button>
        </div>
      </div>

      {typeof bookStart !== "number" ? (
        <div className="text-sm text-[var(--muted)] mb-3">
          No mapping for this topic yet (add <code>textbookStart</code> /
          <code>textbookEnd</code> in <code>sections.js</code>).
        </div>
      ) : null}

      {err ? (
        <div className="text-sm text-red-500 mb-3">
          PDF render error: {err}
          <div className="text-xs text-[var(--muted)] mt-1">
            Check that <code>public/textbook.pdf</code> and{" "}
            <code>public/pdf.worker.min.mjs</code> exist, and that you are using{" "}
            <b>HashRouter</b> for Electron builds.
          </div>
        </div>
      ) : null}

      <div className="overflow-auto rounded-2xl border bg-white/50 p-3">
        <canvas ref={canvasRef} className="block mx-auto" />
      </div>
    </div>
  );
}
