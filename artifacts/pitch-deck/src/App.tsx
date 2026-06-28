/**
 * Platform contract file — do not restructure.
 *
 * This file is part of the contract between the slides artifact and
 * the surrounding workspace tooling (preview, thumbnails, exports).
 * Reorganizing it, swapping the router, or changing the structure
 * of `AllSlides` can quietly break that tooling even when the page
 * still looks correct in the preview.
 *
 * Agents: see the slides skill `<workspace_contract>` for the full
 * rules, and `references/visual_qa.md` → "Platform contract sanity
 * check" if this file has been hand-edited and needs repair.
 */

import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

import { slides } from "@/slideLoader";
import rawManifest from "@/data/slides-manifest.json";
import fileExportRecord from "@/data/export-record.json";

const PRESENTER_CHANNEL = "presenter-sync";

const SLIDE_W = 1280;
const SLIDE_H = 720;

function ScaledSlide({ children, bgColor }: { children: React.ReactNode; bgColor?: string }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      const sx = window.innerWidth / SLIDE_W;
      const sy = window.innerHeight / SLIDE_H;
      setScale(Math.min(sx, sy));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: bgColor ?? "#000",
        overflow: "hidden",
        transition: "background 0.3s ease",
      }}
    >
      <div
        style={{
          width: SLIDE_W,
          height: SLIDE_H,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Full manifest JSON fingerprint — covers every field (id, position, filepath,
// title, description, speakerNotes). Changes whenever any agent or workspace UI
// edit touches the manifest, including reorders, renames, and note updates.
const DECK_FINGERPRINT = JSON.stringify(rawManifest);

// Per-format export tracking — both PDF and PPTX are tracked independently.
const EXPORT_STORAGE_KEY = "pitch-deck:exports-v2";

interface FormatRecord {
  fingerprint: string;
  exportedAt: string;
}

interface ExportStore {
  pdf?: FormatRecord;
  pptx?: FormatRecord;
}

// Seed from the committed export-record.json so agent-triggered exports
// (which write that file) are visible even in a fresh browser session.
function loadExportStore(): ExportStore {
  const file = fileExportRecord as { pdf: FormatRecord | null; pptx: FormatRecord | null };
  let stored: ExportStore = {};
  try {
    const raw = localStorage.getItem(EXPORT_STORAGE_KEY);
    if (raw) stored = JSON.parse(raw) as ExportStore;
  } catch {
    // ignore malformed value
  }
  // For each format, pick the more-recent record between file and localStorage.
  const merged: ExportStore = {};
  for (const fmt of ["pdf", "pptx"] as const) {
    const fileRec = file[fmt];
    const localRec = stored[fmt];
    if (!fileRec && !localRec) continue;
    if (!fileRec) { merged[fmt] = localRec; continue; }
    if (!localRec) { merged[fmt] = fileRec; continue; }
    merged[fmt] = new Date(fileRec.exportedAt) >= new Date(localRec.exportedAt) ? fileRec : localRec;
  }
  return merged;
}

function getSlideIndex(pathname: string): number {
  const match = pathname.match(/^\/slide(\d+)$/);
  if (!match) return -1;
  const position = parseInt(match[1], 10);
  return slides.findIndex((s) => s.position === position);
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function SlideEditor() {
  const [location, navigate] = useLocation();
  const currentIndex = getSlideIndex(location);

  // In the workspace, the slide iframe is nested inside another iframe,
  // so window.parent !== window.parent.parent. In the deployed SlideViewer,
  // the parent is the top-level window, so they're equal. Disable local
  // navigation only in the workspace — the parent owns it there.
  const navigationDisabledRef = useRef(window.parent !== window.parent.parent);
  const touchHandledRefStable = useRef(false);

  useEffect(() => {
    if (currentIndex === -1) return;
    window.parent.postMessage({ type: "slideChanged", index: currentIndex }, "*");
  }, [currentIndex]);

  useEffect(() => {
    if (currentIndex === -1) return;

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (navigationDisabledRef.current) return;
      if (event.key === " ") {
        event.preventDefault();
      }
      if ((event.key === "ArrowLeft" || event.key === "ArrowUp") && currentIndex > 0) {
        navigate(`/slide${slides[currentIndex - 1].position}`);
      }
      if (
        (event.key === "ArrowRight" || event.key === "ArrowDown" || event.key === " ") &&
        currentIndex < slides.length - 1
      ) {
        navigate(`/slide${slides[currentIndex + 1].position}`);
      }
    };

    const INTERACTIVE =
      "a,button,video,audio,input,select,textarea,details,summary,iframe,svg,canvas," +
      '[role="button"],[contenteditable="true"]';

    const isInteractive = (target: EventTarget | null) =>
      (target as HTMLElement | null)?.closest?.(INTERACTIVE);

    const touchHandledRef = touchHandledRefStable;

    const onClick = (event: MouseEvent) => {
      if (touchHandledRef.current) {
        touchHandledRef.current = false;
        return;
      }
      if (event.button !== 0 || event.metaKey || event.ctrlKey) return;
      if (isInteractive(event.target)) return;

      if (navigationDisabledRef.current) {
        window.parent.postMessage({ type: "advanceSlide" }, "*");
        return;
      }

      if (currentIndex < slides.length - 1) {
        navigate(`/slide${slides[currentIndex + 1].position}`);
      }
    };

    let touchStartX = 0;
    let touchStartY = 0;
    let touchTarget: EventTarget | null = null;

    const onTouchStart = (event: TouchEvent) => {
      touchHandledRef.current = false;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
      touchTarget = event.target;
    };

    const onTouchEnd = (event: TouchEvent) => {
      const dx = event.changedTouches[0].clientX - touchStartX;
      const dy = event.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) >= 10 || Math.abs(dy) >= 10) return;
      if (isInteractive(touchTarget)) return;
      touchHandledRef.current = true;

      if (navigationDisabledRef.current) {
        window.parent.postMessage({ type: "advanceSlide" }, "*");
        return;
      }

      const fraction = touchStartX / window.innerWidth;
      if (fraction < 0.4 && currentIndex > 0) {
        navigate(`/slide${slides[currentIndex - 1].position}`);
      } else if (fraction >= 0.4 && currentIndex < slides.length - 1) {
        navigate(`/slide${slides[currentIndex + 1].position}`);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("click", onClick);
    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("click", onClick);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [currentIndex, navigate]);

  return (
    <div className="select-none">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          style={{ display: index === currentIndex ? "block" : "none" }}
        >
          <ScaledSlide bgColor={slide.bgColor}>
            <slide.Component />
          </ScaledSlide>
        </div>
      ))}
    </div>
  );
}

// Scales the AllSlides content to fit narrow browser windows on screen
// while leaving print output untouched (handled via .allslides-outer CSS).
function AllSlidesWrapper() {
  const [, navigate] = useLocation();
  const [scale, setScale] = useState(() =>
    typeof window !== "undefined" ? Math.min(1, window.innerWidth / 1920) : 1,
  );

  useEffect(() => {
    const update = () => setScale(Math.min(1, window.innerWidth / 1920));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const numSlides = slides.length;
  const visualW = Math.round(1920 * scale);
  const visualH = Math.round(numSlides * 1080 * scale);

  const handleBack = () => {
    navigate(`/slide${slides[0].position}`);
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Print bar — hidden automatically by @media print */}
      <div className="print-bar">
        <button className="print-bar-btn print-bar-btn--back" onClick={handleBack}>
          ← Back to slides
        </button>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
          Use your browser's <strong>Save as PDF</strong> option in the print dialog
        </span>
        <span style={{ flex: 1 }} />
        <button className="print-bar-btn print-bar-btn--print" onClick={() => window.print()}>
          🖨️ Print / Save as PDF
        </button>
      </div>

      <div
        className="allslides-outer"
        style={{ width: visualW, height: visualH, overflow: "hidden" }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: 1920,
          }}
        >
          <AllSlides />
        </div>
      </div>
    </div>
  );
}

// Do not rewrite this component. Each slide must remain wrapped in
// `<div className="slide">` sized 1920×1080 — the class name and
// dimensions are part of the platform contract. See the file-level
// banner above for context.
function AllSlides() {
  return (
    <div className="bg-black">
      {slides.map((slide) => (
        <div
          key={slide.id}
          className="slide relative aspect-video overflow-hidden"
          style={{
            width: "1920px",
            height: "1080px",
            background: slide.bgColor ?? "#000",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${SLIDE_W}px`,
              height: `${SLIDE_H}px`,
              transform: `scale(${1920 / SLIDE_W})`,
              transformOrigin: "top left",
            }}
          >
            <slide.Component />
          </div>
        </div>
      ))}
    </div>
  );
}

const NOTES_PANEL_HEIGHT = 220;

// Presenter popup window — opened via window.open() at /presenter
function PresenterPopup() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const thumbnailIframeRef = useRef<HTMLIFrameElement>(null);
  const nextThumbnailIframeRef = useRef<HTMLIFrameElement>(null);
  const startTimeRef = useRef(Date.now());
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  // BroadcastChannel: listen for slide changes from main window
  useEffect(() => {
    const channel = new BroadcastChannel(PRESENTER_CHANNEL);
    channelRef.current = channel;

    channel.onmessage = (e: MessageEvent) => {
      if (e.data?.type === "slideChanged" && typeof e.data.index === "number") {
        setCurrentIndex(e.data.index);
      }
    };

    // Ask main window to send current state immediately
    channel.postMessage({ type: "requestState" });

    return () => channel.close();
  }, []);

  // Sync thumbnail iframe when slide changes
  useEffect(() => {
    const slide = slides[currentIndex];
    if (!slide || !thumbnailIframeRef.current) return;
    thumbnailIframeRef.current.contentWindow?.postMessage(
      { type: "navigateToSlide", position: slide.position },
      "*",
    );
  }, [currentIndex]);

  // Sync next-slide thumbnail iframe when slide changes
  useEffect(() => {
    const nextSlide = slides[currentIndex + 1];
    if (!nextSlide || !nextThumbnailIframeRef.current) return;
    nextThumbnailIframeRef.current.contentWindow?.postMessage(
      { type: "navigateToSlide", position: nextSlide.position },
      "*",
    );
  }, [currentIndex]);

  // Elapsed timer
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const sendNav = (direction: "prev" | "next") => {
    channelRef.current?.postMessage({ type: "navigate", direction });
  };

  const currentSlide = slides[currentIndex];
  const notes = currentSlide?.speakerNotes ?? "";
  const firstPosition = slides.length > 0 ? slides[0].position : 1;
  const isLastSlide = currentIndex === slides.length - 1;
  const nextSlide = slides[currentIndex + 1];
  const secondPosition = slides.length > 1 ? slides[1].position : firstPosition;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        background: "#0d1117",
        color: "#e5e7eb",
        fontFamily: "system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.5rem 1.25rem",
          background: "#111827",
          borderBottom: "1px solid #1f2937",
          flexShrink: 0,
        }}
      >
        <span style={{ color: "#03989e", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Presenter View
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
            Slide <strong style={{ color: "#e5e7eb" }}>{currentIndex + 1}</strong> / {slides.length}
          </span>
          <span
            style={{
              fontVariantNumeric: "tabular-nums",
              fontSize: "1.1rem",
              fontWeight: 700,
              color: elapsed >= 3600 ? "#f87171" : "#03989e",
              letterSpacing: "0.06em",
            }}
          >
            {formatElapsed(elapsed)}
          </span>
        </div>
      </div>

      {/* Main content area */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          gap: "0",
        }}
      >
        {/* Left: slide thumbnail */}
        <div
          style={{
            width: "340px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#111827",
            borderRight: "1px solid #1f2937",
            padding: "1rem",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              width: "100%",
              aspectRatio: "16/9",
              background: "#000",
              borderRadius: "6px",
              overflow: "hidden",
              boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
              position: "relative",
            }}
          >
            <iframe
              ref={thumbnailIframeRef}
              src={`${base}/slide${firstPosition}`}
              style={{
                width: "1920px",
                height: "1080px",
                border: "none",
                transform: "scale(0.1615)",
                transformOrigin: "top left",
                pointerEvents: "none",
              }}
              title="Slide thumbnail"
            />
          </div>

          <div
            style={{
              fontSize: "0.75rem",
              color: "#6b7280",
              textAlign: "center",
              fontStyle: "italic",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {currentSlide?.title ?? ""}
          </div>

          {/* Next slide preview */}
          <div
            style={{
              width: "100%",
              borderTop: "1px solid #1f2937",
              paddingTop: "0.6rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
            }}
          >
            <div
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                color: "#6b7280",
                letterSpacing: "0.09em",
                textTransform: "uppercase",
              }}
            >
              Up Next
            </div>
            {isLastSlide ? (
              <div
                style={{
                  width: "100%",
                  aspectRatio: "16/9",
                  background: "#1f2937",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #374151",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#6b7280",
                    fontStyle: "italic",
                    fontWeight: 500,
                  }}
                >
                  Last slide
                </span>
              </div>
            ) : (
              <div
                style={{
                  width: "100%",
                  aspectRatio: "16/9",
                  background: "#000",
                  borderRadius: "4px",
                  overflow: "hidden",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
                  position: "relative",
                  border: "1px solid #374151",
                }}
              >
                <iframe
                  ref={nextThumbnailIframeRef}
                  src={`${base}/slide${secondPosition}`}
                  style={{
                    width: "1920px",
                    height: "1080px",
                    border: "none",
                    transform: "scale(0.1615)",
                    transformOrigin: "top left",
                    pointerEvents: "none",
                  }}
                  title="Next slide thumbnail"
                />
              </div>
            )}
            {!isLastSlide && nextSlide?.title && (
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "#6b7280",
                  fontStyle: "italic",
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {nextSlide.title}
              </div>
            )}
          </div>

          {/* Nav buttons */}
          <div style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
            <button
              onClick={() => sendNav("prev")}
              disabled={currentIndex === 0}
              style={{
                flex: 1,
                padding: "0.4rem 0",
                background: currentIndex === 0 ? "rgba(31,41,55,0.4)" : "rgba(31,41,55,0.9)",
                color: currentIndex === 0 ? "#4b5563" : "#e5e7eb",
                border: "1px solid rgba(75,85,99,0.5)",
                borderRadius: "5px",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: currentIndex === 0 ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.3rem",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Prev
            </button>
            <button
              onClick={() => sendNav("next")}
              disabled={currentIndex === slides.length - 1}
              style={{
                flex: 1,
                padding: "0.4rem 0",
                background: currentIndex === slides.length - 1 ? "rgba(31,41,55,0.4)" : "rgba(3,152,158,0.85)",
                color: currentIndex === slides.length - 1 ? "#4b5563" : "#fff",
                border: "none",
                borderRadius: "5px",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: currentIndex === slides.length - 1 ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.3rem",
              }}
            >
              Next
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Right: speaker notes */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "1.25rem 1.5rem",
            overflowY: "auto",
            gap: "0.5rem",
          }}
        >
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "#03989e",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            Speaker Notes
          </div>
          {notes ? (
            <div
              style={{
                color: "#e5e7eb",
                fontSize: "1rem",
                lineHeight: 1.75,
                whiteSpace: "pre-wrap",
              }}
            >
              {notes}
            </div>
          ) : (
            <div style={{ color: "#4b5563", fontStyle: "italic", fontSize: "0.9rem" }}>
              No speaker notes for this slide.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// This component is used for the deployed view at `/`
function SlideViewer() {
  const [, navigate] = useLocation();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [presenterMode, setPresenterMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [popupOpen, setPopupOpen] = useState(false);
  const [exportStore, setExportStore] = useState<ExportStore>({});
  const popupRef = useRef<Window | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const currentIndexRef = useRef(currentIndex);

  // Load export store on mount (merges committed file + localStorage)
  useEffect(() => {
    setExportStore(loadExportStore());
  }, []);

  // Keep ref in sync with state so channel handler always reads latest value
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // BroadcastChannel: sync with presenter popup
  useEffect(() => {
    const channel = new BroadcastChannel(PRESENTER_CHANNEL);
    channelRef.current = channel;

    channel.onmessage = (e: MessageEvent) => {
      if (e.data?.type === "requestState") {
        channel.postMessage({ type: "slideChanged", index: currentIndexRef.current });
      } else if (e.data?.type === "navigate") {
        if (e.data.direction === "prev") {
          setCurrentIndex((i) => {
            const next = Math.max(0, i - 1);
            iframeRef.current?.contentWindow?.postMessage(
              { type: "navigateToSlide", position: slides[next].position },
              "*",
            );
            return next;
          });
        } else {
          setCurrentIndex((i) => {
            const next = Math.min(slides.length - 1, i + 1);
            iframeRef.current?.contentWindow?.postMessage(
              { type: "navigateToSlide", position: slides[next].position },
              "*",
            );
            return next;
          });
        }
      }
    };

    return () => channel.close();
  }, []);

  // Broadcast slide changes to popup
  useEffect(() => {
    channelRef.current?.postMessage({ type: "slideChanged", index: currentIndex });
  }, [currentIndex]);

  // Poll for popup closed so we can update state
  useEffect(() => {
    if (!popupOpen) return;
    const id = setInterval(() => {
      if (popupRef.current?.closed) {
        popupRef.current = null;
        setPopupOpen(false);
      }
    }, 500);
    return () => clearInterval(id);
  }, [popupOpen]);

  const calcDims = (presMode: boolean) => {
    const ah = presMode ? window.innerHeight - NOTES_PANEL_HEIGHT : window.innerHeight;
    return {
      width: Math.min(window.innerWidth, ah * (16 / 9)),
      height: Math.min(ah, window.innerWidth * (9 / 16)),
    };
  };

  // When popup is open, slide always gets full-screen dims
  const [dims, setDims] = useState(() => calcDims(false));

  useEffect(() => {
    const update = () => setDims(calcDims(presenterMode && !popupOpen));
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [presenterMode, popupOpen]);

  useEffect(() => {
    setDims(calcDims(presenterMode && !popupOpen));
    if (presenterMode) {
      setElapsed(0);
    }
  }, [presenterMode, popupOpen]);

  // Inline timer — runs while presenter mode is active and popup is not open
  useEffect(() => {
    if (!presenterMode || popupOpen) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [presenterMode, popupOpen]);

  const handleExportPdf = () => {
    // Record the export intent in localStorage so the stale indicator updates
    setExportStore((prev) => {
      const next: ExportStore = {
        ...prev,
        pdf: { fingerprint: DECK_FINGERPRINT, exportedAt: new Date().toISOString() },
      };
      try {
        localStorage.setItem(EXPORT_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
    // Navigate within the same tab — no popup needed, works in all contexts
    navigate("/allslides");
  };

  const handlePopOut = () => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    const popup = window.open(
      `${base}/presenter`,
      "presenter-popup",
      "width=780,height=520,resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no",
    );
    if (popup) {
      popupRef.current = popup;
      setPopupOpen(true);
    }
  };

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== " " &&
          event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      if (event.key === " ") event.preventDefault();

      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        setCurrentIndex((i) => Math.max(0, i - 1));
      } else {
        setCurrentIndex((i) => Math.min(slides.length - 1, i + 1));
      }

      iframeRef.current?.contentWindow?.dispatchEvent(
        new KeyboardEvent("keydown", { key: event.key, code: event.code, bubbles: true }),
      );
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "slideChanged" && typeof event.data.index === "number") {
        setCurrentIndex(event.data.index);
      } else if (event.data?.type === "advanceSlide") {
        setCurrentIndex((i) => Math.min(slides.length - 1, i + 1));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const firstPosition = slides.length > 0 ? slides[0].position : 1;
  const currentSlide = slides[currentIndex];
  const notes = currentSlide?.speakerNotes ?? "";

  // Notes panel shown only in presenter mode and when popup is NOT open
  const showNotesPanel = presenterMode && !popupOpen;

  return (
    <div
      className="slide-viewer h-screen w-screen overflow-hidden bg-black flex flex-col"
      onClick={() => iframeRef.current?.focus()}
    >
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <iframe
          ref={iframeRef}
          src={`${base}/slide${firstPosition}`}
          style={{ width: dims.width, height: dims.height, border: "none" }}
          onLoad={() => iframeRef.current?.focus()}
          title="Slide viewer"
        />
      </div>

      {showNotesPanel && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            height: NOTES_PANEL_HEIGHT,
            flexShrink: 0,
            background: "#111827",
            borderTop: "2px solid #1f2937",
            display: "flex",
            flexDirection: "column",
            padding: "0.875rem 1.25rem 1rem",
            gap: "0.4rem",
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexShrink: 0 }}>
            <span style={{ color: "#03989e", fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Presenter Notes
            </span>
            <span style={{ color: "#4b5563", fontSize: "0.7rem" }}>
              Slide {currentIndex + 1} / {slides.length} — {currentSlide?.title ?? ""}
            </span>
            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: "1rem",
                fontWeight: 700,
                color: elapsed >= 3600 ? "#ef4444" : elapsed >= 1800 ? "#f59e0b" : "#e5e7eb",
                letterSpacing: "0.05em",
                minWidth: "3.5rem",
                textAlign: "right",
              }}>
                {formatElapsed(elapsed)}
              </span>
              <button
                onClick={() => setElapsed(0)}
                style={{
                  padding: "0.15rem 0.45rem",
                  background: "rgba(31,41,55,0.8)",
                  color: "#9ca3af",
                  border: "1px solid rgba(75,85,99,0.5)",
                  borderRadius: "4px",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  letterSpacing: "0.04em",
                }}
              >
                Reset
              </button>
              <button
                onClick={handlePopOut}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: "0.25rem 0.65rem",
                  background: "rgba(3,152,158,0.15)",
                  color: "#03989e",
                  border: "1px solid rgba(3,152,158,0.4)",
                  borderRadius: "5px",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  letterSpacing: "0.02em",
                  transition: "background 0.15s",
                }}
                title="Open notes in a separate window"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 3 21 3 21 9"/>
                  <polyline points="9 21 3 21 3 15"/>
                  <line x1="21" y1="3" x2="14" y2="10"/>
                  <line x1="3" y1="21" x2="10" y2="14"/>
                </svg>
                Pop out
              </button>
            </span>
          </div>
          {notes ? (
            <div style={{ color: "#e5e7eb", fontSize: "0.88rem", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
              {notes}
            </div>
          ) : (
            <div style={{ color: "#4b5563", fontStyle: "italic", fontSize: "0.85rem" }}>
              No speaker notes for this slide.
            </div>
          )}
        </div>
      )}

      {/* Popup-open indicator when notes panel is hidden */}
      {presenterMode && popupOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            bottom: "1rem",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.35rem 0.9rem",
            background: "rgba(3,152,158,0.18)",
            border: "1px solid rgba(3,152,158,0.4)",
            borderRadius: "20px",
            color: "#03989e",
            fontSize: "0.75rem",
            fontWeight: 600,
            zIndex: 40,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9"/>
            <polyline points="9 21 3 21 3 15"/>
            <line x1="21" y1="3" x2="14" y2="10"/>
            <line x1="3" y1="21" x2="10" y2="14"/>
          </svg>
          Presenter window open
          <button
            onClick={() => { popupRef.current?.close(); popupRef.current = null; setPopupOpen(false); }}
            style={{
              background: "none",
              border: "none",
              color: "#9ca3af",
              cursor: "pointer",
              fontSize: "0.8rem",
              padding: "0 0.1rem",
              lineHeight: 1,
            }}
            title="Close presenter window"
          >
            ✕
          </button>
        </div>
      )}

      <div
        style={{ position: "absolute", top: "1rem", right: "1rem", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem", zIndex: 50 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setPresenterMode((m) => !m)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.45rem 1rem",
              background: presenterMode ? "rgba(3,152,158,0.92)" : "rgba(31,41,55,0.92)",
              color: "#fff",
              border: presenterMode ? "none" : "1px solid rgba(75,85,99,0.7)",
              borderRadius: "6px",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.01em",
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
              transition: "background 0.2s",
            }}
            title="Toggle presenter view"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <path d="M8 21h8M12 17v4"/>
            </svg>
            {presenterMode ? "Exit Presenter" : "Presenter View"}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleExportPdf();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.45rem 1rem",
              background: "rgba(3,152,158,0.92)",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.01em",
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
              transition: "background 0.2s",
            }}
            title="Export all slides as PDF"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export PDF
          </button>
        </div>
        {(() => {
          // A format is stale when it has never been exported OR its fingerprint
          // no longer matches the current manifest.
          const pdfNever = !exportStore.pdf;
          const pptxNever = !exportStore.pptx;
          const pdfStale = pdfNever || exportStore.pdf!.fingerprint !== DECK_FINGERPRINT;
          const pptxStale = pptxNever || exportStore.pptx!.fingerprint !== DECK_FINGERPRINT;
          if (!pdfStale && !pptxStale) return null;

          const parts: string[] = [];
          if (pdfStale) parts.push(pdfNever ? "PDF never exported" : "PDF out of date");
          if (pptxStale) parts.push(pptxNever ? "PPTX never exported" : "PPTX out of date");
          const label = parts.join(" · ");

          const lines: string[] = [];
          if (pdfStale) {
            lines.push(pdfNever
              ? "PDF: never exported for this deck"
              : `PDF: export last initiated ${new Date(exportStore.pdf!.exportedAt).toLocaleString()} — deck changed since then`);
          }
          if (pptxStale) {
            lines.push(pptxNever
              ? "PPTX: never exported for this deck"
              : `PPTX: exported ${new Date(exportStore.pptx!.exportedAt).toLocaleString()} — deck changed since then`);
          }
          const tooltip = lines.join("\n");

          return (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.22rem 0.6rem",
                background: "rgba(245,158,11,0.12)",
                border: "1px solid rgba(245,158,11,0.35)",
                borderRadius: "5px",
                color: "#f59e0b",
                fontSize: "0.72rem",
                fontWeight: 600,
                letterSpacing: "0.02em",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
              }}
              title={tooltip}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              {label}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default function App() {
  const [location, navigate] = useLocation();

  // DO NOT edit this useEffect - redirects unknown routes to the first slide.
  // The "/" and "/allslides" routes are handled separately below.
  useEffect(() => {
    if (
      location !== "/" &&
      location !== "/allslides" &&
      location !== "/presenter" &&
      getSlideIndex(location) === -1
    ) {
      if (slides.length > 0) {
        navigate(`/slide${slides[0].position}`, { replace: true });
      }
    }
  }, [location, navigate]);

  // DO NOT edit this useEffect - allows the parent frame to navigate
  // between slides via postMessage so it can avoid changing the iframe
  // src (which causes a white flash).
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (
        event.data?.type === "navigateToSlide" &&
        typeof event.data.position === "number" &&
        slides.some((s) => s.position === event.data.position)
      ) {
        navigate(`/slide${event.data.position}`);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [navigate]);

  if (location === "/") return <SlideViewer />;
  if (location === "/allslides") return <AllSlidesWrapper />;
  if (location === "/presenter") return <PresenterPopup />;
  return <SlideEditor />;
}
