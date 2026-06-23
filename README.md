# VectorCrush

Fast, deterministic SVG optimization for icon packs and build pipelines.

VectorCrush starts small and safe:

- deterministic SVG output
- batch-friendly CLI
- safe cleanup passes
- snapshot-heavy test culture
- benchmark-first development

## Current scope

This repository is intentionally scoped as a **safe SVG cleanup and batch optimizer** first.

V0 avoids aggressive geometry rewrites. Path-level optimization, transform flattening, render equivalence, and WASM/native ports are later milestones.

Default V0 cleanup removes XML comments, normalizes conservative numeric attributes, sorts attributes deterministically, and normalizes whitespace between tags. Metadata removal is available as an explicit core option and is not enabled by default.

## Quick start

```bash
pnpm install
pnpm test
pnpm build
pnpm dev -- fixtures/simple/basic.svg --out .tmp/basic.optimized.svg
```

## CLI examples

```bash
vectorcrush fixtures/simple/basic.svg --out dist/basic.svg
vectorcrush icons --out dist/icons
vectorcrush check fixtures
```

## Development philosophy

1. Safe first.
2. Deterministic second.
3. Fast third.
4. Smaller output fourth.

A smaller SVG is not a win if it breaks rendering or causes noisy diffs.

## Packages

```txt
packages/core  SVG optimizer core and optimization passes
packages/cli   Command-line interface
```
