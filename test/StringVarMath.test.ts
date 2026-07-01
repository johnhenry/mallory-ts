import assert from "node:assert/strict";
import { test } from "node:test";
import { StringVarMath } from "../src/StringVarMath.ts";

test("negative toggles a leading minus", () => {
  assert.equal(StringVarMath.negative("x"), "-x");
  assert.equal(StringVarMath.negative("-x"), "x");
});

test("add drops zero terms", () => {
  assert.equal(StringVarMath.add("0", "x"), "x");
  assert.equal(StringVarMath.add("x", "0"), "x");
  assert.equal(StringVarMath.add("x", "y"), "x + y");
});

test("multiply simplifies identities and squares", () => {
  assert.equal(StringVarMath.multiply("0", "x"), "0");
  assert.equal(StringVarMath.multiply("1", "x"), "x");
  assert.equal(StringVarMath.multiply("x", "1"), "x");
  assert.equal(StringVarMath.multiply("-1", "x"), "-x");
  assert.equal(StringVarMath.multiply("x", "-1"), "-x");
  assert.equal(StringVarMath.multiply("x", "x"), "(x^2)");
  assert.equal(StringVarMath.multiply("x", "y"), "(x * y)");
});

test("fromCode", () => {
  assert.equal(StringVarMath.fromCode(65), "A");
});
