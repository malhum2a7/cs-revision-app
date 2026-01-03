import React, { useEffect, useRef, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";

export default function ResizableImage(props) {
  const { node, selected, updateAttributes, editor } = props;
  const { src, alt, title, width = 420, align = "center", float = "none" } = node.attrs;

  const wrapRef = useRef(null);
  const draggingRef = useRef(false);

  const [hover, setHover] = useState(false);

  // Wrapper layout based on float + align
  const wrapStyle = (() => {
    const w = clampWidth(width);
    const base = {
      width: w,
      maxWidth: "100%",
    };

    if (float === "left") {
      return { ...base, float: "left", margin: "0.25rem 1rem 0.75rem 0" };
    }
    if (float === "right") {
      return { ...base, float: "right", margin: "0.25rem 0 0.75rem 1rem" };
    }

    // float none -> align using margins
    if (align === "left") return { ...base, margin: "0.25rem auto 0.75rem 0" };
    if (align === "right") return { ...base, margin: "0.25rem 0 0.75rem auto" };
    return { ...base, margin: "0.25rem auto 0.75rem auto" }; // center
  })();

  function clampWidth(w) {
    const n = Number(w) || 420;
    return Math.max(120, Math.min(1200, n));
  }

  function onResizeMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = true;

    const startX = e.clientX;
    const startW = clampWidth(width);

    const onMove = (ev) => {
      if (!draggingRef.current) return;
      const dx = ev.clientX - startX;
      const next = clampWidth(startW + dx);
      updateAttributes({ width: next });
    };

    const onUp = () => {
      draggingRef.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  // Helpful: clicking the image selects it (so toolbar appears reliably)
  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    editor?.commands?.setNodeSelection(props.getPos());
  }

  // If you float an image, make sure the next paragraph clears nicely sometimes.
  // (Optional but helps visually.)
  useEffect(() => {
    if (!wrapRef.current) return;
  }, [float]);

  return (
    <NodeViewWrapper
      ref={wrapRef}
      className={[
        "cs-image-node",
        selected ? "cs-image-selected" : "",
      ].join(" ")}
      style={wrapStyle}
      data-drag-handle
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        contentEditable={false}
        className="relative rounded-xl border bg-white/40 overflow-hidden"
        style={{
          borderColor: selected ? "color-mix(in srgb, var(--accent) 45%, transparent)" : "rgba(15,23,42,0.12)",
          boxShadow: selected ? "0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent)" : "none",
        }}
      >
        <img
          src={src}
          alt={alt || ""}
          title={title || ""}
          draggable={true}
          onClick={onClick}
          className="block w-full h-auto select-none"
        />

        {/* Resize handle (bottom-right) */}
        <button
          type="button"
          onMouseDown={onResizeMouseDown}
          className={[
            "absolute right-2 bottom-2 h-4 w-4 rounded",
            "border bg-[var(--card)] shadow-sm",
            (hover || selected) ? "opacity-100" : "opacity-0",
            "transition-opacity cursor-nwse-resize",
          ].join(" ")}
          title="Drag to resize"
          aria-label="Resize image"
        />
      </div>
    </NodeViewWrapper>
  );
}
