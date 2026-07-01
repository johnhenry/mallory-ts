import assert from "node:assert/strict";
import { test } from "node:test";
import { Calculus, NotImplementedError } from "../src/Calculus.ts";
import { Symbolic } from "../src/Symbolic.ts";

const evalAt = (expr: string, x: number) => Symbolic.evaluate(expr, { x });

// --- Symbolic engine ---

test("parse and evaluate", () => {
  assert.equal(Symbolic.evaluate("2 + 3*4"), 14);
  assert.equal(Symbolic.evaluate("2^3^2"), 512, "right associative power");
  assert.ok(Math.abs(Symbolic.evaluate("sin(pi/2)") - 1) < 1e-12);
  assert.equal(Symbolic.evaluate("x^2 + 1", { x: 3 }), 10);
});

test("differentiate polynomials and products", () => {
  // d/dx x^3 = 3x^2
  assert.equal(Symbolic.toString(Symbolic.differentiate("x^3")), "3*x^2");
  // d/dx (x^2 + 2x + 1) = 2x + 2
  const d = Symbolic.differentiate("x^2 + 2*x + 1");
  assert.equal(Symbolic.evaluate(d, { x: 3 }), 8);
});

test("differentiate chain rule", () => {
  // d/dx sin(x^2) = 2x cos(x^2); at x=1 -> 2 cos 1
  const d = Symbolic.differentiate("sin(x^2)");
  assert.ok(Math.abs(Symbolic.evaluate(d, { x: 1 }) - 2 * Math.cos(1)) < 1e-9);
  // d/dx exp(2x) = 2 exp(2x); at 0 -> 2
  const d2 = Symbolic.differentiate("exp(2*x)");
  assert.ok(Math.abs(Symbolic.evaluate(d2, { x: 0 }) - 2) < 1e-9);
  // d/dx ln(x) = 1/x
  const d3 = Symbolic.differentiate("ln(x)");
  assert.ok(Math.abs(Symbolic.evaluate(d3, { x: 4 }) - 0.25) < 1e-9);
});

test("simplify applies identities", () => {
  assert.equal(Symbolic.toString(Symbolic.simplify("x + 0")), "x");
  assert.equal(Symbolic.toString(Symbolic.simplify("1*x + x*0")), "x");
  assert.equal(Symbolic.toString(Symbolic.simplify("x^1")), "x");
  assert.equal(Symbolic.toString(Symbolic.simplify("x^0")), "1");
});

test("integrate elementary forms (fundamental theorem check)", () => {
  // ∫ x^2 dx = x^3/3 ; derivative recovers x^2
  const F = Symbolic.integrate("x^2");
  assert.ok(Math.abs(Symbolic.evaluate(Symbolic.differentiate(F), { x: 2 }) - 4) < 1e-9);
  // ∫ cos(x) dx = sin(x)
  const G = Symbolic.integrate("cos(x)");
  assert.ok(Math.abs(Symbolic.evaluate(G, { x: Math.PI / 2 }) - 1) < 1e-9);
  // ∫ sin(2x) dx = -cos(2x)/2 ; linear-substitution
  const H = Symbolic.integrate("sin(2*x)");
  assert.ok(Math.abs(Symbolic.evaluate(Symbolic.differentiate(H), { x: 0.3 }) - Math.sin(0.6)) < 1e-9);
  // ∫ 1/x dx = ln x
  assert.equal(Symbolic.toString(Symbolic.integrate("1/x")), "ln(x)");
});

test("integrate rejects non-elementary forms", () => {
  assert.throws(() => Symbolic.integrate("sin(x^2)"));
});

test("taylor expansion of exp about 0", () => {
  // exp(x) ≈ 1 + x + x^2/2 + x^3/6 + x^4/24
  const t = Symbolic.taylor("exp(x)", "x", 0, 4);
  assert.ok(Math.abs(Symbolic.evaluate(t, { x: 1 }) - (1 + 1 + 0.5 + 1 / 6 + 1 / 24)) < 1e-12);
  void evalAt;
});

// --- Calculus facade ---

test("Calculus derivative/integral/taylor now work", () => {
  assert.equal(Calculus.derivativeFunction("x^3"), "3*x^2");
  assert.ok(Calculus.integralFunction("x^2").includes("x^3"));
  assert.ok(Calculus.taylorExpansion("exp(x)", "x", 0, 2).length > 0);
});

test("Calculus.solveFor is still unimplemented", () => {
  assert.throws(() => Calculus.solveFor("x^2 - 1"), NotImplementedError);
});
