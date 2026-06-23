# Architecture

## Core principles

VectorCrush is pass-based.

```txt
input SVG string
  -> pass 1
  -> pass 2
  -> pass 3
  -> optimized SVG string + reports
```

Each pass is a pure transformation:

```ts
type SvgPass = (svg: string, options: Options) => string;
```

## V0 limitation

V0 intentionally avoids a full XML/SVG AST. This keeps the first version small and easy to test. As soon as a pass needs true SVG semantics, introduce an AST layer before implementing it.

## Future architecture

- parser layer
- safe optimizer pass registry
- risky opt-in pass registry
- render-equivalence verifier
- benchmark runner
- Rust/WASM core
