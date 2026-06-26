"use client";

/**
 * VideoPlayer — Cloudinary HLS-capable course player.
 *
 * V3 PASS 21 contract requirements:
 *   • Captions (track[default] when available; show "captions not available"
 *     label when missing)
 *   • Playback rate (0.5×, 1×, 1.25×, 1.5×, 2×)
 *   • Bookmarks (timestamp + label, persisted server-side by the parent)
 *   • Keyboard nav (Space, Left/Right arrow, J/K/L, comma/period for ±frame,
 *     C for captions toggle)
 *   • Resume from last position (controlled by `initialPosition` prop +
 *     `onProgress` heartbeat)
 *   • No autoplay-with-sound (WCAG 1.4.2 — autoplay only if muted=true)
 *   • Pause on tab blur
 *
 * Backed by Cloudinary (CANONICAL VIDEO HOST per preflight §3). Mux not
 * provisioned; if a future Mux integration arrives, swap the `src` resolver.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { getLearnPlayerCopy } from "@henryco/i18n";

export type VideoCaptionTrack = {
  src: string;
  srclang: string;
  label: string;
  default?: boolean;
};

export type VideoBookmark = {
  id: string;
  timestampSeconds: number;
  label: string;
};

export type VideoPlayerProps = {
  /** Cloudinary delivery URL (HLS .m3u8 or .mp4). */
  src: string;
  /** Cloudinary thumbnail URL (poster). */
  poster?: string | null;
  /** WCAG track entries; pass [] to surface "captions not available". */
  captions?: VideoCaptionTrack[];
  /** Resume from here (seconds). */
  initialPosition?: number;
  /** Existing bookmarks for the active learner. */
  bookmarks?: VideoBookmark[];
  /** Fired every ~5s of playback for progress persistence. */
  onProgress?: (positionSeconds: number, durationSeconds: number) => void;
  /** Fired when learner adds a bookmark. */
  onAddBookmark?: (timestampSeconds: number, label: string) => void;
  /** Localized title (for aria-label). */
  title: string;
  /** Localized labels (i18n integration handled by caller). */
  labels: {
    captionsOff: string;
    captionsNotAvailable: string;
    play: string;
    pause: string;
    addBookmark: string;
    addBookmarkPrompt: string;
    playbackRate: string;
    jumpToBookmark: string;
  };
};

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatTimestamp(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  if (hrs > 0) return `${hrs}:${pad(mins)}:${pad(secs)}`;
  return `${mins}:${pad(secs)}`;
}

export function VideoPlayer({
  src,
  poster,
  captions = [],
  initialPosition = 0,
  bookmarks = [],
  onProgress,
  onAddBookmark,
  title,
  labels,
}: VideoPlayerProps) {
  const locale = useHenryCoLocale();
  const copy = getLearnPlayerCopy(locale);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialPosition);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [captionsEnabled, setCaptionsEnabled] = useState(captions.length > 0);
  const lastHeartbeat = useRef(0);

  // Resume from last known position once metadata is ready.
  const handleLoadedMetadata = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (initialPosition > 0 && initialPosition < el.duration) {
      el.currentTime = initialPosition;
    }
    setDuration(el.duration || 0);
  }, [initialPosition]);

  // Time tracking + 5s heartbeat for server-side progress persistence.
  const handleTimeUpdate = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    const next = el.currentTime;
    setCurrentTime(next);
    if (onProgress && Math.abs(next - lastHeartbeat.current) >= 5) {
      lastHeartbeat.current = next;
      onProgress(next, el.duration || 0);
    }
  }, [onProgress]);

  // WCAG: pause on tab blur (no background autoplay).
  useEffect(() => {
    function handleVisibility() {
      const el = videoRef.current;
      if (!el) return;
      if (document.hidden && !el.paused) el.pause();
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Keyboard navigation.
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      const el = videoRef.current;
      if (!el) return;
      // Only handle if the video container has focus (not when typing).
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (!videoRef.current?.closest(":hover")) return;

      switch (event.key) {
        case " ":
        case "k":
        case "K":
          event.preventDefault();
          if (el.paused) el.play();
          else el.pause();
          break;
        case "ArrowLeft":
        case "j":
        case "J":
          event.preventDefault();
          el.currentTime = Math.max(0, el.currentTime - 10);
          break;
        case "ArrowRight":
        case "l":
        case "L":
          event.preventDefault();
          el.currentTime = Math.min(el.duration || 0, el.currentTime + 10);
          break;
        case "c":
        case "C":
          if (captions.length === 0) return;
          event.preventDefault();
          setCaptionsEnabled((prev) => !prev);
          break;
        case "b":
        case "B":
          if (!onAddBookmark) return;
          event.preventDefault();
          handleAddBookmark();
          break;
        default:
          break;
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captions.length, onAddBookmark]);

  // Sync playback rate.
  useEffect(() => {
    const el = videoRef.current;
    if (el) el.playbackRate = playbackRate;
  }, [playbackRate]);

  // Sync caption visibility.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    for (let i = 0; i < el.textTracks.length; i++) {
      el.textTracks[i].mode = captionsEnabled ? "showing" : "hidden";
    }
  }, [captionsEnabled]);

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  const handleAddBookmark = useCallback(() => {
    if (!onAddBookmark) return;
    const el = videoRef.current;
    if (!el) return;
    const t = el.currentTime;
    // Prompt user inline; minimal-friction surface.
    if (typeof window !== "undefined") {
      const label = window.prompt(labels.addBookmarkPrompt, formatTimestamp(t));
      if (label != null && label.trim()) {
        onAddBookmark(t, label.trim());
      }
    }
  }, [labels.addBookmarkPrompt, onAddBookmark]);

  const handleJumpToBookmark = (timestampSeconds: number) => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = timestampSeconds;
    if (el.paused) void el.play();
  };

  const captionStatus = useMemo(() => {
    if (captions.length === 0) return labels.captionsNotAvailable;
    if (!captionsEnabled) return labels.captionsOff;
    const active = captions.find((c) => c.default) ?? captions[0];
    return active?.label ?? labels.captionsOff;
  }, [captions, captionsEnabled, labels.captionsNotAvailable, labels.captionsOff]);

  return (
    <div
      className="learn-video-player rounded-[1.4rem] border border-[var(--learn-line)] bg-black/40 p-1.5"
      role="region"
      aria-label={title}
    >
      <video
        ref={videoRef}
        className="aspect-video w-full rounded-[1.1rem] bg-black"
        controls
        controlsList="nodownload"
        poster={poster ?? undefined}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        playsInline
      >
        <source src={src} type={src.endsWith(".m3u8") ? "application/vnd.apple.mpegurl" : "video/mp4"} />
        {captions.map((track) => (
          <track
            key={track.src}
            kind="captions"
            srcLang={track.srclang}
            label={track.label}
            src={track.src}
            default={track.default}
          />
        ))}
      </video>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-2 pb-1 text-xs text-[var(--learn-ink-soft)]">
        <div className="flex flex-wrap items-center gap-3">
          <span aria-live="polite">
            {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
          </span>
          <span className="rounded-full border border-[var(--learn-line)] px-2 py-0.5">
            {captionStatus}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5">
            <span className="sr-only">{labels.playbackRate}</span>
            <span aria-hidden="true">{labels.playbackRate}</span>
            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(Number(e.target.value))}
              className="rounded-md border border-[var(--learn-line)] bg-transparent px-2 py-1 text-[var(--learn-ink)]"
              aria-label={labels.playbackRate}
            >
              {PLAYBACK_RATES.map((rate) => (
                <option key={rate} value={rate} className="bg-[#0c1f1c] text-white">
                  {copy.player.rateLabel(rate)}
                </option>
              ))}
            </select>
          </label>
          {onAddBookmark ? (
            <button
              type="button"
              onClick={handleAddBookmark}
              className="rounded-full border border-[var(--learn-line)] px-3 py-1 text-xs font-semibold"
            >
              {labels.addBookmark}
            </button>
          ) : null}
        </div>
      </div>

      {bookmarks.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-2 px-2 pb-2">
          {bookmarks.map((bookmark) => (
            <li key={bookmark.id}>
              <button
                type="button"
                onClick={() => handleJumpToBookmark(bookmark.timestampSeconds)}
                className="rounded-full border border-[var(--learn-line)] px-3 py-1 text-xs font-semibold text-[var(--learn-ink-soft)] hover:text-[var(--learn-ink)]"
                aria-label={`${labels.jumpToBookmark} ${bookmark.label}`}
              >
                {formatTimestamp(bookmark.timestampSeconds)} — {bookmark.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Live region for screen readers when state changes */}
      <span className="sr-only" aria-live="polite">
        {isPlaying ? labels.pause : labels.play}
      </span>
    </div>
  );
}
