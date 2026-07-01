import assert from "node:assert/strict";
import { test } from "node:test";
import { ComplexMath } from "../src/ComplexMath.ts";
import { ComplexNumber } from "../src/ComplexNumber.ts";
import { Polygon } from "../src/Polygon.ts";
import { Polynomial } from "../src/Polynomial.ts";
import { Vector } from "../src/Vector.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps;
const pt = (...xs: number[]) => Vector.fromArray(xs);

test("Polynomial.evaluate via Horner", () => {
  const p = new Polynomial(1, 2, 3); // 3x^2 + 2x + 1
  assert.equal(p.evaluate(0), 1);
  assert.equal(p.evaluate(1), 6);
  assert.equal(p.evaluate(2), 17);
  // consistency with derivative: d/dx at x=2 -> 6x+2 = 14
  assert.equal(p.derivative().evaluate(2), 14);
});

test("Polynomial.add / subtract complete the ring", () => {
  const a = new Polynomial(1, 2, 3);
  const b = new Polynomial(4, 5);
  assert.deepEqual([...Polynomial.add(a, b)], [5, 7, 3]);
  assert.deepEqual([...Polynomial.subtract(a, b)], [-3, -3, 3]);
  // (a+b) - b == a
  assert.deepEqual([...Polynomial.subtract(Polynomial.add(a, b), b)], [...a]);
});

test("ComplexNumber.fromPolar inverts magnitude/angle", () => {
  const z = new ComplexNumber(3, 4);
  const back = ComplexNumber.fromPolar(ComplexMath.magnitude(z), ComplexMath.angle(z));
  assert.ok(close(back.value, 3) && close(back.iValue, 4));
  const i = ComplexNumber.fromPolar(1, Math.PI / 2);
  assert.ok(close(i.value, 0) && close(i.iValue, 1));
});

test("ComplexNumber.fromVector inverts toVector", () => {
  const z = new ComplexNumber(3, -2);
  assert.ok(ComplexNumber.fromVector(z.toVector()).equals(z));
});

test("ComplexNumber.fromXML inverts toXML", () => {
  const z = new ComplexNumber(3, -2);
  assert.ok(ComplexNumber.fromXML(z.toXML()).equals(z));
});

test("Polygon.centroid", () => {
  const square = new Polygon(pt(0, 0), pt(2, 0), pt(2, 2), pt(0, 2));
  const c = square.centroid();
  assert.ok(close(c.x as number, 1) && close(c.y as number, 1));
  const tri = new Polygon(pt(0, 0), pt(6, 0), pt(0, 3));
  const tc = tri.centroid();
  assert.ok(close(tc.x as number, 2) && close(tc.y as number, 1), "triangle centroid = vertex average");
});
