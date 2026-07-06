/**
 * @henryco/interactions — the ten interaction Engines from the
 * Public-Pages Interaction & Earning Doctrine (Part IV).
 *
 * Every public surface across the ecosystem consumes these so that the
 * same interaction behavior ships in marketplace, care, jobs, learn,
 * logistics, studio, property, hub, and the V3 showcase.
 *
 * Architecture: each engine is a pure, DOM-free logic core (unit-tested
 * with `tsx --test`) plus a thin `"use client"` React wrapper. The
 * package injects telemetry, i18n labels, currency formatting, and
 * persistence at the edges (React context) — it hard-imports none of
 * them. See docs/superpowers/specs/2026-07-06-interactions-engines-design.md.
 */

export {};
