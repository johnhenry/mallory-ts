import assert from "node:assert/strict";
import { test } from "node:test";
import { RealMath as R } from "../src/RealMath.ts";
import { Vector } from "../src/Vector.ts";

const v = (...xs: number[]) => Vector.fromArray(xs);
const mat = (rows: number[][]) => Vector.fromArray(rows.map((r) => Vector.fromArray(r)));
const deep = (m: Vector<unknown>) => m.map((r) => (r instanceof Vector ? [...r] : r));
const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps;

test("basic arithmetic incl. subtract bug fix", () => {
  assert.equal(R.add(2, 3), 5);
  assert.equal(R.subtract(5, 3), 2); // AS3 returned a*b = 15
  assert.equal(R.multiply(4, 5), 20);
  assert.equal(R.negative(7), -7);
});

test("divide handles zero denominators", () => {
  assert.equal(R.divide(6, 3), 2);
  assert.equal(R.divide(1, 0), Infinity);
  assert.equal(R.divide(-1, 0), -Infinity);
  assert.ok(Number.isNaN(R.divide(0, 0)));
});

test("equal respects tolerance (bug fix)", () => {
  assert.equal(R.equal(0.1 + 0.2, 0.3), false, "exact fails due to float");
  assert.equal(R.equal(0.1 + 0.2, 0.3, 1e-9), true, "tolerance works");
});

test("identity cleans floating noise", () => {
  assert.equal(R.sine(Math.PI), 0, "sin(pi) rounds to 0");
  assert.equal(R.cosine(Math.PI / 2), 0);
});

test("logarithm with base", () => {
  assert.ok(close(R.logarithm(8, 2), 3));
  assert.ok(close(R.logarithm(Math.E), 1));
});

test("hyperbolic identities", () => {
  assert.ok(close(R.hyperbolicCosine(0), 1));
  assert.ok(close(R.hyperbolicSine(0), 0));
  // cosh^2 - sinh^2 = 1
  assert.ok(close(R.hyperbolicCosine(1.3) ** 2 - R.hyperbolicSine(1.3) ** 2, 1, 1e-6));
});

test("roundTo", () => {
  assert.equal(R.roundTo(3.14159265, 2), 3.14);
  assert.equal(R.roundTo(2.5, 0), 3);
});

test("integrateN approximates a known integral (bug fix)", () => {
  // ∫₀¹ x² dx = 1/3
  assert.ok(
    close(
      R.integrateN((x) => x * x, 0, 1, 0.0001),
      1 / 3,
      1e-3,
    ),
  );
  // ∫₀^π sin x dx = 2
  assert.ok(close(R.integrateN(Math.sin, 0, Math.PI, 0.0001), 2, 1e-3));
});

test("differentiateN approximates a derivative (symmetric, bug fix)", () => {
  // d/dx x² at x=3 is 6
  assert.ok(
    close(
      R.differentiateN((x) => x * x, 3, 1e-4),
      6,
      1e-4,
    ),
  );
  // d/dx sin at 0 is 1
  assert.ok(close(R.differentiateN(Math.sin, 0, 1e-4), 1, 1e-6));
});

test("solveN finds a root", () => {
  // solve x² = 9 near guess 2 -> ~3
  const root = R.solveN((x) => x * x, 9, 1e-6, 2);
  assert.ok(close(Math.abs(root), 3, 1e-2));
});

test("normalProbability approximates the standard normal CDF", () => {
  // P(Z < 0) = 0.5
  assert.ok(close(R.standardNormalProbability(0), 0.5, 1e-3));
  // P(Z < 1.96) ~ 0.975
  assert.ok(close(R.standardNormalProbability(1.96), 0.975, 5e-3));
});

test("dotProduct and crossProduct (index bug fix)", () => {
  assert.equal(R.dotProduct(v(1, 2, 3), v(4, 5, 6)), 32);
  // standard basis: x cross y = z
  assert.deepEqual([...R.crossProduct(v(1, 0, 0), v(0, 1, 0))], [0, 0, 1]);
  // uses real z component (index 2), not index 3
  assert.deepEqual([...R.crossProduct(v(0, 0, 2), v(0, 3, 0))], [-6, 0, 0]);
});

test("pNorm / magnitude / distance", () => {
  assert.ok(close(R.magnitudeVector(v(3, 4)), 5));
  assert.ok(close(R.pNorm(v(1, -2, 3), 1), 6));
  assert.equal(R.pNorm(v(1, -5, 3), 0), 5, "0-norm = max abs");
  assert.ok(close(R.distanceVector(v(0, 0), v(3, 4)), 5));
});

test("angleBetween orthogonal vectors is pi/2", () => {
  assert.ok(close(R.angleBetween(v(1, 0), v(0, 1)), Math.PI / 2));
});

test("matrix add/subtract/scale", () => {
  const a = mat([
    [1, 2],
    [3, 4],
  ]);
  const b = mat([
    [5, 6],
    [7, 8],
  ]);
  assert.deepEqual(deep(R.addMatrix(a, b)), [
    [6, 8],
    [10, 12],
  ]);
  assert.deepEqual(deep(R.subtractMatrix(b, a)), [
    [4, 4],
    [4, 4],
  ]);
  assert.deepEqual(deep(R.scaleMatrix(a, 2)), [
    [2, 4],
    [6, 8],
  ]);
});

test("multiplyMatrix is a correct standard product", () => {
  const a = mat([
    [1, 2],
    [3, 4],
  ]);
  const b = mat([
    [5, 6],
    [7, 8],
  ]);
  assert.deepEqual(deep(R.multiplyMatrix(a, b)), [
    [19, 22],
    [43, 50],
  ]);
  const id = R.generateIdentity(2, 2);
  assert.deepEqual(deep(R.multiplyMatrix(a, id)), [
    [1, 2],
    [3, 4],
  ]);
});

test("determinant / permanent / trace", () => {
  assert.equal(
    R.determinant(
      mat([
        [1, 2],
        [3, 4],
      ]),
    ),
    -2,
  );
  assert.equal(
    R.determinant(
      mat([
        [2, 0, 0],
        [0, 3, 0],
        [0, 0, 4],
      ]),
    ),
    24,
  );
  assert.equal(
    R.permanent(
      mat([
        [1, 2],
        [3, 4],
      ]),
    ),
    10,
  );
  assert.equal(
    R.trace(
      mat([
        [1, 2],
        [3, 4],
      ]),
    ),
    5,
  );
});

test("invertMatrix (with pivoting) inverts and handles a zero pivot", () => {
  const a = mat([
    [4, 7],
    [2, 6],
  ]);
  const inv = R.invertMatrix(a);
  const prod = R.multiplyMatrix(a, inv).map((r) => (r as Vector<number>).map((x) => R.roundTo(x, 6)));
  assert.deepEqual(deep(prod as Vector<unknown>), [
    [1, 0],
    [0, 1],
  ]);
  // matrix whose first pivot is 0 — needs a row swap
  const b = mat([
    [0, 1],
    [1, 0],
  ]);
  assert.deepEqual(deep(R.invertMatrix(b)), [
    [0, 1],
    [1, 0],
  ]);
});

test("powerMatrix (bug fix: actually multiplies)", () => {
  const a = mat([
    [1, 1],
    [0, 1],
  ]);
  assert.deepEqual(deep(R.powerMatrix(a, 3)), [
    [1, 3],
    [0, 1],
  ]);
  assert.deepEqual(deep(R.powerMatrix(a, 0)), [
    [1, 0],
    [0, 1],
  ]);
});

test("sort is numeric (bug fix) so order stats are correct", () => {
  const data = v(10, 2, 33, 4, 1);
  assert.deepEqual([...R.sort(data)], [1, 2, 4, 10, 33]);
  assert.equal(R.minimum(data), 1);
  assert.equal(R.maximum(data), 33);
  assert.equal(R.median(v(3, 1, 2)), 2);
});

test("sum / product / mean", () => {
  assert.equal(R.sum(v(1, 2, 3, 4)), 10);
  assert.equal(R.product(v(1, 2, 3, 4)), 24);
  assert.equal(R.mean(v(2, 4, 6)), 4);
});

test("variance is sample variance (bug fix)", () => {
  // sample variance of [2,4,6] = ((−2)²+0+2²)/(3−1) = 8/2 = 4
  assert.equal(R.variance(v(2, 4, 6)), 4);
  assert.ok(close(R.standardDeviation(v(2, 4, 6)), 2));
  assert.ok(Number.isNaN(R.variance(v(5))));
});

test("interquartile range and outliers", () => {
  const data = v(1, 2, 3, 4, 5, 6, 7, 8, 100);
  assert.ok(R.isOutlier(data, 100));
  assert.ok([...R.outliers(data)].includes(100));
  assert.ok(![...R.outliersRemoved(data)].includes(100));
});

test("linear regression recovers a perfect line", () => {
  const x = v(0, 1, 2, 3, 4);
  const y = v(1, 3, 5, 7, 9); // y = 2x + 1
  assert.ok(close(R.linRegSlope(x, y), 2, 1e-9));
  assert.ok(close(R.linRegIntercept(x, y), 1, 1e-9));
  const f = R.linearRegressionFunction(x, y);
  assert.ok(close(f(10), 21, 1e-9));
  assert.ok(close(R.correlation(x, y), 1, 1e-9));
});

test("generic dispatch", () => {
  assert.equal(R.addGeneric(2, 3), 5);
  assert.deepEqual(deep(R.addGeneric(mat([[1, 2]]), mat([[3, 4]])) as Vector<unknown>), [[4, 6]]);
  assert.deepEqual([...(R.multiplyGeneric(3, v(1, 2, 3)) as Vector<number>)], [3, 6, 9]);
});
