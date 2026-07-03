import assert from "node:assert/strict";
import { test } from "node:test";
import { Symbolic } from "../src/Symbolic.ts";

const evalAt = (expr: string, x: number) => Symbolic.evaluate(expr, { x });

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

test("compile matches evaluate across expression shapes", () => {
  const cases: Array<[string, Record<string, number>]> = [
    ["2 + 3*4", {}],
    ["2^3^2", {}],
    ["sin(pi/2)", {}],
    ["x^2 + 1", { x: 3 }],
    ["sin(x^2) + 2*x - 1", { x: 1.7 }],
    ["-x / (y + 1)", { x: 4, y: 2 }],
    ["sqrt(x) + ln(x) + tan(x)", { x: 2.5 }],
  ];
  for (const [expr, env] of cases) {
    const compiled = Symbolic.compile(expr)(env);
    const evaluated = Symbolic.evaluate(expr, env);
    assert.ok(
      Math.abs(compiled - evaluated) < 1e-12 || (Number.isNaN(compiled) && Number.isNaN(evaluated)),
      `compile/evaluate mismatch for "${expr}": ${compiled} vs ${evaluated}`,
    );
  }
});

test("compile walks the AST once and can be reused across many envs", () => {
  const compiled = Symbolic.compile("x^2");
  assert.equal(compiled({ x: 3 }), 9);
  assert.equal(compiled({ x: 4 }), 16);
  assert.equal(compiled({ x: -2 }), 4);
});

test("differentiateSteps result matches differentiate", () => {
  const { result } = Symbolic.differentiateSteps("x^2 + 2*x + 1");
  assert.equal(Symbolic.toString(result), Symbolic.toString(Symbolic.differentiate("x^2 + 2*x + 1")));
});

test("differentiateSteps records one step per subexpression, innermost first", () => {
  const { steps } = Symbolic.differentiateSteps("x^2 + 3*x");
  const rules = steps.map((s) => s.rule);
  // x^2 and 3*x differentiate before the top-level sum combines them.
  assert.ok(rules.includes("Power Rule"));
  assert.ok(rules.includes("Product Rule"));
  assert.equal(rules[rules.length - 1], "Sum Rule");
});

test("differentiateSteps names the chain rule with the outer function", () => {
  const { steps } = Symbolic.differentiateSteps("sin(x^2)");
  const outer = steps[steps.length - 1];
  assert.equal(outer.rule, "Chain Rule (sin)");
  assert.equal(Symbolic.toString(outer.input), "sin(x^2)");
});

test("differentiateSteps on a bare constant/variable records a single leaf step", () => {
  const constSteps = Symbolic.differentiateSteps("5").steps;
  assert.equal(constSteps.length, 1);
  assert.equal(constSteps[0].rule, "Constant Rule");

  const varSteps = Symbolic.differentiateSteps("x").steps;
  assert.equal(varSteps.length, 1);
  assert.equal(varSteps[0].rule, "Variable Rule");
});

test("differentiate inverse trig and hyperbolic functions", () => {
  const cases: Array<[string, (x: number) => number]> = [
    ["asin(x)", (x) => 1 / Math.sqrt(1 - x * x)],
    ["acos(x)", (x) => -1 / Math.sqrt(1 - x * x)],
    ["atan(x)", (x) => 1 / (1 + x * x)],
    ["sinh(x)", (x) => Math.cosh(x)],
    ["cosh(x)", (x) => Math.sinh(x)],
    ["tanh(x)", (x) => 1 / Math.cosh(x) ** 2],
  ];
  for (const [expr, expected] of cases) {
    const d = Symbolic.differentiate(expr);
    assert.ok(Math.abs(Symbolic.evaluate(d, { x: 0.4 }) - expected(0.4)) < 1e-9, expr);
  }
});

test("evaluate and compile agree on the new elementary functions", () => {
  for (const expr of ["asin(x)", "acos(x)", "atan(x)", "sinh(x)", "cosh(x)", "tanh(x)"]) {
    const evaluated = Symbolic.evaluate(expr, { x: 0.3 });
    const compiled = Symbolic.compile(expr)({ x: 0.3 });
    assert.ok(Math.abs(evaluated - compiled) < 1e-12, expr);
  }
});

test("integrate by parts", () => {
  // ∫ x sin(x) dx = sin(x) - x cos(x)
  const F = Symbolic.integrate("x*sin(x)");
  const check1 = (x: number) => Math.sin(x) - x * Math.cos(x);
  assert.ok(
    Math.abs(Symbolic.evaluate(F, { x: 1.2 }) - Symbolic.evaluate(F, { x: 0 }) - (check1(1.2) - check1(0))) < 1e-9,
  );
  assert.ok(Math.abs(Symbolic.evaluate(Symbolic.differentiate(F), { x: 0.7 }) - 0.7 * Math.sin(0.7)) < 1e-9);

  // ∫ x^2 exp(x) dx ; derivative recovers x^2 exp(x)
  const G = Symbolic.integrate("x^2*exp(x)");
  assert.ok(Math.abs(Symbolic.evaluate(Symbolic.differentiate(G), { x: 1.1 }) - 1.1 ** 2 * Math.exp(1.1)) < 1e-8);
});

test("integrate arctan/arcsin forms", () => {
  // ∫ 1/(1+x^2) dx = atan(x)
  const F = Symbolic.integrate("1/(1+x^2)");
  assert.ok(Math.abs(Symbolic.evaluate(Symbolic.differentiate(F), { x: 0.5 }) - 1 / (1 + 0.25)) < 1e-9);

  // ∫ 1/sqrt(1-x^2) dx = asin(x)
  const G = Symbolic.integrate("1/sqrt(1-x^2)");
  assert.ok(Math.abs(Symbolic.evaluate(Symbolic.differentiate(G), { x: 0.3 }) - 1 / Math.sqrt(1 - 0.09)) < 1e-9);
});

test("substitute replaces a variable with an expression", () => {
  const result = Symbolic.substitute("x^2 + 1", "x", "y+1");
  assert.equal(Symbolic.evaluate(result, { y: 2 }), Symbolic.evaluate("x^2 + 1", { x: 3 }));
});

test("expand distributes products over sums", () => {
  assert.equal(Symbolic.toString(Symbolic.expand("(x+1)^2")), "x^2 + 2*x + 1");
  assert.equal(Symbolic.toString(Symbolic.expand("(x-1)*(x+1)")), "x^2 - 1");
});

test("simplify collects like terms", () => {
  assert.equal(Symbolic.toString(Symbolic.simplify("x + x")), "2*x");
  assert.equal(Symbolic.toString(Symbolic.simplify("x*x")), "x^2");
  assert.equal(Symbolic.toString(Symbolic.simplify("a*b + b*a")), "2*(a*b)");
  assert.equal(Symbolic.toString(Symbolic.simplify("2*x - x")), "x");
  assert.equal(Symbolic.toString(Symbolic.simplify("x + 2*x + 3")), "3*x + 3");
});

test("solve finds real roots of linear, quadratic, and higher-degree polynomials", () => {
  const rootsOf = (expr: string) =>
    Symbolic.solve(expr)
      .map((e) => Symbolic.evaluate(e))
      .sort((a, b) => a - b);
  assert.deepEqual(rootsOf("x - 3"), [3]);
  assert.deepEqual(rootsOf("x^2 - 5*x + 6"), [2, 3]);
  assert.deepEqual(rootsOf("x^3 - 6*x^2 + 11*x - 6"), [1, 2, 3]);
  // no real roots
  assert.deepEqual(Symbolic.solve("x^2 + 1"), []);
});

test("solve verifies every root actually zeroes the polynomial", () => {
  for (const expr of ["x^2 - 2*x - 3", "2*x^2 - 3*x - 2", "x^3 - 6*x^2 + 11*x - 6"]) {
    for (const root of Symbolic.solve(expr)) {
      const value = Symbolic.evaluate(expr, { x: Symbolic.evaluate(root) });
      assert.ok(Math.abs(value) < 1e-6, `${expr} at root ${Symbolic.toString(root)}`);
    }
  }
});

test("solve rejects non-polynomial expressions", () => {
  assert.throws(() => Symbolic.solve("sin(x)"));
});

test("factor extracts linear factors and common terms", () => {
  const productAt = (expr: string, x: number) => Symbolic.evaluate(expr, { x });
  for (const expr of ["x^2 - 1", "x^2 - 5*x + 6", "2*x^2 + 4*x", "x^3 - 6*x^2 + 11*x - 6"]) {
    const factored = Symbolic.factor(expr);
    for (const x of [0.3, 1.7, -2.2]) {
      assert.ok(Math.abs(productAt(Symbolic.toString(factored), x) - productAt(expr, x)) < 1e-8, expr);
    }
  }
});

test("factor returns the simplified expression unchanged when not a polynomial", () => {
  assert.equal(Symbolic.toString(Symbolic.factor("sin(x)")), "sin(x)");
});

test("limit evaluates removable discontinuities via L'Hopital's rule", () => {
  assert.ok(Math.abs(Symbolic.limit("sin(x)/x", "x", 0) - 1) < 1e-6);
  assert.ok(Math.abs(Symbolic.limit("(x^2-1)/(x-1)", "x", 1) - 2) < 1e-6);
});

test("limit respects one-sided direction", () => {
  assert.ok(Symbolic.limit("1/x", "x", 0, "right") > 0);
  assert.ok(Symbolic.limit("1/x", "x", 0, "left") < 0);
});

test("toLatex renders fractions, radicals, and named functions", () => {
  assert.equal(Symbolic.toLatex("x^2/2"), "\\frac{x^{2}}{2}");
  assert.equal(Symbolic.toLatex("sqrt(x+1)"), "\\sqrt{x + 1}");
  assert.equal(Symbolic.toLatex("sin(x)/cos(x)"), "\\frac{\\sin\\left(x\\right)}{\\cos\\left(x\\right)}");
});

test("fromLatex round-trips everything toLatex produces", () => {
  for (const src of ["x^2/2", "sqrt(x+1)", "sin(x)/cos(x)", "a*b + c", "x^2 - 5*x + 6", "sinh(x) + cosh(x)"]) {
    const roundTripped = Symbolic.toString(Symbolic.fromLatex(Symbolic.toLatex(src)));
    assert.equal(roundTripped, Symbolic.toString(Symbolic.parse(src)));
  }
});

test("fromLatex parses fractions, radicals, and named function commands", () => {
  assert.equal(Symbolic.toString(Symbolic.fromLatex("\\frac{a}{b}")), "a/b");
  assert.equal(Symbolic.toString(Symbolic.fromLatex("\\sqrt{x+1}")), "sqrt(x + 1)");
  assert.equal(Symbolic.toString(Symbolic.fromLatex("\\sin\\left(x\\right)")), "sin(x)");
  assert.equal(Symbolic.toString(Symbolic.fromLatex("\\arcsin(x)")), "asin(x)");
  assert.equal(Symbolic.evaluate(Symbolic.fromLatex("\\sqrt[3]{x}"), { x: 8 }), 2);
});

test("fromLatex handles \\cdot/\\times, \\pi, braced exponents, and subscripts", () => {
  assert.equal(Symbolic.toString(Symbolic.fromLatex("2 \\cdot x + 3 \\times y")), "2*x + 3*y");
  assert.equal(Symbolic.evaluate(Symbolic.fromLatex("\\pi \\cdot x"), { x: 1 }), Math.PI);
  assert.equal(Symbolic.evaluate(Symbolic.fromLatex("\\frac{x^{2}}{2}"), { x: 4 }), 8);
  assert.equal(Symbolic.toString(Symbolic.fromLatex("x^{2} + y_{1}")), "x^2 + y_1");
});

test("fromLatex throws on constructs with no Expr equivalent", () => {
  assert.throws(() => Symbolic.fromLatex("\\int_0^1 x\\,dx"));
  assert.throws(() => Symbolic.fromLatex("\\sum_{i=1}^n i"));
  assert.throws(() => Symbolic.fromLatex("\\left|x\\right|"));
});
