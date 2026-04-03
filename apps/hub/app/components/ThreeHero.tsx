"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function ThreeHero({
  eyebrow,
  title,
  subtitle,
  imageUrl,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/6 p-6 shadow-[0_28px_120px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(900px_320px_at_15%_0%,rgba(255,255,255,0.12),transparent_60%),radial-gradient(700px_260px_at_85%_20%,rgba(255,255,255,0.08),transparent_55%)]" />
      <motion.div
        initial={reduceMotion ? false : { rotate: 0, scale: 0.98 }}
        animate={reduceMotion ? {} : { rotate: 6, scale: 1.02 }}
        transition={{ duration: 7, repeat: Infinity, repeatType: "reverse" }}
        className="pointer-events-none absolute -right-20 top-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(201,162,39,0.30),transparent_65%)] blur-3xl"
      />
      <motion.div
        initial={reduceMotion ? false : { rotate: 0, scale: 1 }}
        animate={reduceMotion ? {} : { rotate: -8, scale: 1.03 }}
        transition={{ duration: 9, repeat: Infinity, repeatType: "reverse" }}
        className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.22),transparent_65%)] blur-3xl"
      />

      <div className="relative grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <div>
          {eyebrow ? (
            <div className="inline-flex items-center rounded-full border border-white/12 bg-white/6 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-white/58">
              {eyebrow}
            </div>
          ) : null}

          <h1 className="mt-5 text-4xl font-semibold leading-[0.98] tracking-tight text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>

          {subtitle ? (
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/66 sm:text-lg">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[30px] border border-white/10 bg-black/25">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.18),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]">
                <div className="text-center">
                  <div className="text-xs uppercase tracking-[0.24em] text-white/45">
                    Premium page
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white/86">
                    Dynamic media-ready hero
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}