# mallory-ts

**Advanced college-level mathematics for TypeScript** — a modern, fully-typed,
test-covered port of the [Mallory](https://github.com/johnhenry/mallory)
ActionScript 3 library (a project worked on, on and off, since 2004).

Complex numbers, linear algebra over arbitrary algebraic structures,
combinatorics and number theory, an expression evaluator, and renderer-agnostic
graphing geometry — all rewritten in modern TypeScript with `node:test`.

```ts
import { ComplexMath, ComplexNumber, RealMath, Vector, StringEvaluator } from "mallory-ts";

ComplexMath.power(ComplexMath.E, new ComplexNumber(0, Math.PI)); // ≈ -1  (Euler)
RealMath.determinant(/* 3×3 matrix */);
StringEvaluator.evaluate("sin(pi/2) + 2^3", StringEvaluator.mathEnvironment()); // 9
```

## Install & use

Requires Node.js ≥ 22.6 (the test suite runs `.ts` directly via Node's built-in
type stripping).

```bash
npm install
npm test        # run the node:test suite
npm run build   # emit ./dist (ESM + .d.ts)
npm run typecheck
```

## Modules

| Area | Modules |
|------|---------|
| Foundations | `Vector`, `ComplexNumber`, `Type` |
| Real & complex analysis | `RealMath`, `ComplexMath` (arithmetic, trig, logs, numeric calculus, statistics) |
| Linear algebra | `VectorUtils`, matrix ops in `RealMath`/`ComplexMath`, generic linear algebra in `Structure` |
| Algebraic structures | `Structure` — groups/rings/fields; do linear algebra over e.g. GF(7) |
| Number theory & combinatorics | `IntegerMath`, `Permutation`, `Cycle`, `Polynomial` |
| Geometry | `Polygon`, `GraphUtils`, `Graph3DUtils` (emit paths/meshes as plain data) |
| Expressions | `Environment`, `Expression`, `StringEvaluator` |
| Misc | `Utilities`, `Logic`, `IntUtils`, `StringVarMath`, `SpecialOperator`, `Calculus` |

## About the port

This is a faithful port that **fixes bugs rather than carrying them over**, and
takes advantage of modern JavaScript/TypeScript: ES classes, generics, iterators,
`Array` subclassing, tagged unions, and `.ts`-native execution. Every module was
translated **test-first**.

A sampling of the ~40 bugs found and fixed while translating:

- **`RealMath.subtract` returned `a * b`.** (Yes, really.)
- **Order statistics were broken:** `sort` used the default *lexicographic* sort,
  so `minimum`/`maximum`/`median` were wrong for numbers.
- **`ComplexMath.divide`** compared `alpha.ivalue` (lowercase `v`, always
  `undefined`), so all eight directed-infinity results were dead code.
- **`ComplexMath.normalDistribution`** reciprocated the whole expression, putting
  the exponential in the denominator (wrong sign) — the normal PDF was inverted.
- **`solveN`** wasn't Newton's method — it assumed a derivative of 1 and diverged;
  now a real numeric Newton–Raphson.
- **`integrateN`** sampled at `2·x + interval`; **`differentiateN`** was a forward
  difference despite claiming to be symmetric.
- **`invertMatrix`** had no pivoting (divide-by-zero on a zero pivot); now uses
  partial pivoting (and a zero-pivot row swap in `Structure`, for finite fields).
- **`crossProduct`** read index 3 for the z-component and used truthiness tests
  that dropped zero components; **`powerMatrix`** never actually multiplied.
- **`Vector.setElement`** infinitely recursed on a falsy slot.
- **`ComplexNumber` string parsing** crashed on non-matches and couldn't
  round-trip negative imaginary parts; it also swallowed every `*`, so `"4*2"`
  parsed as `42`.
- **`StringEvaluator`** was uniformly right-associative (`10-2-3 → 11`); now
  left-associative for `+ - * / %` and right-associative for `^`.
- **`Polynomial.multiply`** referenced a non-existent `dimension.value`;
  **`Polynomial.antiderivative`** dropped its highest-degree term.
- **`IntegerMath.modulus`** recursed one step at a time (stack overflow);
  `primeFactors` infinite-looped on `0` and negatives.
- **`Structure`**'s matrix section was non-functional (static/instance confusion,
  undefined references) and is reconstructed as working generic linear algebra.
- `IntUtils` spelled "forty" and "ninety" as "fourty" and "ninty".

Where the original genuinely had *no* verifiable intended behavior — the Flash
3D ribbon geometry in `Graph3DUtils` — the math is ported verbatim with an
explicit note rather than "fixed" by guesswork. The Flash rendering utilities
(`GraphUtils`/`Graph3DUtils`) now return renderer-agnostic geometry (2D paths,
3D meshes) instead of Flash display objects.

## Beyond the original

A completeness pass added the missing counterparts and a few natural supplements
the AS3 library never had:

- **`ComplexNumber`**: `fromPolar`, `fromVector`, `fromXML` (inverses of
  `magnitude`/`angle`, `toVector`, `toXML`).
- **`Vector`**: `fromXML`, `fromString` (best-effort inverses of `toXML`/`toString`).
- **`Polynomial`**: `evaluate` (Horner), `add`/`subtract`, `divide`/`mod`/`divmod`
  (long division), and `parse` (inverse of `toPolyString`).
- **`Polygon`**: `centroid`, `contains` (point-in-polygon), `isConvex`, `isSimple`.
- **`RealMath`/`ComplexMath`**: `populationVariance` / `populationStandardDeviation`
  alongside the sample versions.
- **`Structure` presets**: `Structure.realField()`, `complexField()`,
  `integersModulo(n)` (a field when `n` is prime), and `booleanRing()` — so you
  can do linear algebra over these without wiring up operations by hand:

  ```ts
  const gf7 = Structure.integersModulo(7);
  gf7.invertMatrix(/* a matrix over GF(7) */); // Gauss-Jordan over the finite field
  ```

## License

MIT
