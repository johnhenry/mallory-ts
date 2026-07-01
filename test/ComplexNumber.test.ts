import { test } from "node:test";
import assert from "node:assert/strict";
import { ComplexNumber } from "../src/ComplexNumber.ts";

test("constructor: empty is zero", () => {
  const z = new ComplexNumber();
  assert.equal(z.value, 0);
  assert.equal(z.iValue, 0);
});

test("constructor: (re, im)", () => {
  const z = new ComplexNumber(3, -2);
  assert.equal(z.value, 3);
  assert.equal(z.iValue, -2);
  assert.equal(z.re, 3);
  assert.equal(z.im, -2);
});

test("constructor: copy from ComplexNumber", () => {
  const a = new ComplexNumber(1, 2);
  const b = new ComplexNumber(a);
  assert.ok(b.equals(a));
  b.value = 9;
  assert.equal(a.value, 1, "copy must be independent");
});

test("constructor: from numeric string", () => {
  const z = new ComplexNumber("3+2*i");
  assert.equal(z.value, 3);
  assert.equal(z.iValue, 2);
});

test("re/im aliases write through", () => {
  const z = new ComplexNumber();
  z.re = 5;
  z.im = 7;
  assert.equal(z.value, 5);
  assert.equal(z.iValue, 7);
});

test("isComplex / isNotComplex", () => {
  assert.equal(ComplexNumber.isComplex(3), true);
  assert.equal(ComplexNumber.isComplex("3+2*i"), true);
  assert.equal(ComplexNumber.isComplex("banana"), false);
  assert.equal(ComplexNumber.isNotComplex("banana"), true);
  assert.equal(ComplexNumber.isComplex({}), false);
});

test("parse: real number does not throw (AS3 crash bug fixed)", () => {
  const z = ComplexNumber.parse("3.5");
  assert.equal(z.value, 3.5);
  assert.equal(z.iValue, 0);
});

test("parse: pure imaginary forms", () => {
  assert.ok(ComplexNumber.parse("i").equals(new ComplexNumber(0, 1)));
  assert.ok(ComplexNumber.parse("-i").equals(new ComplexNumber(0, -1)));
  assert.ok(ComplexNumber.parse("2*i").equals(new ComplexNumber(0, 2)));
  assert.ok(ComplexNumber.parse("2i").equals(new ComplexNumber(0, 2)));
  assert.ok(ComplexNumber.parse("-2.5i").equals(new ComplexNumber(0, -2.5)));
});

test("parse: full complex forms with either sign", () => {
  assert.ok(ComplexNumber.parse("3+2*i").equals(new ComplexNumber(3, 2)));
  assert.ok(ComplexNumber.parse("3-2*i").equals(new ComplexNumber(3, -2)));
  assert.ok(ComplexNumber.parse("3+2i").equals(new ComplexNumber(3, 2)));
  assert.ok(ComplexNumber.parse("-3-2i").equals(new ComplexNumber(-3, -2)));
  assert.ok(ComplexNumber.parse("-3+i").equals(new ComplexNumber(-3, 1)));
});

test("parse: garbage yields NaCN", () => {
  assert.ok(ComplexNumber.isNotComplex(ComplexNumber.parse("hello")));
  assert.ok(ComplexNumber.isNotComplex(ComplexNumber.parse("")));
});

test("toString: canonical forms", () => {
  assert.equal(new ComplexNumber(0, 0).toString(), "0");
  assert.equal(new ComplexNumber(3, 0).toString(), "3");
  assert.equal(new ComplexNumber(0, 1).toString(), "i");
  assert.equal(new ComplexNumber(0, -1).toString(), "-i");
  assert.equal(new ComplexNumber(0, 2).toString(), "2*i");
  assert.equal(new ComplexNumber(3, 2).toString(), "3+2*i");
});

test("toString: negative imaginary renders as a-b*i (bug fix)", () => {
  assert.equal(new ComplexNumber(3, -2).toString(), "3-2*i");
  assert.equal(new ComplexNumber(3, -1).toString(), "3-i");
});

test("toString round-trips through parse", () => {
  for (const [re, im] of [
    [3, 2],
    [3, -2],
    [-3, -2],
    [0, 5],
    [0, -5],
    [7, 0],
    [-4, 1],
    [2, -1],
  ] as const) {
    const z = new ComplexNumber(re, im);
    const back = ComplexNumber.parse(z.toString());
    assert.ok(back.equals(z), `${z.toString()} should round-trip`);
  }
});

test("neg / conj / flip", () => {
  const z = new ComplexNumber(3, -2);
  assert.ok(z.neg().equals(new ComplexNumber(-3, 2)));
  assert.ok(z.conj().equals(new ComplexNumber(3, 2)));
  assert.ok(z.flip().equals(new ComplexNumber(-2, 3)));
});

test("recip: 1/(a+bi) and zero -> NaCN", () => {
  const z = new ComplexNumber(1, 1);
  const r = z.recip();
  assert.ok(Math.abs(r.value - 0.5) < 1e-12);
  assert.ok(Math.abs(r.iValue + 0.5) < 1e-12);
  assert.ok(ComplexNumber.isNotComplex(new ComplexNumber(0, 0).recip()));
});

test("toVector returns [re, im]", () => {
  const z = new ComplexNumber(3, 4);
  assert.deepEqual([...z.toVector()], [3, 4]);
});

test("static infinities", () => {
  assert.equal(ComplexNumber.PositiveInfinity.value, Infinity);
  assert.equal(ComplexNumber.NegativeInfinityI.iValue, -Infinity);
  assert.ok(Number.isNaN(ComplexNumber.NaCN.value));
});
