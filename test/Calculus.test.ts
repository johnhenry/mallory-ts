import { test } from "node:test";
import assert from "node:assert/strict";
import { Calculus, NotImplementedError } from "../src/Calculus.ts";

test("unimplemented methods throw NotImplementedError", () => {
  assert.throws(() => Calculus.solveFor("x+1"), NotImplementedError);
  assert.throws(() => Calculus.integralFunction("x"), NotImplementedError);
  assert.throws(() => Calculus.derivativeFunction("x"), NotImplementedError);
  assert.throws(() => Calculus.taylorExpansion("x"), NotImplementedError);
});
