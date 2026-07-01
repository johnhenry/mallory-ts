# Cookbook

Task-oriented recipes across every domain mallory-ts covers. Each snippet is
self-contained, runnable, and pulled directly from the test suite (or verified
against it) — see the linked test file if you want the full context.

All examples assume:

```ts
import { /* ... */ } from "mallory-ts";
```

## Complex numbers & Euler's identity

```ts
import { ComplexMath, ComplexNumber } from "mallory-ts";

const eulers = ComplexMath.power(ComplexMath.E, new ComplexNumber(0, Math.PI));
// eulers ≈ -1 + 0i
```

See [`test/ComplexMath.test.ts`](../test/ComplexMath.test.ts).

## Descriptive statistics

```ts
import { RealMath, Vector } from "mallory-ts";

const sample = Vector.fromArray([2, 4, 4, 4, 5, 5, 7, 9]);
RealMath.mean(sample); // 5
RealMath.variance(sample); // sample variance (n-1 denominator)
RealMath.populationVariance(sample); // population variance (n denominator) = 4
```

## Numeric linear algebra basics

For small dense matrices with a single number type, `RealMath`/`ComplexMath`
provide direct matrix operations:

```ts
import { RealMath, Vector } from "mallory-ts";

const A = Vector.fromArray([Vector.fromArray([4, 3]), Vector.fromArray([6, 3])]);
RealMath.determinant(A); // -6
const inv = RealMath.invertMatrix(A); // partial pivoting, no divide-by-zero
RealMath.multiplyMatrix(A, inv); // ≈ identity
```

## Linear algebra over an arbitrary algebraic structure

`Structure` generalizes the same matrix operations over any field/ring —
finite fields, rationals, quaternions, dual numbers — via one generic API:

```ts
import { Structure, Vector } from "mallory-ts";

const gf7 = Structure.integersModulo(7); // GF(7), a finite field
gf7.reciprocal(3); // 5  (3 * 5 = 15 ≡ 1 mod 7)

const a = Vector.fromArray([Vector.fromArray([2, 3]), Vector.fromArray([1, 4])]);
const inv = gf7.invertMatrix(a); // Gauss-Jordan over GF(7)
gf7.multiplyMatrix(a, inv); // identity matrix, entries mod 7
```

Swap in `Structure.rationalField()` for exact fraction arithmetic, or
`Structure.quaternionRing()`/`Structure.dualNumbers()` to do linear algebra
over those number types with no extra wiring. See
[`test/Structure.test.ts`](../test/Structure.test.ts) and
[`test/NumberTypes.test.ts`](../test/NumberTypes.test.ts).

## Numerical linear algebra (decompositions, least squares)

`MatrixMath` accepts either a `Matrix<number>` or a plain `number[][]`:

```ts
import { MatrixMath } from "mallory-ts";

const A = [
  [4, 3, 2],
  [6, 3, 4],
  [1, 2, 5],
];
MatrixMath.solve(A, [1, 2, 3]); // LU with partial pivoting

const sym = [
  [2, 1],
  [1, 2],
];
MatrixMath.eigenSymmetric(sym); // { values, vectors }, descending order

MatrixMath.leastSquares(A, [1, 2, 3]); // normal-equations fit
MatrixMath.svd(A); // { U, singularValues, V }
MatrixMath.conditionNumber(A); // spectral norm ratio
```

See [`test/MatrixMath.test.ts`](../test/MatrixMath.test.ts).

## Evaluating math expression strings

```ts
import { StringEvaluator } from "mallory-ts";

const env = StringEvaluator.mathEnvironment(); // pi, e, sin, cos, sqrt, ...
StringEvaluator.evaluate("sin(pi/2) + 2^3", env); // ComplexNumber ≈ 9
```

Custom variables can be added via `new Environment("x", 3)` (see
[`src/Environment.ts`](../src/Environment.ts)) and passed instead of/merged
with `mathEnvironment()`.

## Polynomials

```ts
import { Polynomial } from "mallory-ts";

const p = Polynomial.parse("x^2 + 2x + 1"); // parses toPolyString's own format
p.evaluate(3); // 16
p.derivative().evaluate(3); // 8
Polynomial.divmod(p, Polynomial.parse("x + 1")); // long division: { quotient, remainder }
```

## Symbolic calculus

```ts
import { Symbolic, Calculus } from "mallory-ts";

Symbolic.toString(Symbolic.differentiate("x^3")); // "3*x^2"
Symbolic.toString(Symbolic.integrate("cos(x)")); // "sin(x)"
Symbolic.toString(Symbolic.taylor("exp(x)", "x", 0, 4)); // Taylor series about 0
Symbolic.evaluate("x^2 + 1", { x: 3 }); // 10

// or via the Calculus facade (string in, string out):
Calculus.derivativeFunction("x^3"); // "3*x^2"
```

Integration covers the elementary rules (power rule, `1/x`, linear-substitution
`sin`/`cos`/`exp`); anything outside that set throws `NotIntegrableError`
rather than returning a wrong answer — e.g. `Symbolic.integrate("sin(x^2)")`.
`Calculus.solveFor` (equation solving) is a documented, intentional gap.

## Exact and specialized number types

```ts
import { Rational, Quaternion, DualNumber, Interval } from "mallory-ts";

// Exact fractions (no floating-point drift)
Rational.from(1).divide(new Rational(3n)).add(Rational.from(1).divide(new Rational(6n))); // 1/2 exactly

// 3D rotation via quaternions (no gimbal lock)
const q = Quaternion.fromAxisAngle([0, 0, 1], Math.PI / 2);
q.rotateVector([1, 0, 0]); // ≈ [0, 1, 0]

// Forward-mode automatic differentiation — exact derivatives, no finite differences
DualNumber.derivative((x) => DualNumber.sin(x.multiply(x)), 1); // d/dx sin(x²) at x=1

// Rigorous numeric bounds
Interval.of(-2, 3).pow(2); // [0, 9] — correctly handles the range straddling zero
```

See [`test/NumberTypes.test.ts`](../test/NumberTypes.test.ts).

## Number theory

```ts
import { NumberTheory } from "mallory-ts";

NumberTheory.isProbablePrime(2n ** 61n - 1n); // true (Mersenne prime)
NumberTheory.isProbablePrime(561n); // false (Carmichael number — not a false positive)
NumberTheory.factorize(360n); // [[2n,3],[3n,2],[5n,1]]
NumberTheory.crt([2n, 3n, 2n], [3n, 5n, 7n]); // { x: 23n, modulus: 105n }
```

Everything here is `bigint`-based, so it's exact for arbitrarily large inputs
(no `Number.MAX_SAFE_INTEGER` ceiling).

## Group theory

```ts
import { Structure, GroupTheory } from "mallory-ts";

// GroupTheory composes with any Structure preset:
const gf7 = Structure.integersModulo(7);
const units = [1, 2, 3, 4, 5, 6];
GroupTheory.isGroup(units, gf7.multiply, gf7.equality); // true — GF(7)'s multiplicative group

const { op, identity } = GroupTheory.cyclicGroup(4);
GroupTheory.elementOrder(1, op, (a, b) => a === b, identity); // 4

GroupTheory.symmetricGroup(3); // all 6 permutations of {0,1,2} as a group
```

See [`test/NumberTheory.test.ts`](../test/NumberTheory.test.ts) for the S₃
non-abelian example and the Lagrange's-theorem cosets/index check.

## Root-finding, quadrature, and ODEs

```ts
import { Numerical } from "mallory-ts";

Numerical.newton((x) => x * x - 2, 1); // √2, quadratic convergence
Numerical.brent((x) => x * x - 2, 0, 2); // hybrid bisection/secant/inverse-quadratic

Numerical.simpson(Math.sin, 0, Math.PI); // ∫ sin = 2
Numerical.gaussLegendre((x) => x ** 4, 0, 1); // exact for low-degree polynomials

Numerical.rk4((_t, y) => [y[0]], [1], 0, 1, 0.01); // y' = y, y(0)=1 -> y(1) ≈ e
```

## Special functions & probability

```ts
import { SpecialFunctions, Distributions, HypothesisTests } from "mallory-ts";

SpecialFunctions.gamma(5); // 24  (4!)
SpecialFunctions.regularizedIncompleteBeta(0.5, 2, 3);

const normal = Distributions.normal(0, 1);
normal.cdf(0); // 0.5
normal.sample(); // draw from N(0,1)

HypothesisTests.tTestOneSample([5.1, 4.9, 5.0, 5.2, 4.8], 5); // { statistic, pValue, ... }
```

Every distribution exposes the same shape: `pdf`/`pmf`, `cdf`, `mean`,
`variance`, `sample` — backed by `SpecialFunctions`' exact closed forms
rather than numeric integration.

## FFT and convolution

```ts
import { FFT } from "mallory-ts";

FFT.fft([1, 0, 0, 0]); // flat spectrum (power-of-two length required)
FFT.fftPadded([1, 2, 3]); // zero-pads to the next power of two
FFT.convolve([1, 2, 3], [4, 5, 6]); // [4, 13, 28, 27, 18], via FFT
```

## Computational geometry

```ts
import { Geometry, Transform2D, type Point } from "mallory-ts";

const cloud: Point[] = [[0,0],[1,1],[2,2],[2,0],[0,2],[1,0.5]];
Geometry.convexHull(cloud); // the 4 outer corners; interior/collinear points drop out

const square: Point[] = [[0,0],[4,0],[4,4],[0,4]];
Geometry.pointInPolygon([2, 2], square); // true

const t = Transform2D.translation(1, 2).multiply(Transform2D.rotation(Math.PI / 2));
t.apply([1, 0]); // rotate then translate -> [1, 3]
```

## Graph algorithms

```ts
import { Graph } from "mallory-ts";

const g = new Graph<string>(true); // directed
g.addEdge("a", "b", 1).addEdge("b", "c", 2).addEdge("a", "c", 10);

g.shortestPath("a", "c"); // { distance: 3, path: ["a","b","c"] } — Dijkstra
g.minimumSpanningTree(); // Kruskal, on an undirected Graph
g.topologicalSort(); // null if the graph has a cycle
g.floydWarshall(); // { distances, order } — all-pairs shortest paths
```

## Permutations and cycles

```ts
import { Permutation, Cycle } from "mallory-ts";

const sigma = new Permutation([0, 1, 2], [1, 2, 0]); // 0->1, 1->2, 2->0
Permutation.compose(sigma, sigma); // apply sigma twice
```

`Cycle` and `GroupTheory.symmetricGroup` build on `Permutation` for
cycle-notation and full symmetric-group enumeration respectively.
