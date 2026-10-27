"use client";

import { useEffect, useState } from "react";
import { APP_STORE_HREF } from "./app-store";

// The homepage's behaviour, ported from the concept's inline script:
//   1. scroll reveals on .reveal, gated by html.js so content shows without JS
//   2. the sticky install bar, once the hero button has gone and no other
//      install button is on screen
//   3. the Instagram-only hint when the App Store hand-off doesn't happen
// It also renders the bar and the hint, which sit after the footer as in the
// concept. Both render hidden on the server, so hydration matches.
export default function HomeClient() {
  const [barShown, setBarShown] = useState(false);
  const [hint, setHint] = useState<"off" | "mounting" | "on">("off");
  const [copied, setCopied] = useState(false);

  /* Scroll reveals: content is fully visible without JS or with reduced motion. */
  useEffect(() => {
    const html = document.documentElement;
    const reveals = Array.from(
      document.querySelectorAll<HTMLElement>(".cf-home .reveal"),
    );
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("is-in"));
      return;
    }
    // The concept sets html.js before first paint. Here the page has already
    // painted by hydration, so anything on screen or already scrolled past
    // stays shown instead of blinking out and fading back.
    const pending: HTMLElement[] = [];
    for (const el of reveals) {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-in");
      else pending.push(el);
    }
    html.classList.add("js");
    const ro = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            ro.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    pending.forEach((el) => ro.observe(el));
    return () => {
      ro.disconnect();
      html.classList.remove("js");
    };
  }, []);

  /* Sticky bar: show once the hero button is above the viewport and no other install button is visible. */
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const hero = document.getElementById("hero-cta");
    const ctas = document.querySelectorAll(".cf-home .cta");
    const visible = new Set<Element>();
    let heroGone = false;
    const co = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
        if (e.target === hero) heroGone = !e.isIntersecting && e.boundingClientRect.top < 0;
      });
      setBarShown(heroGone && visible.size === 0);
    });
    ctas.forEach((c) => co.observe(c));
    return () => co.disconnect();
  }, []);

  /* Instagram in-app browser fallback (never blocks; only a hint after a failed hand-off). */
  useEffect(() => {
    const isIG = /Instagram/i.test(navigator.userAgent);
    let timer: number | null = null;
    const cancel = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };
    const onVisibility = () => {
      if (document.hidden) cancel();
    };
    const onClick = (ev: MouseEvent) => {
      if (!isIG) return;
      const target = ev.target instanceof Element ? ev.target : null;
      if (!target?.closest('a[href^="https://apps.apple.com"]')) return;
      cancel();
      timer = window.setTimeout(() => {
        if (!document.hidden) setHint("mounting");
      }, 1800);
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", cancel);
    window.addEventListener("blur", cancel);
    document.addEventListener("click", onClick);
    // Add ?ig=1 to the URL to preview the hint.
    if (/[?&]ig=1/.test(window.location.search)) setHint("mounting");
    return () => {
      cancel();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", cancel);
      window.removeEventListener("blur", cancel);
      document.removeEventListener("click", onClick);
    };
  }, []);

  // Unhide first, then add .is-shown a frame later so the fade runs.
  useEffect(() => {
    if (hint !== "mounting") return;
    const raf = requestAnimationFrame(() => setHint("on"));
    return () => cancelAnimationFrame(raf);
  }, [hint]);

  function copyLink() {
    const done = () => setCopied(true);
    const fallback = () => {
      window.prompt("Copy this link", APP_STORE_HREF);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(APP_STORE_HREF).then(done, fallback);
    } else {
      fallback();
    }
  }

  return (
    <>
      {/* Sticky install bar: mobile only, slides up once the hero button has scrolled away,
          and hides whenever another install button is on screen. */}
      <div
        className={barShown ? "bar is-shown" : "bar"}
        id="bar"
        aria-hidden={barShown ? "false" : "true"}
      >
        <img src="/home/app-icon.png" alt="" width={40} height={40} />
        <span className="bar__text">
          <b>CourtFuel</b>
          <span>Basketball Coach</span>
        </span>
        <a
          className="bar__btn"
          href={APP_STORE_HREF}
          data-ct="ig-sticky"
          tabIndex={barShown ? 0 : -1}
        >
          Get the app
        </a>
      </div>

      {/* Instagram fallback: only shown inside Instagram's in-app browser, only if the
          App Store did not open ~1.8 s after a tap. Add ?ig=1 to the URL to preview it. */}
      <div
        className={hint === "on" ? "ig is-shown" : "ig"}
        id="ig"
        role="status"
        hidden={hint === "off"}
      >
        <div className="ig__text">
          <b>App Store didn&apos;t open?</b>
          <span>Tap ⋯ at the top right, then Open in browser.</span>
        </div>
        <button type="button" className="ig__copy" id="ig-copy" onClick={copyLink}>
          {copied ? "Copied" : "Copy link"}
        </button>
        <button
          type="button"
          className="ig__x"
          id="ig-x"
          aria-label="Close"
          onClick={() => setHint("off")}
        >
          ×
        </button>
      </div>
    </>
  );
}
