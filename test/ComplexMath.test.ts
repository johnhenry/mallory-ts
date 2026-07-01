import { test } from "node:test";
import assert from "node:assert/strict";
import { Vector } from "../src/Vector.ts";
import { ComplexNumber } from "../src/ComplexNumber.ts";
import { ComplexMath as C } from "../src/ComplexMath.ts";

const z = (re: number, im = 0) => new ComplexNumber(re, im);
const cvec = (...xs: Array<[number, number] | number>) =>
  Vector.fromArray(xs.map((x) => (Array.isArray(x) ? z(x[0], x[1]) : z(x))));
const cmat = (rows: Array<Array<[number, number] | number>>) =>
  Vector.fromArray(rows.map((r) => Vector.fromArray(r.map((x) => (Array.isArray(x) ? z(x[0], x[1]) : z(x))))));

function near(a: ComplexNumber, re: number, im: number, eps = 1e-6): boolean {
  return Math.abs(a.value - re) <= eps && Math.abs(a.iValue - im) <= eps;
}

test("add / subtract / multiply", () => {
  assert.ok(C.add(z(1, 2), z(3, 4)).equals(z(4, 6)));
  assert.ok(C.subtract(z(5, 5), z(2, 1)).equals(z(3, 4)));
  // (1+2i)(3+4i) = 3+4i+6i-8 = -5+10i
  assert.ok(C.multiply(z(1, 2), z(3, 4)).equals(z(-5, 10)));
});

test("divide and the eight directed infinities (bug fix)", () => {
  // (1+i)/(1-i) = i
  assert.ok(near(C.divide(z(1, 1), z(1, -1)), 0, 1));
  assert.equal(C.divide(z(2, 0), z(0, 0)), ComplexNumber.PositiveInfinity);
  assert.equal(C.divide(z(-2, 0), z(0, 0)), ComplexNumber.NegativeInfinity);
  assert.equal(C.divide(z(1, 1), z(0, 0)), ComplexNumber.InfinityQ1);
  assert.equal(C.divide(z(0, 5), z(0, 0)), ComplexNumber.PositiveInfinityI);
  assert.ok(Number.isNaN(C.divide(z(0, 0), z(0, 0)).value));
});

test("magnitude / angle / conjugate / reciprocal", () => {
  assert.ok(Math.abs(C.magnitude(z(3, 4)) - 5) < 1e-12);
  assert.ok(Math.abs(C.angle(z(0, 1)) - Math.PI / 2) < 1e-12);
  assert.ok(C.conjugate(z(3, 4)).equals(z(3, -4)));
  assert.ok(near(C.reciprocal(z(1, 1)), 0.5, -0.5));
});

test("power at zero base is robust (bug fix)", () => {
  assert.ok(C.square(z(0)).equals(z(0)), "0^2 = 0");
  assert.ok(C.squareRoot(z(0)).equals(z(0)), "sqrt(0) = 0");
  assert.ok(near(C.power(z(0), z(0)), 1, 0), "0^0 = 1 by convention");
});

test("power and roots", () => {
  assert.ok(near(C.square(z(3, 0)), 9, 0));
  assert.ok(near(C.square(z(0, 1)), -1, 0), "i^2 = -1");
  assert.ok(near(C.squareRoot(z(-1, 0)), 0, 1), "sqrt(-1) = i");
  assert.ok(near(C.power(z(2, 0), z(10, 0)), 1024, 0));
});

test("logarithm", () => {
  assert.ok(near(C.logarithm(C.E), 1, 0), "ln(e) = 1");
  assert.ok(near(C.logarithm(z(0, 1)), 0, Math.PI / 2), "ln(i) = i*pi/2");
});

test("euler: e^(i*pi) = -1", () => {
  assert.ok(near(C.power(C.E, z(0, Math.PI)), -1, 0, 1e-5));
});

test("trigonometry on reals matches Math", () => {
  assert.ok(near(C.sine(z(0.7)), Math.sin(0.7), 0, 1e-6));
  assert.ok(near(C.cosine(z(1.2)), Math.cos(1.2), 0, 1e-6));
  // sin(i) = i*sinh(1)
  assert.ok(near(C.sine(z(0, 1)), 0, Math.sinh(1), 1e-6));
});

test("inverse trig round-trips", () => {
  assert.ok(near(C.arcSine(z(0)), 0, 0), "arcsin(0) = 0 (bug fix via power(0))");
  assert.ok(near(C.sine(C.arcSine(z(0.4, 0.1))), 0.4, 0.1, 1e-5));
});

test("vector add / dot / cross (index bug fix)", () => {
  assert.deepEqual([...C.addVector(cvec(1, 2), cvec(3, 4))].map(String), ["4", "6"]);
  assert.ok(C.dotProduct(cvec(1, 2, 3), cvec(4, 5, 6)).equals(z(32)));
  const cross = C.crossProduct(cvec(1, 0, 0), cvec(0, 1, 0));
  assert.ok((cross[2] as ComplexNumber).equals(z(1)));
  // real z-components (index 2), not index 3
  const cross2 = C.crossProduct(cvec(0, 0, 2), cvec(0, 3, 0));
  assert.ok((cross2[0] as ComplexNumber).equals(z(-6)));
});

test("matrix multiply and determinant", () => {
  const a = cmat([[1, 2], [3, 4]]);
  const b = cmat([[5, 6], [7, 8]]);
  const prod = C.multiplyMatrix(a, b);
  assert.ok((prod[0] as Vector<ComplexNumber>)[0].equals(z(19)));
  assert.ok((prod[1] as Vector<ComplexNumber>)[1].equals(z(50)));
  assert.ok(C.determinant(a).equals(z(-2)));
});

test("invertMatrix produces the inverse (pivoting bug fix)", () => {
  const a = cmat([[0, 1], [1, 0]]); // needs a row swap
  const inv = C.invertMatrix(a);
  const prod = C.multiplyMatrix(a, inv);
  assert.ok((prod[0] as Vector<ComplexNumber>)[0].equals(z(1)));
  assert.ok((prod[1] as Vector<ComplexNumber>)[1].equals(z(1)));
  assert.ok((prod[0] as Vector<ComplexNumber>)[1].equals(z(0)));
});

test("statistics: mean, sample variance (bug fix)", () => {
  const data = cvec(2, 4, 6);
  assert.ok(C.mean(data).equals(z(4)));
  assert.ok(near(C.variance(data), 4, 0), "sample variance = 4");
  assert.ok(near(C.standardDeviation(data), 2, 0));
});

test("sort is numeric via comparators", () => {
  const data = cvec(10, 2, 33, 4, 1);
  assert.deepEqual([...C.sort(data)].map((c) => (c as ComplexNumber).value), [1, 2, 4, 10, 33]);
  assert.ok(C.minimum(data).equals(z(1)));
  assert.ok(C.maximum(data).equals(z(33)));
});

test("normalDistribution is a proper PDF (bug fix)", () => {
  // standard normal peak at 0 is 1/sqrt(2pi) ~ 0.39894
  const pdf = C.standardNormalDistribution(z(0));
  assert.ok(near(pdf, 1 / Math.sqrt(2 * Math.PI), 0, 1e-6));
  // CDF at 0 ~ 0.5
  assert.ok(near(C.standardNormalProbability(z(0)), 0.5, 0, 1e-3));
});

test("linear regression on complex-wrapped reals", () => {
  const x = cvec(0, 1, 2, 3, 4);
  const y = cvec(1, 3, 5, 7, 9);
  assert.ok(near(C.linRegSlope(x, y), 2, 0, 1e-6));
  assert.ok(near(C.linRegIntercept(x, y), 1, 0, 1e-6));
});
