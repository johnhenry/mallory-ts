# Mallory → TypeScript port progress

Porting `johnhenry/mallory` (ActionScript 3, ~11.4k LOC) to modern TypeScript with
`node:test`. Tests are written **before** each module is translated. Bugs are fixed
in translation, not carried over.

## Dependency order (leaves first)

1. **Foundation (no internal deps):** Vector, ComplexNumber, Utilities, Type,
   IntUtils, Logic, Calculus, SpecialOperator, StringVarMath, Enviornment
2. **Layer 1:** VectorUtils (Vector), Structure (Vector, VectorUtils)
3. **Core numeric cluster:** ComplexMath, RealMath (both ↔ ComplexNumber/Vector/Type)
4. **Combinatorics cluster:** Permutation ↔ Cycle ↔ IntegerMath
5. Polynomial (Vector), Polygon (ComplexMath, RealMath, ...)
6. **Expression stack:** Expression, StringEvaluator (+ Enviornment, SpecialOperator)
7. **Graphing:** GraphUtils, Graph3DUtils — Flash rendering re-shaped to emit geometry

## Status

| Module | Tests | Ported | Notes |
|---|---|---|---|
| Vector | ✅ | ✅ | Fixed `setElement` infinite recursion; x/y/z/t keep stored 0 |
| ComplexNumber | ✅ | ✅ | Fixed `parse` null-match crash & negative-imag round-trip |
| Utilities | | | AS3 body fully commented out — reviving useful helpers |
| Type | | | |
| ... | | | |

## Bugs found & fixed
- `Vector.setElement` infinitely recursed on falsy slots → now pads & assigns.
- `Vector` x/y/z/t accessors coerced stored `0` to missing → now return real value.
- `ComplexNumber.fromString` crashed when `String.match` returned `null`, and
  emitted `a+-b*i` for negative imaginary parts (couldn't round-trip) → rewritten `parse`.
