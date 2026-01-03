import React from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";

export default function MainLayout({ children }) {
  const loc = useLocation();
  const isMindmap = loc.pathname === "/" || loc.pathname.startsWith("/section/");

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navbar />
      <main
        className={
          isMindmap
            ? "w-full px-4 sm:px-6 lg:px-10 py-6" // FULL WIDTH for mindmaps
            : "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6" // comfy for editor pages
        }
      >
        {children}
      </main>
    </div>
  );
}
