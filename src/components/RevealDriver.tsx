"use client";

import { useEffect } from "react";

// Adds .is-in to [data-reveal] elements as they enter the viewport.
// A client component (not an inline <script>) so it runs on BOTH full page
// loads and client-side navigations — injected scripts don't execute on the
// latter, which left reveal elements stuck invisible.
export default function RevealDriver() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll("[data-reveal]"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            io.unobserve(en.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
  return null;
}
